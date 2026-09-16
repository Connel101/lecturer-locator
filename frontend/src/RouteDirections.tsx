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

function RouteMap({ fileRef, overlay }: { fileRef: string; overlay: string }) {
  const [map, setMap] = useState<{ floorUrl: string; overlayUrl: string; ratio: number } | null>(null)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    const urls: string[] = []
    async function load() {
      try {
        const routeSvg = readSvg(overlay)
        const response = await fetch(fileRef, { signal: controller.signal })
        if (!response.ok) throw new Error('The floor plan could not be loaded.')
        const floorSvg = readSvg(await response.text())
        if (routeSvg.box.some((value, index) => Math.abs(value - floorSvg.box[index]) > 0.0001)) {
          throw new Error('The route does not match this floor plan.')
        }
        if (controller.signal.aborted) return
        // Normalise image dimensions to the coordinate ratio, as the editor does.
        // Only the floor-plan image is normalised; exported overlay bytes stay intact.
        floorSvg.root.setAttribute('width', String(floorSvg.box[2]))
        floorSvg.root.setAttribute('height', String(floorSvg.box[3]))
        const floorUrl = imageUrl(new XMLSerializer().serializeToString(floorSvg.root))
        const overlayUrl = imageUrl(overlay)
        urls.push(floorUrl, overlayUrl)
        try {
          await Promise.all([decodeImage(floorUrl), decodeImage(overlayUrl)])
        } catch {
          throw new Error('The map images could not be displayed. Please try again.')
        }
        if (!controller.signal.aborted) setMap({ floorUrl, overlayUrl, ratio: floorSvg.box[2] / floorSvg.box[3] })
      } catch (cause) {
        if (!controller.signal.aborted) {
          urls.forEach(URL.revokeObjectURL)
          setError(cause instanceof Error ? cause.message : 'The map could not be loaded. Please try again.')
        }
      }
    }
    void load()
    return () => { controller.abort(); urls.forEach(URL.revokeObjectURL) }
  }, [fileRef, overlay, attempt])

  if (error) return <div>
    <p className="status-message status-message--error" role="alert">{error}</p>
    <button className="primary-button" onClick={() => { setError(''); setAttempt(attempt + 1) }}>Try again</button>
  </div>
  if (!map) return <p className="status-message" role="status">Loading map…</p>
  return <figure className="route-figure" aria-describedby="route-description">
    <div className="route-map" style={{ aspectRatio: map.ratio }} role="img" aria-label="Floor plan with the original route symbols and destination office pin">
      <img src={map.floorUrl} alt="" />
      <img src={map.overlayUrl} alt="" />
    </div>
    <figcaption>Pinch to zoom in for a closer look.</figcaption>
  </figure>
}
