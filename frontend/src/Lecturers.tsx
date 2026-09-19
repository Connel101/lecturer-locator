import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus } from '@fortawesome/free-solid-svg-icons'

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

    setIsLoading(true)
    setLecturers([])
    setError('')
    setHasSearched(true)

    try {
      const query = encodeURIComponent(searchTerm.trim())
      const response = await fetch(`/api/lecturers?search=${query}`)

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
          <h1 className="text-2xl font-bold text-[#4b145f]">Lecturer management</h1>
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
                    <div className="lecturer-card" key={lecturer.id}>
                      <div className="lecturer-card-details">
                        <strong>{lecturer.fullName}</strong>

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

                      <Link to={`/lecturer/edit/${lecturer.id}`} className="edit-lecturer-button">
                        Edit
                      </Link>
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