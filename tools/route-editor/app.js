/* Dependency-free editor. All geometry uses the original floorplan coordinates. */
const $ = (id) => document.getElementById(id);
const ns = 'http://www.w3.org/2000/svg';
let plan = null, points = [], pin = null, mode = 'draw', history = [], zoom = 1, drag = null, loadId = 0;
const rounded = (n) => Math.round(n * 100) / 100;
const pathData = () => points.map((p, i) => `${i ? 'L' : 'M'} ${rounded(p.x)} ${rounded(p.y)}`).join(' ');
const unit = () => Math.min(plan.width, plan.height) / 65 * Number($('size').value) / 100;
function node(tag, attrs = {}, parent) {
  const el = document.createElementNS(ns, tag);
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
  if (parent) parent.append(el);
  return el;
}
function checkpoint() {
  history.push({ points: points.map(p => ({ ...p })), pin: pin && { ...pin } });
  if (history.length > 100) history.shift();
}
function setMode(value) {
  mode = value;
  $('draw').setAttribute('aria-pressed', mode === 'draw');
  $('pin').setAttribute('aria-pressed', mode === 'pin');
  $('mode-help').textContent = mode === 'draw'
    ? 'Click the entrance, then each turn along the corridor. Drag points to adjust.'
    : 'Click the office to place its pin. Drag the pin to move it.';
}
function artwork(root) {
  const size = unit(), color = $('color').value;
  const arrows = $('route-style').value === 'arrows';
  // Retain the route centerline for consumers of the existing svgPath field.
  node('path', { id: 'route-centerline', d: pathData(), fill: 'none', stroke: 'none' }, root);
  const symbols = node('g', { id: arrows ? 'arrows' : 'footprints', fill: color }, root);
  const segments = points.slice(1).map((p, i) => {
    const a = points[i], dx = p.x - a.x, dy = p.y - a.y;
    return { a, dx, dy, length: Math.hypot(dx, dy) };
  }).filter(s => s.length > 0);
  const total = segments.reduce((sum, s) => sum + s.length, 0);
  // Bound output size even on unusually long routes.
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
    if (arrows) {
      node('path', { d: 'M0-11 L8-2 H3 V10 H-3 V-2 H-8 Z' }, symbol);
    } else {
      // A sole and separate heel, pointing toward the destination.
      node('path', { d: 'M-3 3 C-6-1-5-10-1-11 C4-12 6-7 4-3 L2 3 Z M-3 5 L2 5 L2 9 Q-1 12-3 9 Z', transform: `scale(${side} 1)` }, symbol);
    }
  }
  if (pin) {
    const marker = node('g', { id: 'office-pin', 'data-pin': 'true', transform: `translate(${rounded(pin.x)} ${rounded(pin.y)}) scale(${size / 12})`, fill: color }, root);
    node('path', { d: 'M0 0 C-4-6-10-12-10-19 A10 10 0 1 1 10-19 C10-12 4-6 0 0Z', stroke: '#fff', 'stroke-width': 1.5 }, marker);
    node('circle', { cx: 0, cy: -19, r: 3.5, fill: '#fff' }, marker);
    const title = node('title', {}, marker);
    title.textContent = $('office').value.trim() || 'Office';
  }
}
function render() {
  if (!plan) return;
  const svg = $('overlay');
  svg.replaceChildren();
  artwork(svg);
  const guide = node('g', { 'data-editor-only': 'true' }, svg);
  node('path', { d: pathData(), fill: 'none', stroke: $('color').value, 'stroke-opacity': .3, 'stroke-width': unit() * .12, 'stroke-dasharray': `${unit() * .3} ${unit() * .3}`, 'pointer-events': 'none' }, guide);
  points.forEach((p, i) => {
    const handle = node('g', { 'data-index': i }, guide);
    node('circle', { cx: p.x, cy: p.y, r: unit() * .9, fill: 'transparent' }, handle);
    node('circle', { cx: p.x, cy: p.y, r: unit() * .26, fill: '#fff', stroke: $('color').value, 'stroke-width': unit() * .12 }, handle);
  });
  $('undo').disabled = !history.length;
  $('clear').disabled = !points.length && !pin;
  const ready = points.length >= 2 && pin !== null;
  $('export').disabled = $('json').disabled = !ready;
  $('status').textContent = `${points.length} route points · ${pin ? 'Office pinned' : 'Place an office pin'}${ready ? ' · Ready to export' : ''}`;
}
function resize() {
  if (!plan) return;
  const fit = Math.max(1, $('viewport').clientWidth - 48) / plan.width;
  $('stage').style.width = `${plan.width * fit * zoom}px`;
  $('stage').style.height = `${plan.height * fit * zoom}px`;
  $('zoom-value').textContent = `${Math.round(zoom * 100)}%`;
}
$('file').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const token = ++loadId;
  let url;
  try {
    const isSvg = /\.svg$/i.test(file.name) || file.type === 'image/svg+xml';
    if (!isSvg && !/\.(png|jpe?g|webp)$/i.test(file.name)) throw new Error('Choose an SVG, JPG, PNG or WebP image.');
    let box = null;
    if (isSvg) {
      const xml = new DOMParser().parseFromString(await file.text(), 'image/svg+xml');
      const root = xml.documentElement;
      if (xml.querySelector('parsererror') || root.localName !== 'svg') throw new Error('This SVG could not be read.');
      if (root.hasAttribute('viewBox')) {
        box = root.getAttribute('viewBox').trim().split(/[\s,]+/).map(Number);
        if (box.length !== 4 || !box.every(Number.isFinite) || box[2] <= 0 || box[3] <= 0) throw new Error('The SVG needs a valid viewBox.');
      }
      // Explicit dimensions make viewBox-only SVGs decode consistently as images.
      if (box) { root.setAttribute('width', box[2]); root.setAttribute('height', box[3]); }
      url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(xml)], { type: 'image/svg+xml' }));
    } else url = URL.createObjectURL(file);
    const img = new Image();
    img.src = url;
    await img.decode();
    if (token !== loadId) { URL.revokeObjectURL(url); return; }
    if (!img.naturalWidth || !img.naturalHeight) throw new Error('The floorplan has no readable dimensions.');
    if (plan) URL.revokeObjectURL(plan.url);
    const [x, y, width, height] = box || [0, 0, img.naturalWidth, img.naturalHeight];
    plan = { x, y, width, height, url, name: file.name };
    points = []; pin = null; history = []; zoom = 1;
    $('floorplan').src = url;
    $('overlay').setAttribute('viewBox', `${x} ${y} ${width} ${height}`);
    $('empty').hidden = true; $('stage').hidden = false; $('controls').disabled = false;
    for (const id of ['zoom-in', 'zoom-out', 'fit']) $(id).disabled = false;
    $('file-name').textContent = `${file.name} · ${rounded(width)} × ${rounded(height)}`;
    $('plan-title').textContent = file.name;
    setMode('draw'); resize(); render();
  } catch (error) {
    if (url) URL.revokeObjectURL(url);
    if (token === loadId) $('status').textContent = error.message || 'Could not load this floorplan.';
  }
  event.target.value = '';
});
function position(event) {
  const point = new DOMPoint(event.clientX, event.clientY).matrixTransform($('overlay').getScreenCTM().inverse());
  return { x: Math.max(plan.x, Math.min(plan.x + plan.width, point.x)), y: Math.max(plan.y, Math.min(plan.y + plan.height, point.y)) };
}
$('overlay').addEventListener('pointerdown', (event) => {
  if (!plan || event.button !== 0 || drag) return;
  const handle = event.target.closest('[data-index], [data-pin]');
  checkpoint();
  if (handle) {
    drag = { id: event.pointerId, index: handle.hasAttribute('data-index') ? Number(handle.dataset.index) : 'pin' };
    $('overlay').setPointerCapture(event.pointerId);
  } else if (mode === 'pin') pin = position(event);
  else points.push(position(event));
  render();
});
$('overlay').addEventListener('pointermove', (event) => {
  if (!drag || drag.id !== event.pointerId) return;
  if (drag.index === 'pin') pin = position(event);
  else points[drag.index] = position(event);
  render();
});
for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) $('overlay').addEventListener(name, () => { drag = null; });
$('draw').onclick = () => setMode('draw');
$('pin').onclick = () => setMode('pin');
$('undo').onclick = () => { const previous = history.pop(); if (previous) { points = previous.points; pin = previous.pin; render(); } };
$('clear').onclick = () => { checkpoint(); points = []; pin = null; render(); };
$('size').oninput = () => { $('size-value').textContent = `${$('size').value}%`; render(); };
$('color').oninput = render;
$('route-style').onchange = render;
$('office').oninput = render;
$('zoom-in').onclick = () => { zoom = Math.min(6, zoom + .25); resize(); };
$('zoom-out').onclick = () => { zoom = Math.max(.5, zoom - .25); resize(); };
$('fit').onclick = () => { zoom = 1; resize(); $('viewport').scrollTo(0, 0); };
new ResizeObserver(resize).observe($('viewport'));
document.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z' && !event.target.matches('input,textarea')) {
    event.preventDefault(); $('undo').click();
  }
});
function routeData() {
  return {
    entrancePoint: $('entrance').value.trim(), svgPath: pathData(),
    officeLabel: $('office').value.trim(), officePin: { x: rounded(pin.x), y: rounded(pin.y) },
    floorPlan: { fileName: plan.name, viewBox: [plan.x, plan.y, plan.width, plan.height] },
    style: { symbol: $('route-style').value, color: $('color').value, symbolSize: unit(), footprintSize: unit() }
  };
}
function download(content, type, extension) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  const name = ($('office').value.trim() || 'office-route').replace(/[^a-z0-9_-]+/gi, '-');
  link.href = url; link.download = `${name}.${extension}`;
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  $('status').textContent = `Downloaded ${extension.toUpperCase()} · ${points.length} route points · Office pinned`;
}
$('export').onclick = () => {
  if (!plan || points.length < 2 || !pin) return;
  const svg = node('svg', { viewBox: `${plan.x} ${plan.y} ${plan.width} ${plan.height}`, width: plan.width, height: plan.height, role: 'img' });
  node('title', {}, svg).textContent = `Route to ${$('office').value.trim() || 'office'}`;
  node('metadata', {}, svg).textContent = JSON.stringify(routeData());
  artwork(svg);
  download(new XMLSerializer().serializeToString(svg), 'image/svg+xml', 'svg');
};
$('json').onclick = () => { if (points.length >= 2 && pin) download(JSON.stringify(routeData(), null, 2), 'application/json', 'json'); };
