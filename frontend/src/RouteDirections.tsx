import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLecturerProfile } from './lecturer-profile'

type ViewBox = [number, number, number, number]

function readSvg(source: string): { root: Element; box: ViewBox } {
  const document = new DOMParser().parseFromString(source, 'image/svg+xml')
  const root = document.documentElement
  const values = root.getAttribute('viewBox')?.trim().split(/[\s,]+/).map(Number)
  if (document.querySelector('parsererror') || root.localName !== 'svg' ||
    !values || values.length !== 4 || !values.every(Number.isFinite) || values[2] <= 0 || values[3] <= 0) {
    throw new Error('The map contains an unreadable SVG or invalid dimensions.')
  }
  return { root, box: values as ViewBox }
}

function imageUrl(source: string) {
  return URL.createObjectURL(new Blob([source], { type: 'image/svg+xml' }))
}

function routePreviewBox(root: Element, floor: ViewBox): ViewBox | null {
  let metadata: { svgPath?: unknown; officePin?: { x?: unknown; y?: unknown } } = {}
  try {
    metadata = JSON.parse(root.querySelector('metadata')?.textContent ?? '{}')
  } catch {
    // SVGs without route-editor metadata use the full floor-plan view.
  }
  const path = typeof metadata.svgPath === 'string'
    ? metadata.svgPath
    : root.querySelector('#route-centerline')?.getAttribute('d') ?? ''
  const number = '-?(?:\\d*\\.)?\\d+(?:e[+-]?\\d+)?'
  const commands = new RegExp(`[ML]\\s*(${number})[\\s,]+(${number})`, 'gi')
  const points = [...path.matchAll(commands)].map((match) => [Number(match[1]), Number(match[2])])
  if (typeof metadata.officePin?.x === 'number' && typeof metadata.officePin.y === 'number') {
    points.push([metadata.officePin.x, metadata.officePin.y])
  }
  if (points.length === 0) return null

  const xs = points.map(([x]) => x)
  const ys = points.map(([, y]) => y)
  const padding = Math.max(12, Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) * .15)
  const left = Math.max(floor[0], Math.min(...xs) - padding)
  const top = Math.max(floor[1], Math.min(...ys) - padding)
  const right = Math.min(floor[0] + floor[2], Math.max(...xs) + padding)
  const bottom = Math.min(floor[1] + floor[3], Math.max(...ys) + padding)
  return right > left && bottom > top ? [left, top, right - left, bottom - top] : null
}

async function decodeImage(url: string) {
  const image = new Image()
  image.src = url
  await image.decode()
}

export default function RouteDirections() {
  const lecturer = useLecturerProfile()
  const route = lecturer.route
  return <main className="page-shell directions-page">
    <Link className="route-link" to={`/lecturers/info/${lecturer.id}`}>← Back to profile</Link>
    <h1>Directions to {lecturer.fullName}</h1>
    {route && lecturer.office && <p className="page-intro" id="route-description">
      {route.floorPlan.buildingName} · {route.floorPlan.floorLevel === 0 ? 'Ground floor' : route.floorPlan.floorLevel === -1 ? 'Basement' : `Floor ${route.floorPlan.floorLevel}`} · Room {lecturer.office.roomNumber}<br />
      From {route.entrancePoint} to room {lecturer.office.roomNumber}. Follow the route symbols to the office pin.
    </p>}
    {route?.svgOverlay && lecturer.office
      ? <RouteMap key={`${route.floorPlan.fileRef}:${route.svgOverlay}`} fileRef={route.floorPlan.fileRef} overlay={route.svgOverlay} />
      : <p className="status-message" role="status">Directions are not available for this office yet.</p>}
  </main>
}

export function RouteMap({ fileRef, overlay, compact = false }: { fileRef: string; overlay: string; compact?: boolean }) {
  const [map, setMap] = useState<{ floorUrl: string; overlayUrl: string; ratio: number } | null>(null)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    const urls: string[] = []
    async function load() {
      try {
        const overlaySource = overlay.startsWith('/api/files/routes/')
          ? await (async () => {
              const response = await fetch(overlay, { signal: controller.signal })
              if (!response.ok) throw new Error('The route could not be loaded.')
              return response.text()
            })()
          : overlay
        const routeSvg = readSvg(overlaySource)
        const response = await fetch(fileRef, { signal: controller.signal })
        if (!response.ok) throw new Error('The floor plan could not be loaded.')
        const floorSvg = readSvg(await response.text())
        if (routeSvg.box.some((value, index) => Math.abs(value - floorSvg.box[index]) > 0.0001)) {
          throw new Error('The route does not match this floor plan.')
        }
        if (controller.signal.aborted) return
        // The admin thumbnail frames the route while the public map retains its full view.
        const previewBox = compact ? routePreviewBox(routeSvg.root, floorSvg.box) : null
        const box = previewBox ?? floorSvg.box
        if (previewBox) {
          const viewBox = box.join(' ')
          floorSvg.root.setAttribute('viewBox', viewBox)
          routeSvg.root.setAttribute('viewBox', viewBox)
          routeSvg.root.setAttribute('width', String(box[2]))
          routeSvg.root.setAttribute('height', String(box[3]))
        }
        // Normalise image dimensions to the coordinate ratio, as the editor does.
        floorSvg.root.setAttribute('width', String(box[2]))
        floorSvg.root.setAttribute('height', String(box[3]))
        const floorUrl = imageUrl(new XMLSerializer().serializeToString(floorSvg.root))
        const overlayUrl = imageUrl(previewBox ? new XMLSerializer().serializeToString(routeSvg.root) : overlaySource)
        urls.push(floorUrl, overlayUrl)
        try {
          await Promise.all([decodeImage(floorUrl), decodeImage(overlayUrl)])
        } catch {
          throw new Error('The map images could not be displayed. Please try again.')
        }
        if (!controller.signal.aborted) setMap({ floorUrl, overlayUrl, ratio: box[2] / box[3] })
      } catch (cause) {
        if (!controller.signal.aborted) {
          urls.forEach(URL.revokeObjectURL)
          setError(cause instanceof Error ? cause.message : 'The map could not be loaded. Please try again.')
        }
      }
    }
    void load()
    return () => { controller.abort(); urls.forEach(URL.revokeObjectURL) }
  }, [fileRef, overlay, compact, attempt])

  if (error) return <div>
    <p className="status-message status-message--error" role="alert">{error}</p>
    <button className="primary-button" onClick={() => { setError(''); setAttempt(attempt + 1) }}>Try again</button>
  </div>
  if (!map) return <p className="status-message" role="status">Loading map…</p>
  return <figure className={compact ? 'route-figure route-figure--compact' : 'route-figure'} aria-describedby={compact ? undefined : 'route-description'}>
    <div className="route-map" style={{ aspectRatio: map.ratio }} role="img" aria-label="Floor plan with the original route symbols and destination office pin">
      <img src={map.floorUrl} alt="" />
      <img src={map.overlayUrl} alt="" />
    </div>
    <figcaption>{compact ? 'Route overlay on floor plan.' : 'Pinch to zoom in for a closer look.'}</figcaption>
  </figure>
}
