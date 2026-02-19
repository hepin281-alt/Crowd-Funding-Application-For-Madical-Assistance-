import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout, isEmployee, isDonor, isCampaigner, isHospitalAdmin } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">❤</span> CareFund
        </Link>
        <div className="navbar-links">
          <Link to="/campaigns">Browse Campaigns</Link>
          {user ? (
            <>
              {isEmployee && <Link to="/employee">Platform Admin</Link>}
              {isHospitalAdmin && <Link to="/hospital-admin">Verify</Link>}
              {isCampaigner && <Link to="/campaigner">My Campaigns</Link>}
              {isDonor && <Link to="/donor">My Donations</Link>}
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
