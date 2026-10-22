import { Fragment, useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPencil, faPlus, faQrcode, faTrash } from '@fortawesome/free-solid-svg-icons'
import LecturerQRCode from './LecturerQRCode'

interface LecturerOffice {
  buildingName: string | null
  floorLevel: number | null
  roomNumber: string
}

interface Lecturer {
  id: string
  fullName: string
  title?: string | null
  department?: string | null
  active: boolean
  office: LecturerOffice | null
}

interface LecturerSearchResponse {
  lecturers: Lecturer[]
}

function Lecturers() {
  const [searchTerm, setSearchTerm] = useState('')
  const [lecturers, setLecturers] = useState<Lecturer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasSearched, setHasSearched] = useState(false)
  const [error, setError] = useState('')
  const [qrLecturerId, setQrLecturerId] = useState<string | null>(null)

  async function searchLecturers(search: string) {
    setIsLoading(true)
    setLecturers([])
    setError('')
    setHasSearched(true)
    setQrLecturerId(null)

    try {
      const query = encodeURIComponent(search.trim())
      const response = await fetch(`/api/admin/lecturers?search=${query}`)

      if (!response.ok) {
        throw new Error('Search request failed')
      }

      const data = (await response.json()) as LecturerSearchResponse
      setLecturers(data.lecturers)
    } catch {
      setLecturers([])
      setError('The lecturer directory could not be loaded. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await searchLecturers(searchTerm)
  }

  useEffect(() => {
    let cancelled = false

    async function loadLecturers() {
      try {
        const response = await fetch('/api/admin/lecturers?search=')

        if (!response.ok) {
          throw new Error('Search request failed')
        }

        const data = (await response.json()) as LecturerSearchResponse

        if (!cancelled) {
          setLecturers(data.lecturers)
        }
      } catch {
        if (!cancelled) {
          setLecturers([])
          setError('The lecturer directory could not be loaded. Please try again.')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
          setHasSearched(true)
        }
      }
    }

    void loadLecturers()

    return () => {
      cancelled = true
    }
  }, [])

  async function toggleLecturerActive(id: string, active: boolean) {
    try {
      const response = await fetch(`/api/admin/lecturers/${id}/active`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          active: !active,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update lecturer status')
      }

      setLecturers((currentLecturers) =>
        currentLecturers.map((lecturer) =>
          lecturer.id === id
            ? { ...lecturer, active: !active }
            : lecturer
        )
      )

      if (active && qrLecturerId === id) {
        setQrLecturerId(null)
      }
    } catch {
      setError('The lecturer status could not be updated. Please try again.')
    }
  }

  return (
    <main className="page-shell">
      <Link className="route-link" to="/admin">← Back to admin menu</Link>
          <p className="eyebrow">Administration</p>
            <h1 className="text-[color:var(--theme-heading)]">Lecturer management</h1>

      <p className="page-intro">
        View and manage faculty members across all departments.
      </p>

      <Link className="primary-button add-lecturer-button" to="/lecturer/create">
        <FontAwesomeIcon icon={faPlus} aria-hidden="true" />
        Add lecturer
      </Link>

      <form className="search-form" onSubmit={handleSearch}>
        <label className="search-field">
          <span>Lecturer name</span>
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="e.g. Naledi Dlamini"
          />
        </label>

        <button className="primary-button" type="submit" disabled={isLoading}>
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </form>

      <section className="search-results" aria-live="polite" aria-busy={isLoading}>
        {isLoading && (
          <p className="status-message">Searching for lecturers...</p>
        )}

        {error && (
          <p className="status-message status-message--error">{error}</p>
        )}

        {!error && hasSearched && !isLoading && lecturers.length === 0 && (
          <p className="status-message">No lecturers matched your search.</p>
        )}

        {!error && !isLoading && lecturers.length > 0 && (
          <>
            <h2>Search results</h2>

            <div className="lecturer-list">
              {lecturers.map((lecturer) => (
                <Fragment key={lecturer.id}>
                  <div className="lecturer-card-lecturers">
                    <div className="lecturer-card-details-lecturers">
                      <div className="lecturer-name-row-lecturers">
                        <strong>{lecturer.fullName}</strong>

                        <span
                          className={`lecturer-status-lecturers ${
                            lecturer.active === false
                              ? 'lecturer-status-lecturers--inactive'
                              : 'lecturer-status-lecturers--active'
                          }`}
                        >
                          {lecturer.active === false ? 'Inactive' : 'Active'}
                        </span>
                      </div>

                      {(lecturer.title || lecturer.department) && (
                        <span>
                          {[lecturer.title, lecturer.department]
                            .filter(Boolean)
                            .join(' - ')}
                        </span>
                      )}

                      <span>
                        {lecturer.office
                          ? `${lecturer.office.buildingName ?? 'Building unavailable'}, room ${lecturer.office.roomNumber}`
                          : 'Office not assigned'}
                      </span>
                    </div>

                    {!lecturer.active && (
                      <div className="lecturer-card-actions-lecturers">
                        <button
                          onClick={() =>
                            void toggleLecturerActive(
                              lecturer.id,
                              lecturer.active
                            )
                          }
                          type="button"
                          className="activate-lecturer-button"
                          aria-label={`Activate ${lecturer.fullName}`}
                          title={`Activate ${lecturer.fullName}`}
                        >
                          Activate
                        </button>
                      </div>
                    )}

                    {lecturer.active && (
                      <div className="lecturer-card-actions-lecturers">
                        <button
                          type="button"
                          className="edit-lecturer-button"
                          onClick={() =>
                            setQrLecturerId((currentId) =>
                              currentId === lecturer.id
                                ? null
                                : lecturer.id
                            )
                          }
                          aria-label={`QR code for ${lecturer.fullName}`}
                          title={`QR code for ${lecturer.fullName}`}
                          aria-expanded={qrLecturerId === lecturer.id}
                        >
                          <FontAwesomeIcon icon={faQrcode} aria-hidden="true" />
                        </button>

                        <Link
                          to={`/lecturer/edit/${lecturer.id}`}
                          className="edit-lecturer-button"
                          aria-label={`Edit ${lecturer.fullName}`}
                          title={`Edit ${lecturer.fullName}`}
                        >
                          <FontAwesomeIcon icon={faPencil} aria-hidden="true" />
                        </Link>

                        <button
                          onClick={() =>
                            void toggleLecturerActive(
                              lecturer.id,
                              lecturer.active
                            )
                          }
                          type="button"
                          className="delete-lecturer-button"
                          aria-label={`Delete ${lecturer.fullName}`}
                          title={`Delete ${lecturer.fullName}`}
                        >
                          <FontAwesomeIcon icon={faTrash} aria-hidden="true" />
                        </button>
                      </div>
                    )}
                  </div>

                  {lecturer.active && qrLecturerId === lecturer.id && (
                    <section className="rounded-[0.9rem] border border-[#d9cfde] bg-white p-4 text-center shadow-sm">
                      <h3 className="font-bold text-[#4b145f]">
                        QR code for {lecturer.fullName}
                      </h3>

                      <p className="mb-4 mt-1 text-sm text-[#716777]">
                        Scan this code to open the lecturer&apos;s public profile,
                        or download it for sharing.
                      </p>

                      <div className="mx-auto max-w-[340px]">
                        <LecturerQRCode
                          lecturerId={lecturer.id}
                          size={180}
                          showDownload
                        />
                      </div>
                    </section>
                  )}
                </Fragment>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  )
}

export default Lecturers
