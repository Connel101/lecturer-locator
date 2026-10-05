import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLecturerProfile } from './lecturer-profile'

export default function LecturerTimetable() {
  const lecturer = useLecturerProfile()
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading')
  const [attempt, setAttempt] = useState(0)
  const [enlarged, setEnlarged] = useState(false)

  return <main className="page-shell timetable-page">
    <Link className="route-link" to=".." relative="path">← Back to profile</Link>
    <h1>Timetable for {lecturer.fullName}</h1>
    {!lecturer.timetableFileRef ? <p className="status-message">No timetable is available.</p> : <>
      {status === 'loading' && <p className="status-message" role="status">Loading timetable…</p>}
      {status === 'error' && <>
        <p className="status-message" role="alert">The timetable could not be loaded. Please try again.</p>
        <button className="primary-button" onClick={() => { setStatus('loading'); setAttempt(attempt + 1) }}>Try again</button>
      </>}
      {status === 'loaded' && <>
        <button className="primary-button" aria-pressed={enlarged} onClick={() => setEnlarged(!enlarged)}>
          {enlarged ? 'Fit to screen' : 'Enlarge timetable'}
        </button>
        <p className="status-message">{enlarged ? 'Scroll across the image to read the timetable.' : 'Enlarge the image or pinch to zoom to read small text.'}</p>
      </>}
      <div className="timetable-image" hidden={status !== 'loaded'} tabIndex={status === 'loaded' ? 0 : -1} role="region" aria-label="Timetable image">
        <img key={attempt} src={lecturer.timetableFileRef} alt={`Timetable for ${lecturer.fullName}`}
          className={enlarged ? 'timetable-image--enlarged' : ''}
          onLoad={() => setStatus('loaded')} onError={() => setStatus('error')} />
      </div>
    </>}
  </main>
}
