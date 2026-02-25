import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout, isAdmin, isUser } = useAuth()
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
          <Link to="/campaigns">Browse Campaigns</Link>
          {user ? (
            <>
              {isAdmin && <Link to="/admin-dashboard">Admin</Link>}
              {isUser && <Link to="/dashboard">My Dashboard</Link>}
              <button onClick={handleLogout} className="btn btn-secondary">
                Logout
              </button>
            </>
          ) : (
            <>
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
