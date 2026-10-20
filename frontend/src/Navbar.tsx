import { useState, useEffect, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBars, faBuildingColumns, faCamera, faUser, faUserGear } from '@fortawesome/free-solid-svg-icons'
import { Link, NavLink } from 'react-router-dom'
import { authClient } from "./lib/auth-client";
import { usePwaInstall } from "./hooks/usePwaInstall";

const tabClassName = ({ isActive }: { isActive: boolean }) =>
  `mobile-nav__item${isActive ? ' mobile-nav__item--active' : ''}`

const isIos = () => /iphone|ipad|ipod/i.test(window.navigator.userAgent)

function Navbar() {
  const {
  installPrompt,
  installApp,
  isInstalled,
} = usePwaInstall();

  const [menu, setMenu] = useState(false)
  const { data: session } = authClient.useSession();
  const [usermenu, setUserMenu] = useState(false)
  
  const [showIosInstructions, setShowIosInstructions] = useState(false)
  const [showHelp, setShowHelp] = useState(false)

  const showInstallOption = !isInstalled && (installPrompt !== null || isIos())

  const canInstall = !isInstalled && (installPrompt !== null || isIos())
  const userMenuRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
  function handleClickOutside(event: MouseEvent) {
    if (
      menuRef.current &&
      !menuRef.current.contains(event.target as Node)
    ) {
      setMenu(false)
    }
  }

  document.addEventListener('mousedown', handleClickOutside)
  return () => document.removeEventListener('mousedown', handleClickOutside)
}, [])

  const installMenuItem = canInstall && (
    <button
      type="button"
      className="top-user__menu-item"
      onClick={() => {
        if (installPrompt) {
          installApp()
        } else {
          setShowIosInstructions(true)
        }
      }}
    >
      Install app
    </button>
  )

  return (
    <>
      {showInstallOption && (
  <button
    type="button"
    onClick={() => {
      if (installPrompt) {
        installApp();
      } else {
        setShowIosInstructions(true);
      }
    }}
    className="install-action"
  >
    Install app
  </button>
)}
      <nav className="top-nav" aria-label="Main navigation">
        <div className="top-nav__brand" ref={menuRef}>
          <button type="button" onClick={() => { setMenu((open) => !open); setUserMenu(false); }} className="top-nav__icon-button" aria-label="Toggle navigation menu" aria-expanded={menu}>
            <FontAwesomeIcon icon={faBars} />
          </button>
          <span>LecturerLocator</span>
          {menu && (
            <div className="top-nav__menu">
              {session && <Link to="/admin" onClick={() => setMenu(false)}>Admin menu</Link>}
              <Link to="/directory" onClick={() => setMenu(false)}>Directory</Link>
            </div>
          )}
        </div>

        <div className="top-user__container" ref={userMenuRef}>
        <button type="button" onClick={() => { setUserMenu((open) => !open); setMenu(false); }} className="top-nav__icon-button" aria-label="Account menu" aria-expanded={usermenu}><FontAwesomeIcon icon={faUser} /></button>
        {usermenu && session && (
          <div className="top-user__menu" >
            <Link to="/" onClick={() => setUserMenu(false)}>Profile</Link>
            {installMenuItem}
            <button type="button" className="top-user__menu-item" onClick={() => { setUserMenu(false); setShowHelp(true); }}>
              Help &amp; feedback
            </button>
            <p
            onClick={async () => {
              await authClient.signOut();
              setUserMenu(false);
              window.location.reload();
              window.location.href = "/signin";
            }}
          >
            Sign Out
          </p>
          </div>
        )}

        {usermenu && !session && (
          <div className="top-user__menu">
            <Link to="/signin" onClick={() => { setUserMenu(false) }}>Sign In</Link>
            {installMenuItem}
            <button type="button" className="top-user__menu-item" onClick={() => { setUserMenu(false); setShowHelp(true); }}>
              Help &amp; feedback
            </button>
          </div>
        )}
        </div>
      </nav>

      {showIosInstructions && (
        <div className="install-dialog__backdrop" role="presentation" onClick={() => setShowIosInstructions(false)}>
          <section className="install-dialog" role="dialog" aria-modal="true" aria-labelledby="install-dialog-title" onClick={(event) => event.stopPropagation()}>
            <h2 id="install-dialog-title">{isIos() ? 'Add to Home Screen' : 'Install LecturerLocator'}</h2>
            <p>
              {isIos()
                ? <>In Safari, tap the Share button, then choose <strong>Add to Home Screen</strong>.</>
                : <>Open your browser menu and choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.</>}
            </p>
            <button type="button" className="primary-button" onClick={() => setShowIosInstructions(false)}>Got it</button>
          </section>
        </div>
      )}

            {showHelp && (
        <div className="install-dialog__backdrop" role="presentation" onClick={() => setShowHelp(false)}>
          <section className="install-dialog" role="dialog" aria-modal="true" aria-labelledby="help-dialog-title" onClick={(event) => event.stopPropagation()}>
            <h2 id="help-dialog-title">Help &amp; feedback</h2>
            <ul className="help-dialog__list">
              <li><strong>Finding a lecturer:</strong> Use the Directory to search by name, or Lecturers if you're signed in as an administrator.</li>
              <li><strong>Scanning a QR code:</strong> Tap Scan in the bottom bar and point your camera at a lecturer's door sign.</li>
              <li><strong>Camera permission blocked?</strong> Check your browser or phone settings, allow camera access for this site, then reload the page.</li>
              <li><strong>Installing the app:</strong> Use "Install app" in this menu to add LecturerLocator to your home screen.</li>
            </ul>
            <p>
              Found a problem? <a href="mailto:support@lecturerlocator.example?subject=LecturerLocator%20feedback">Send us feedback</a>.
            </p>
            <button type="button" className="primary-button" onClick={() => setShowHelp(false)}>Close</button>
          </section>
        </div>
      )}

      <nav className="mobile-nav" aria-label="Mobile navigation">
        <NavLink to="/directory" className={tabClassName}>
          <FontAwesomeIcon icon={faBuildingColumns} />
          <span>Directory</span>
        </NavLink>
        <NavLink to="/scan" className={({ isActive }) => `mobile-nav__item mobile-nav__scan${isActive ? ' mobile-nav__item--active' : ''}`} aria-label="Scan a lecturer QR code">
          <span className="mobile-nav__scan-button"><FontAwesomeIcon icon={faCamera} /></span>
          <span>Scan</span>
        </NavLink>
        {session && (
          <NavLink to="/admin" className={tabClassName}>
            <FontAwesomeIcon icon={faUserGear} />
            <span>Admin</span>
          </NavLink>
        )}
        
      </nav>
    </>
  )
}

export default Navbar
