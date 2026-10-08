// The drawing and SVG export use the same geometry as the standalone Footpath tool.
export type Point = { x: number; y: number };
export type Plan = { x: number; y: number; width: number; height: number; url: string };
export type RouteStyle = { symbol: 'footprints' | 'arrows'; color: string; size: number };

const ns = 'http://www.w3.org/2000/svg';
const rounded = (n: number) => Math.round(n * 100) / 100;
export const pathData = (points: Point[]) => points.map((p, i) => `${i ? 'L' : 'M'} ${rounded(p.x)} ${rounded(p.y)}`).join(' ');
export const symbolUnit = (plan: Plan, size: number) => Math.min(plan.width, plan.height) / 65 * size / 100;

function node(tag: string, attrs: Record<string, string | number> = {}, parent?: Element) {
  const el = document.createElementNS(ns, tag);
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, String(value));
  parent?.append(el);
  return el;
}

export function artwork(root: Element, plan: Plan, points: Point[], pin: Point | null, style: RouteStyle, office: string) {
  const size = symbolUnit(plan, style.size);
  const arrows = style.symbol === 'arrows';
  node('path', { id: 'route-centerline', d: pathData(points), fill: 'none', stroke: 'none' }, root);
  const symbols = node('g', { id: arrows ? 'arrows' : 'footprints', fill: style.color }, root);
  const segments = points.slice(1).map((p, i) => {
    const a = points[i], dx = p.x - a.x, dy = p.y - a.y;
    return { a, dx, dy, length: Math.hypot(dx, dy) };
  }).filter(s => s.length > 0);
  const total = segments.reduce((sum, s) => sum + s.length, 0);
  const spacing = Math.max(size * 1.65, total / 3000);
  let segmentIndex = 0, start = 0, step = 0;
  for (let distance = size / 2; distance < total; distance += spacing) {
    while (segmentIndex < segments.length - 1 && distance > start + segments[segmentIndex].length) {
      start += segments[segmentIndex++].length;
    }
    const s = segments[segmentIndex], t = (distance - start) / s.length;
    const side = arrows ? 0 : (step++ % 2 ? 1 : -1);
    const x = s.a.x + s.dx * t - s.dy / s.length * size * .36 * side;
    const y = s.a.y + s.dy * t + s.dx / s.length * size * .36 * side;
    const symbol = node('g', { transform: `translate(${rounded(x)} ${rounded(y)}) rotate(${rounded(Math.atan2(s.dy, s.dx) * 180 / Math.PI + 90)}) scale(${size / 20} ${size / 20})` }, symbols);
    if (arrows) node('path', { d: 'M0-11 L8-2 H3 V10 H-3 V-2 H-8 Z' }, symbol);
    else node('path', { d: 'M-3 3 C-6-1-5-10-1-11 C4-12 6-7 4-3 L2 3 Z M-3 5 L2 5 L2 9 Q-1 12-3 9 Z', transform: `scale(${side} 1)` }, symbol);
  }
  if (pin) {
    const marker = node('g', { id: 'office-pin', 'data-pin': 'true', transform: `translate(${rounded(pin.x)} ${rounded(pin.y)}) scale(${size / 12})`, fill: style.color }, root);
    node('path', { d: 'M0 0 C-4-6-10-12-10-19 A10 10 0 1 1 10-19 C10-12 4-6 0 0Z', stroke: '#fff', 'stroke-width': 1.5 }, marker);
    node('circle', { cx: 0, cy: -19, r: 3.5, fill: '#fff' }, marker);
    node('title', {}, marker).textContent = office || 'Office';
  }
}

export function renderOverlay(svg: SVGSVGElement, plan: Plan, points: Point[], pin: Point | null, style: RouteStyle, office: string) {
  svg.replaceChildren();
  artwork(svg, plan, points, pin, style, office);
  const size = symbolUnit(plan, style.size);
  const guide = node('g', { 'data-editor-only': 'true' }, svg);
  node('path', { d: pathData(points), fill: 'none', stroke: style.color, 'stroke-opacity': .3, 'stroke-width': size * .12, 'stroke-dasharray': `${size * .3} ${size * .3}`, 'pointer-events': 'none' }, guide);
  points.forEach((p, i) => {
    const handle = node('g', { 'data-index': i }, guide);
    node('circle', { cx: p.x, cy: p.y, r: Math.max(size * .9, plan.width * .02), fill: 'transparent' }, handle);
    node('circle', { cx: p.x, cy: p.y, r: size * .26, fill: '#fff', stroke: style.color, 'stroke-width': size * .12 }, handle);
  });
}

export function exportSvg(plan: Plan, points: Point[], pin: Point, style: RouteStyle, office: string, entrance: string) {
  const svg = node('svg', { xmlns: ns, viewBox: `${plan.x} ${plan.y} ${plan.width} ${plan.height}`, width: plan.width, height: plan.height, role: 'img' });
  node('title', {}, svg).textContent = `Route to ${office}`;
  node('metadata', {}, svg).textContent = JSON.stringify({
    entrancePoint: entrance, svgPath: pathData(points), officeLabel: office,
    officePin: { x: rounded(pin.x), y: rounded(pin.y) },
    floorPlan: { viewBox: [plan.x, plan.y, plan.width, plan.height] },
    style: { symbol: style.symbol, color: style.color, symbolSize: symbolUnit(plan, style.size), footprintSize: symbolUnit(plan, style.size) },
  });
  artwork(svg, plan, points, pin, style, office);
  return new XMLSerializer().serializeToString(svg);
}

export function readDrawing(source: string, plan: Plan) {
  const xml = new DOMParser().parseFromString(source, 'image/svg+xml');
  const root = xml.documentElement;
  const data = JSON.parse(root.querySelector('metadata')?.textContent ?? '{}');
  const box = root.getAttribute('viewBox')?.trim().split(/[\s,]+/).map(Number);
  if (xml.querySelector('parsererror') || root.localName !== 'svg' || !box || box.length !== 4 ||
    box.some((n, i) => Math.abs(n - [plan.x, plan.y, plan.width, plan.height][i]) > .0001)) throw new Error('The saved route does not match this floor plan.');
  const matches = [...String(data.svgPath ?? '').matchAll(/[ML]\s*(-?(?:\d*\.)?\d+(?:e[+-]?\d+)?)[\s,]+(-?(?:\d*\.)?\d+(?:e[+-]?\d+)?)/gi)];
  const points = matches.map(match => ({ x: Number(match[1]), y: Number(match[2]) }));
  const pin = data.officePin;
  if (points.length < 2 || !pin || !Number.isFinite(pin.x) || !Number.isFinite(pin.y)) throw new Error('This older route has no editable drawing data. Draw it again to replace it.');
  const rawSize = Number(data.style?.symbolSize ?? data.style?.footprintSize);
  const size = Number.isFinite(rawSize) ? rawSize / (Math.min(plan.width, plan.height) / 65) * 100 : 100;
  return {
    points, pin: { x: pin.x as number, y: pin.y as number },
    style: { symbol: data.style?.symbol === 'arrows' ? 'arrows' : 'footprints', color: /^#[0-9a-f]{6}$/i.test(data.style?.color) ? data.style.color : '#3c1053', size: Math.max(40, Math.min(220, Math.round(size / 10) * 10)) } as RouteStyle,
  };
}
