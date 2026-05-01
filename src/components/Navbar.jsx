import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export default function Navbar() {
  const { user, logout, isAdmin, isUser, isSuperAdmin, isDonor } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const menuRef = useRef(null)
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  const closeMenu = () => setMenuOpen(false)

  useEffect(() => {
    closeMenu()
  }, [location.pathname, location.search])

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        closeMenu()
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
    }
  }, [])

  const sections = isSuperAdmin
    ? [
      { to: '/super-admin', label: 'Overview' },
      { to: '/super-admin/hospitals', label: 'Hospitals' },
      { to: '/super-admin/admins', label: 'Admins' },
      { to: '/super-admin/campaigns', label: 'Campaigns' },
      { to: '/super-admin/finance', label: 'Finance' },
      { to: '/super-admin/settings', label: 'Settings' },
    ]
    : isAdmin && user?.role === 'hospital_admin'
      ? [
        { to: '/admin-dashboard?tab=profile', label: 'Overview' },
        { to: '/admin-dashboard?tab=pending', label: 'Verification Queue' },
        { to: '/admin-dashboard?tab=active', label: 'Active Campaigns' },
        { to: '/admin-dashboard?tab=history', label: 'History' },
        { to: '/admin-dashboard?tab=financials', label: 'Financials' },
      ]
      : isUser
        ? [
          { to: '/dashboard', label: 'My Dashboard' },
          { to: '/create', label: 'Create Request' },
          { to: '/campaigns', label: 'Browse Campaigns' },
          { to: '/donor/campaigns', label: 'Donation Browse' },
        ]
        : []

  return (
    <nav className="navbar">
      <div className="navbar-shell navbar-inner">
        <Link to="/" className="navbar-brand" aria-label="CareFund Home">
          <span className="brand-icon">❤</span> CareFund
        </Link>
        <div className="navbar-links">
          {user ? (
            <>
              {sections.length > 0 && (
                <div className="navbar-menu-wrap" ref={menuRef}>
                  <button
                    type="button"
                    className="navbar-link-btn navbar-menu-trigger"
                    onClick={() => setMenuOpen((value) => !value)}
                    aria-expanded={menuOpen}
                    aria-haspopup="true"
                    aria-label="Open quick sections menu"
                  >
                    ☰ Sections
                  </button>
                  {menuOpen && <button type="button" className="navbar-menu-backdrop" aria-label="Close quick sections menu" onClick={closeMenu} />}
                  {menuOpen && (
                    <div className="navbar-menu card navbar-menu-panel" role="menu" aria-label="Quick sections">
                      {sections.map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          className="navbar-menu-item"
                          onClick={closeMenu}
                          role="menuitem"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {!isSuperAdmin && (
                <button
                  onClick={toggleTheme}
                  className="navbar-link-btn navbar-theme-btn"
                  type="button"
                  title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                  {isDark ? '☀️' : '🌙'}
                </button>
              )}
              <button onClick={handleLogout} className="navbar-link-btn">
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                onClick={toggleTheme}
                className="navbar-link-btn navbar-theme-btn"
                type="button"
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDark ? '☀️' : '🌙'}
              </button>
              <Link to="/login">Login</Link>
              <Link to="/signup">
                <button className="btn btn-primary">Sign Up</button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
