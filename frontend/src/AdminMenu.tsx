import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBuilding, faChalkboardUser } from '@fortawesome/free-solid-svg-icons'
import { Link } from 'react-router-dom'

function AdminMenu() {
  return (
    <main className="page-shell">
      <h1 className="text-2xl font-bold text-[#4b145f]">Admin menu</h1>
      <p className="page-intro">Choose what you want to manage.</p>

      <div className="admin-menu">
        <Link className="lecturer-card admin-menu__link" to="/lecturers">
          <FontAwesomeIcon icon={faChalkboardUser} aria-hidden="true" />
          <strong>Lecturers</strong>
          <span>Manage lecturer details and timetables</span>
        </Link>
        <Link className="lecturer-card admin-menu__link" to="/buildings">
          <FontAwesomeIcon icon={faBuilding} aria-hidden="true" />
          <strong>Buildings</strong>
          <span>Manage floor plans, offices and routes</span>
        </Link>
      </div>
    </main>
  )
}

export default AdminMenu
