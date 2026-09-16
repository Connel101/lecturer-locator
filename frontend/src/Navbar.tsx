import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBars, faBuildingColumns, faCamera, faUser } from '@fortawesome/free-solid-svg-icons'
import { Link, NavLink } from 'react-router-dom'

const tabClassName = ({ isActive }: { isActive: boolean }) =>
  `mobile-nav__item${isActive ? ' mobile-nav__item--active' : ''}`

function Navbar() {
  const [menu, setMenu] = useState(false)
  const [signIn, setSignIn] = useState(false)

  return (
    <>
      <nav className="top-nav" aria-label="Main navigation">
        <div className="top-nav__brand">
          <button type="button" onClick={() => setMenu(!menu)} className="top-nav__icon-button" aria-label="Open navigation menu" aria-expanded={menu}>
            <FontAwesomeIcon icon={faBars} />
          </button>
          <span>LecturerLocator</span>
        </div>
        <Link to="/signin" className="top-nav__icon-button" aria-label="Admin sign in"><FontAwesomeIcon icon={faUser} /></Link>

        {menu && !signIn && (
          <div className="top-nav__menu">
            <Link to="/directory" onClick={() => setMenu(false)}>Directory</Link>
            <Link to="/signin" onClick={() => { setMenu(false); setSignIn(true) }}>Admin sign in</Link>
          </div>
        )}
        {menu && signIn && (
          <div className="top-nav__menu">
            <Link to="/lecturers" onClick={() => setMenu(false)}>Lecturers</Link>
            <Link to="/buildings" onClick={() => setMenu(false)}>Buildings</Link>
            <Link to="/directory" onClick={() => { setMenu(false); setSignIn(false) }}>Sign out</Link>
          </div>
        )}
      </nav>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        <NavLink to="/directory" className={tabClassName}>
          <FontAwesomeIcon icon={faBuildingColumns} />
          <span>Directory</span>
        </NavLink>
        <NavLink to="/scan" className={({ isActive }) => `mobile-nav__item mobile-nav__scan${isActive ? ' mobile-nav__item--active' : ''}`} aria-label="Scan a lecturer QR code">
          <span className="mobile-nav__scan-button"><FontAwesomeIcon icon={faCamera} /></span>
          <span>Scan</span>
        </NavLink>
        
      </nav>
    </>
  )
}

export default Navbar
