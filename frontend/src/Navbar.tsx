import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBars, faBuildingColumns, faCamera, faUser } from '@fortawesome/free-solid-svg-icons'
import { Link, NavLink } from 'react-router-dom'
import { authClient } from "./lib/auth-client";
import { clearInstallPrompt, getInstallPrompt, type BeforeInstallPromptEvent } from './lib/pwa-install'

const tabClassName = ({ isActive }: { isActive: boolean }) =>
  `mobile-nav__item${isActive ? ' mobile-nav__item--active' : ''}`

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  ('standalone' in window.navigator && (window.navigator as Navigator & { standalone?: boolean }).standalone === true)

const isIos = () => /iphone|ipad|ipod/i.test(window.navigator.userAgent)
const isAndroid = () => /android/i.test(window.navigator.userAgent)

function Navbar() {
  const [menu, setMenu] = useState(false)
  const { data: session } = authClient.useSession();
  const [usermenu, setUserMenu] = useState(false)
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(getInstallPrompt)
  const [showIosInstructions, setShowIosInstructions] = useState(false)
  const [installed, setInstalled] = useState(isStandalone)

  useEffect(() => {
    const handleBeforeInstallPrompt = () => setInstallPrompt(getInstallPrompt())
    const handleInstalled = () => {
      setInstalled(true)
      setInstallPrompt(null)
    }

    window.addEventListener('pwa-install-available', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleInstalled)
    return () => {
      window.removeEventListener('pwa-install-available', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [])

  const canInstall = !installed && (installPrompt !== null || isIos() || isAndroid())

  const installApp = async () => {
    setUserMenu(false)
    if (installPrompt) {
      await installPrompt.prompt()
      const { outcome } = await installPrompt.userChoice
      if (outcome === 'accepted') {
        clearInstallPrompt()
        setInstallPrompt(null)
      }
      return
    }
    setShowIosInstructions(true)
  }

  const installMenuItem = canInstall && (
    <button type="button" className="top-user__menu-item" onClick={installApp}>Install app</button>
  )

  return (
    <>
      <nav className="top-nav" aria-label="Main navigation">
        <div className="top-nav__brand">
          <button type="button" onClick={() => setMenu(!menu)} className="top-nav__icon-button" aria-label="Open navigation menu" aria-expanded={menu}>
            <FontAwesomeIcon icon={faBars} />
          </button>
          <span>LecturerLocator</span>
        </div>

        
        <button onClick={() => setUserMenu(!usermenu)} className="top-nav__icon-button" aria-label="Admin sign in"><FontAwesomeIcon icon={faUser} /></button>
        {usermenu && session && (
          <div className="top-user__menu">
            
            <Link to="/" onClick={() => setUserMenu(false)}>Profile</Link>
            {installMenuItem}
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
            
          </div>
        )}
        {menu && !session && (
          <div className="top-nav__menu">
            <Link to="/directory" onClick={() => setMenu(false)}>Directory</Link>
          </div>
        )}
        {menu && session && (
          <div className="top-nav__menu">
            <Link to="/lecturers" onClick={() => setMenu(false)}>Lecturers</Link>
            <Link to="/buildings" onClick={() => setMenu(false)}>Buildings</Link>
            
          </div>
        )}
      </nav>

      {showIosInstructions && (
        <div className="install-dialog__backdrop" role="presentation" onClick={() => setShowIosInstructions(false)}>
          <section className="install-dialog" role="dialog" aria-modal="true" aria-labelledby="install-dialog-title" onClick={(event) => event.stopPropagation()}>
            <h2 id="install-dialog-title">Add to Home Screen</h2>
            <p>
              {isIos()
                ? <>In Safari, tap the Share button, then choose <strong>Add to Home Screen</strong>.</>
                : <>Open your browser menu and choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.</>}
            </p>
            <button type="button" className="primary-button" onClick={() => setShowIosInstructions(false)}>Got it</button>
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
        
      </nav>
    </>
  )
}

export default Navbar
