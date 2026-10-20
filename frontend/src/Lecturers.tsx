import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPencil, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons'

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
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [error, setError] = useState('')

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
  event.preventDefault()
  await searchLecturers(searchTerm)
}


useEffect(() => {
  searchLecturers('')
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

    // Update the lecturer in the UI
    setLecturers((currentLecturers) =>
      currentLecturers.map((lecturer) =>
        lecturer.id === id
          ? { ...lecturer, active: !active }
          : lecturer
      )
    )
  } catch {
    setError('The lecturer status could not be updated. Please try again.')
  }
}
  async function searchLecturers(search: string) {

    setIsLoading(true)
    setLecturers([])
    setError('')
    setHasSearched(true)

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






  return (
     <main className="page-shell">
          <h1 className="text-2xl font-bold text-[color:var(--theme-heading)]">Lecturer management</h1>
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
            {error && <p className="status-message status-message--error">{error}</p>}
    
            {!error && hasSearched && !isLoading && lecturers.length === 0 && (
              <p className="status-message">No lecturers matched your search.</p>
            )}
    
            {!error && !isLoading && lecturers.length > 0 && (
              <>
                <h2>Search results</h2>
    
                <div className="lecturer-list">
                  {lecturers.map((lecturer) => (
                    <div className="lecturer-card-lecturers" key={lecturer.id}>
                      <div className="lecturer-card-details-lecturers">
                        <div className="lecturer-name-row-lecturers">
                          <strong>{lecturer.fullName}</strong>
                          <span
                            className={`lecturer-status-lecturers ${lecturer.active === false ? 'lecturer-status-lecturers--inactive' : 'lecturer-status-lecturers--active'}`}
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
                        <div className="lecturer-card-actions-lecturers"><button
                          onClick={() => toggleLecturerActive(lecturer.id, lecturer.active)}
                          type="button"
                          className="activate-lecturer-button"
                          aria-label={`Activate ${lecturer.fullName}`}
                          title={`Activate ${lecturer.fullName}`}
                        >
                          Activate
                        </button> </div>)}
                      {lecturer.active && (
                      <div  className="lecturer-card-actions-lecturers">
                        <Link
                          to={`/lecturer/edit/${lecturer.id}`}
                          className="edit-lecturer-button"
                          aria-label={`Edit ${lecturer.fullName}`}
                          title={`Edit ${lecturer.fullName}`}
                        >
                          <FontAwesomeIcon icon={faPencil} aria-hidden="true" />
                        </Link>
                        <button
                          onClick={() => toggleLecturerActive(lecturer.id, lecturer.active)}
                          type="button"
                          className="delete-lecturer-button"
                          aria-label={`Delete ${lecturer.fullName}`}
                          title={`Delete ${lecturer.fullName}`}
                        >
                          <FontAwesomeIcon icon={faTrash} aria-hidden="true" />
                        </button>
                      </div>)}
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        </main>
  );
}

export default Lecturers;