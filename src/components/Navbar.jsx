import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export default function Navbar() {
  const { user, logout, isAdmin, isUser, isSuperAdmin, isDonor } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <div className="navbar-brand">
          <span className="brand-icon">❤</span> CareFund
        </div>
        <div className="navbar-links">
          {user ? (
            <>
              {isSuperAdmin && <Link to="/super-admin">Super Admin</Link>}
              {isAdmin && !isSuperAdmin && (
                <Link to="/admin-dashboard">
                  {user?.role === 'hospital_admin' ? 'Hospital Admin' : 'Admin'}
                </Link>
              )}
              {isUser && <Link to="/dashboard">My Dashboard</Link>}
              {isDonor && <Link to="/donor/campaigns">Browse Campaigns</Link>}
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
