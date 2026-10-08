import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { exportSvg, readDrawing, renderOverlay, type Plan, type Point, type RouteStyle } from './route-editor-artwork';
import './RouteEditor.css';

type Office = { id: number; roomNumber: string; floorPlanId: number; buildingName: string; floorLevel: number };
type FloorPlan = { id: number; fileRef: string };
type Route = { id: number; officeId: number; entrancePoint: string; svgOverlay: string | null };
type History = { points: Point[]; pin: Point | null };
const returnUrl = '/buildings?section=routes';

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error('The route editor could not load its data.');
  return response.json() as Promise<T>;
}

async function loadPlan(fileRef: string): Promise<Plan> {
  const response = await fetch(fileRef);
  if (!response.ok) throw new Error('The floor plan could not be loaded.');
  const xml = new DOMParser().parseFromString(await response.text(), 'image/svg+xml');
  const root = xml.documentElement;
  const box = root.getAttribute('viewBox')?.trim().split(/[\s,]+/).map(Number);
  if (xml.querySelector('parsererror') || root.localName !== 'svg' || !box || box.length !== 4 || !box.every(Number.isFinite) || box[2] <= 0 || box[3] <= 0) {
    throw new Error('This floor plan needs a valid SVG viewBox.');
  }
  root.setAttribute('width', String(box[2]));
  root.setAttribute('height', String(box[3]));
  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(root)], { type: 'image/svg+xml' }));
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    return { x: box[0], y: box[1], width: box[2], height: box[3], url };
  } catch {
    URL.revokeObjectURL(url);
    throw new Error('The floor plan could not be displayed.');
  }
}

async function loadOverlay(overlay: string) {
  if (!overlay.startsWith('/api/files/routes/')) return overlay;
  const response = await fetch(overlay);
  if (!response.ok) throw new Error('The saved route could not be loaded.');
  return response.text();
}

function messageFrom(response: Response, fallback: string) {
  return response.json().then((data: { error?: { message?: string } }) => data.error?.message ?? fallback).catch(() => fallback);
}

export default function RouteEditor() {
  const { routeId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [offices, setOffices] = useState<Office[]>([]);
  const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [route, setRoute] = useState<Route | null>(null);
  const [officeId, setOfficeId] = useState(Number(searchParams.get('officeId')) || 0);
  const [entrance, setEntrance] = useState('');
  const [plan, setPlan] = useState<Plan | null>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [pin, setPin] = useState<Point | null>(null);
  const [style, setStyle] = useState<RouteStyle>({ symbol: 'footprints', color: '#3c1053', size: 100 });
  const [mode, setMode] = useState<'draw' | 'pin' | 'pan'>('draw');
  const [history, setHistory] = useState<History[]>([]);
  const [zoom, setZoom] = useState(1);
  const [viewportWidth, setViewportWidth] = useState(800);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [dirty, setDirty] = useState(false);
  const [drawingLoaded, setDrawingLoaded] = useState(!routeId);
  const viewportRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<{ id: number; index: number | 'pin' | 'pan'; x?: number; y?: number; left?: number; top?: number } | null>(null);
  const loadedRef = useRef(false);
  const office = offices.find(item => item.id === officeId);
  const floorPlan = floorPlans.find(item => item.id === office?.floorPlanId);
  const ready = !!plan && points.length >= 2 && !!pin && !!office && !!entrance.trim();
  const detailsOnly = drawingLoaded && !!route?.svgOverlay && officeId === route.officeId && points.length === 0 && !pin && !!entrance.trim();

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getJson<{ offices: Office[] }>('/api/admin/offices'),
      getJson<{ floorPlans: FloorPlan[] }>('/api/admin/floor-plans'),
      getJson<{ routes: Route[] }>('/api/admin/routes'),
    ]).then(([officeData, planData, routeData]) => {
      if (cancelled) return;
      setOffices(officeData.offices);
      setFloorPlans(planData.floorPlans);
      setRoutes(routeData.routes);
      if (routeId) {
        const found = routeData.routes.find(item => item.id === Number(routeId));
        if (!found) throw new Error('This route could not be found.');
        setRoute(found);
        setOfficeId(found.officeId);
        setEntrance(found.entrancePoint);
        if (!found.svgOverlay) setDrawingLoaded(true);
      }
    }).catch(cause => { if (!cancelled) setError(cause instanceof Error ? cause.message : 'The editor could not be opened.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [routeId]);

  useEffect(() => {
    if (!floorPlan) return;
    let cancelled = false;
    loadPlan(floorPlan.fileRef).then(async loaded => {
      if (cancelled) { URL.revokeObjectURL(loaded.url); return; }
      setPlan(loaded);
      setZoom(1);
      if (route && route.officeId === officeId && !loadedRef.current && route.svgOverlay) {
        loadedRef.current = true;
        try {
          const drawing = readDrawing(await loadOverlay(route.svgOverlay), loaded);
          if (cancelled) return;
          setPoints(drawing.points); setPin(drawing.pin); setStyle(drawing.style);
        } catch (cause) {
          if (!cancelled) setNotice(cause instanceof Error ? cause.message : 'Draw this route again to edit it.');
        } finally {
          if (!cancelled) setDrawingLoaded(true);
        }
      }
    }).catch(cause => { if (!cancelled) { setError(cause instanceof Error ? cause.message : 'The floor plan could not be loaded.'); setDrawingLoaded(true); } });
    return () => { cancelled = true; };
  }, [floorPlan, route, officeId]);

  useEffect(() => () => { if (plan) URL.revokeObjectURL(plan.url); }, [plan]);
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const observer = new ResizeObserver(() => setViewportWidth(viewport.clientWidth));
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [loading]);
  useEffect(() => {
    if (plan && overlayRef.current) renderOverlay(overlayRef.current, plan, points, pin, style, office?.roomNumber ?? 'Office');
  }, [plan, points, pin, style, office?.roomNumber, step]);
  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => { if (dirty) event.preventDefault(); };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [dirty]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z' && !(event.target as Element)?.matches('input,textarea,select')) {
        event.preventDefault(); undo();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  function checkpoint() {
    setHistory(current => [...current.slice(-99), { points: points.map(p => ({ ...p })), pin: pin && { ...pin } }]);
    setDirty(true);
  }
  function undo() {
    const previous = history.at(-1);
    if (!previous) return;
    setPoints(previous.points); setPin(previous.pin); setHistory(current => current.slice(0, -1)); setDirty(true);
  }
  function changeOffice(next: number) {
    if (next === officeId) return;
    if ((points.length || pin) && !window.confirm('Changing office starts a new drawing. Continue?')) return;
    setOfficeId(next); setPlan(null); setPoints([]); setPin(null); setHistory([]); setNotice(''); setError(''); setDrawingLoaded(true); setDirty(true);
  }
  function position(event: React.PointerEvent<SVGSVGElement>): Point {
    const svg = overlayRef.current!;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(svg.getScreenCTM()!.inverse());
    return { x: Math.max(plan!.x, Math.min(plan!.x + plan!.width, point.x)), y: Math.max(plan!.y, Math.min(plan!.y + plan!.height, point.y)) };
  }
  function pointerDown(event: React.PointerEvent<SVGSVGElement>) {
    if (!plan || event.button !== 0 || dragRef.current) return;
    if (mode === 'pan') {
      const viewport = viewportRef.current!;
      dragRef.current = { id: event.pointerId, index: 'pan', x: event.clientX, y: event.clientY, left: viewport.scrollLeft, top: viewport.scrollTop };
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }
    const handle = (event.target as Element).closest('[data-index], [data-pin]');
    checkpoint();
    if (handle) {
      dragRef.current = { id: event.pointerId, index: handle.hasAttribute('data-index') ? Number((handle as HTMLElement).dataset.index) : 'pin' };
      event.currentTarget.setPointerCapture(event.pointerId);
    } else if (mode === 'pin') setPin(position(event));
    else setPoints(current => [...current, position(event)]);
  }
  function pointerMove(event: React.PointerEvent<SVGSVGElement>) {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    if (drag.index === 'pan') {
      viewportRef.current?.scrollTo((drag.left ?? 0) + (drag.x ?? 0) - event.clientX, (drag.top ?? 0) + (drag.y ?? 0) - event.clientY);
      return;
    }
    const next = position(event);
    if (drag.index === 'pin') setPin(next);
    else setPoints(current => current.map((item, index) => index === drag.index ? next : item));
  }
  function cancel() {
    if (dirty && !window.confirm('Discard unsaved route changes?')) return;
    navigate(returnUrl);
  }
  async function save() {
    if ((!ready && !detailsOnly) || !office) return;
    setSaving(true); setError('');
    try {
      let svgOverlay = route?.svgOverlay ?? null;
      if (ready && plan && pin) {
        const svg = exportSvg(plan, points, pin, style, office.roomNumber, entrance.trim());
        const file = new File([svg], `${office.roomNumber}-route.svg`, { type: 'image/svg+xml' });
        if (file.size > 4 * 1024 * 1024) throw new Error('The route SVG exceeds the 4 MB upload limit.');
        const upload = await fetch('/api/files/routes', { method: 'POST', headers: { 'Content-Type': 'image/svg+xml' }, body: file });
        if (!upload.ok) throw new Error(await messageFrom(upload, 'The route SVG could not be uploaded.'));
        svgOverlay = (await upload.json() as { fileRef: string }).fileRef;
      }
      const response = await fetch(route ? `/api/admin/routes/${route.id}` : '/api/admin/routes', {
        method: route ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ officeId: office.id, entrancePoint: entrance.trim(), svgOverlay }),
      });
      if (!response.ok) throw new Error(await messageFrom(response, 'The route could not be saved.'));
      setDirty(false);
      navigate(returnUrl);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'The route could not be saved.'); }
    finally { setSaving(false); }
  }

  const fit = plan ? Math.max(1, viewportWidth - 48) / plan.width : 1;
  const stageStyle = plan ? { width: plan.width * fit * zoom, height: plan.height * fit * zoom } : undefined;

  return <main className="route-editor-page">
    <header className="route-editor-header">
      <div><p className="eyebrow">Route administration</p><h1>{route ? 'Edit route' : 'Create route'}</h1></div>
      <button type="button" className="route-editor-quiet" onClick={cancel}>← Back to routes</button>
    </header>
    {error && <p className="status-message status-message--error route-editor-error" role="alert">{error}</p>}
    {loading ? <p className="status-message">Loading editor…</p> : <div className="route-editor-layout">
      <div className="route-editor-steps" aria-label="Editor steps">
        {['Set up', 'Draw', 'Finish'].map((label, index) => <button
          type="button" key={label} className={step === index ? 'active' : ''}
          disabled={index === 1 ? !plan || !entrance.trim() : index === 2 ? !ready && !detailsOnly : false}
          onClick={() => setStep(index)}
        >{index + 1}. {label}</button>)}
      </div>
      <aside className="route-editor-sidebar">
        <section className={`route-editor-section ${step === 0 ? 'route-editor-section--active' : ''}`}>
          <h2>1. Choose the destination</h2>
          <label>Office<select value={officeId || ''} onChange={event => changeOffice(Number(event.target.value))}>
            <option value="">Select an office</option>
            {offices.filter(item => item.id === route?.officeId || !routes.some(other => other.officeId === item.id)).map(item => <option key={item.id} value={item.id}>{item.roomNumber} · {item.buildingName} · Floor {item.floorLevel}</option>)}
          </select></label>
          <label>Entrance<input value={entrance} onChange={event => { setEntrance(event.target.value); setDirty(true); }} placeholder="e.g. Main entrance" maxLength={255} /></label>
          {office && <p className="route-editor-hint">Floor plan: {office.buildingName}, floor {office.floorLevel}. It loads automatically.</p>}
          <button type="button" className="route-editor-next" disabled={!plan || !entrance.trim()} onClick={() => setStep(1)}>Next: draw route →</button>
        </section>
        <section className={`route-editor-section ${step === 1 ? 'route-editor-section--active' : ''}`}>
          <h2>2. Map the way</h2>
          {notice && <p className="route-editor-notice" role="status">{notice}</p>}
          <div className="route-editor-segmented"><button type="button" aria-pressed={mode === 'draw'} onClick={() => setMode('draw')}>Draw</button><button type="button" aria-pressed={mode === 'pin'} onClick={() => setMode('pin')}>Pin</button><button type="button" aria-pressed={mode === 'pan'} onClick={() => setMode('pan')}>Pan</button></div>
          <p className="route-editor-hint">{mode === 'draw' ? 'Tap the entrance, then each corridor turn. Drag a point to adjust it.' : mode === 'pin' ? 'Tap the office to place its pin. Drag it to adjust.' : 'Drag the floor plan to move around when zoomed in.'}</p>
          <div className="route-editor-row"><button type="button" disabled={!history.length} onClick={undo}>↶ Undo</button><button type="button" disabled={!points.length && !pin} onClick={() => { checkpoint(); setPoints([]); setPin(null); }}>Clear route</button></div>
          <button type="button" className="route-editor-next" disabled={(points.length < 2 || !pin) && !detailsOnly} onClick={() => setStep(2)}>Next: finish →</button>
        </section>
        <section className={`route-editor-section ${step === 2 ? 'route-editor-section--active' : ''}`}>
          <h2>3. Style and save</h2>
          <label>Route style<select value={style.symbol} onChange={event => { setStyle({ ...style, symbol: event.target.value as RouteStyle['symbol'] }); setDirty(true); }}><option value="footprints">Footprints</option><option value="arrows">Arrows</option></select></label>
          <label>Symbol size <output>{style.size}%</output><input type="range" min="40" max="220" step="10" value={style.size} onChange={event => { setStyle({ ...style, size: Number(event.target.value) }); setDirty(true); }} /></label>
          <label>Route colour<input type="color" value={style.color} onChange={event => { setStyle({ ...style, color: event.target.value }); setDirty(true); }} /></label>
          <button type="button" className="primary-button" disabled={(!ready && !detailsOnly) || saving} onClick={() => void save()}>{saving ? 'Saving route…' : detailsOnly ? 'Save route details' : 'Save route'}</button>
          <p className="route-editor-hint">The route is saved to {office?.roomNumber ?? 'the selected office'} and appears in the lecturer directions.</p>
        </section>
      </aside>
      <div className={`route-editor-workspace ${step === 0 ? 'route-editor-workspace--setup' : ''}`}>
        <div className="route-editor-toolbar"><strong>{office ? `${office.buildingName} · ${office.roomNumber}` : 'Floor plan canvas'}</strong><div><button type="button" disabled={!plan} onClick={() => setZoom(value => Math.max(.5, value - .25))} aria-label="Zoom out">−</button><output>{Math.round(zoom * 100)}%</output><button type="button" disabled={!plan} onClick={() => setZoom(value => Math.min(6, value + .25))} aria-label="Zoom in">+</button><button type="button" disabled={!plan} onClick={() => { setZoom(1); viewportRef.current?.scrollTo(0, 0); }}>Fit</button></div></div>
        <div className="route-editor-viewport" ref={viewportRef}>
          {plan ? <div className="route-editor-stage" style={stageStyle}><img src={plan.url} alt="" draggable={false} /><svg ref={overlayRef} xmlns="http://www.w3.org/2000/svg" viewBox={`${plan.x} ${plan.y} ${plan.width} ${plan.height}`} aria-label="Route drawing area" onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={() => { dragRef.current = null; }} onPointerCancel={() => { dragRef.current = null; }} onLostPointerCapture={() => { dragRef.current = null; }} /></div>
            : <div className="route-editor-empty">Select an office to load its floor plan.</div>}
        </div>
        <footer className="route-editor-status" role="status">{points.length} route points · {pin ? 'Office pinned' : 'Place an office pin'}{ready ? ' · Ready to save' : ''}</footer>
      </div>
    </div>}
  </main>;
}
