import type { LecturerProfile } from './lecturer-profile'
import { useEffect, useState } from 'react'
import { Link, Outlet, useParams } from 'react-router-dom'

export default function LecturerProfileLayout() {
  const { id } = useParams()
  // A changed ID remounts only the loader; sibling pages share its response.
  return <ProfileLoader key={id} id={id ?? ''} />
}

function ProfileLoader({ id }: { id: string }) {
  const [lecturer, setLecturer] = useState<LecturerProfile | null>(null)
  const [error, setError] = useState('')
  const [notFound, setNotFound] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      try {
        const response = await fetch(`/api/lecturers/${encodeURIComponent(id)}`, { signal: controller.signal })
        if (response.status === 404) {
          setNotFound(true)
          return
        }
        if (!response.ok) throw new Error('Profile request failed')
        const data: LecturerProfile = await response.json()
        if (!controller.signal.aborted) setLecturer(data)
      } catch {
        if (!controller.signal.aborted) setError('The lecturer profile could not be loaded. Please try again.')
      }
    }
    void load()
    return () => controller.abort()
  }, [id, attempt])

  if (lecturer) return <Outlet context={lecturer} />
  return <main className="page-shell profile-page">
    <Link className="route-link" to="/directory">← Back to directory</Link>
    <p className="status-message" role="status">
      {notFound ? 'Lecturer profile is unavailable.' : error || 'Loading lecturer profile…'}
    </p>
    {error && <button className="primary-button" onClick={() => { setError(''); setAttempt(attempt + 1) }}>Try again</button>}
  </main>
}
