import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'

export default function Signup() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [role, setRole] = useState('user')

  // User fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(false)

  // Hospital Admin fields
  const [adminName, setAdminName] = useState('')
  const [hospitalEmail, setHospitalEmail] = useState('')
  const [hospitalName, setHospitalName] = useState('')
  const [licenseNumber, setLicenseNumber] = useState('')
  const [hospitalPhone, setHospitalPhone] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [adminAgreeTerms, setAdminAgreeTerms] = useState(false)

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Redirect to dashboard if already logged in
  if (user) {
    if (user.role === 'admin' || user.role === 'hospital_admin') {
      navigate('/admin-dashboard', { replace: true })
    } else {
      navigate('/dashboard', { replace: true })
    }
    return null
  }

  const handleUserSignup = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!name || !email || !phone || !password) {
      setError('Please fill in all fields.')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      setLoading(false)
      return
    }

    if (!agreeTerms) {
      setError('Please accept the Terms & Conditions.')
      setLoading(false)
      return
    }

    try {
      const body = { name, email, phone, password, role: 'user' }
      const { token, user: userData } = await api.auth.signup(body)
      login(userData, token)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Sign up failed')
    } finally {
      setLoading(false)
    }
  }

  const handleAdminSignup = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!adminName || !hospitalEmail || !hospitalName || !licenseNumber || !hospitalPhone || !adminPassword) {
      setError('Please fill in all fields.')
      setLoading(false)
      return
    }

    if (adminPassword.length < 6) {
      setError('Password must be at least 6 characters.')
      setLoading(false)
      return
    }

    if (!adminAgreeTerms) {
      setError('Please accept the Terms & Conditions.')
      setLoading(false)
      return
    }

    try {
      const body = {
        name: adminName,
        email: hospitalEmail,
        password: adminPassword,
        role: 'hospital_admin',
        hospitalName,
        licenseNumber,
        phone: hospitalPhone,
      }
      const { token, user: userData } = await api.auth.signup(body)
      login(userData, token)
      // Redirect to profile/verification page for hospital admin
      navigate('/admin-pending-verification')
    } catch (err) {
      setError(err.message || 'Sign up failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <h1>Sign Up</h1>
        <p className="auth-subtitle">Create your CareFund account</p>

        {/* Role Selection */}
        <div className="role-selection">
          <label className="role-label">I am a:</label>
          <div className="role-options">
            <label className="role-option">
              <input
                type="radio"
                name="role"
                value="user"
                checked={role === 'user'}
                onChange={(e) => setRole(e.target.value)}
              />
              <span>Donor / Patient / Campaigner</span>
            </label>
            <label className="role-option">
              <input
                type="radio"
                name="role"
                value="hospital_admin"
                checked={role === 'hospital_admin'}
                onChange={(e) => setRole(e.target.value)}
              />
              <span>Hospital Admin</span>
            </label>
          </div>
        </div>

        {error && <p className="auth-error">{error}</p>}

        {/* User Signup Form */}
        {role === 'user' ? (
          <form onSubmit={handleUserSignup} className="auth-form">
            <label>Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              required
            />

            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />

            <label>Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 XXXXX XXXXX"
              required
            />

            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              minLength={6}
            />

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                required
              />
              <span>I agree to the Terms & Conditions and Privacy Policy</span>
            </label>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Signing up...' : 'Sign Up'}
            </button>
          </form>
        ) : (
          /* Hospital Admin Signup Form */
          <form onSubmit={handleAdminSignup} className="auth-form">
            <label>Admin's Full Name</label>
            <input
              type="text"
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              placeholder="Your full name"
              required
            />

            <label>Official Hospital Email Address</label>
            <input
              type="email"
              value={hospitalEmail}
              onChange={(e) => setHospitalEmail(e.target.value)}
              placeholder="admin@cityhospital.com"
              required
            />

            <label>Hospital Name</label>
            <input
              type="text"
              value={hospitalName}
              onChange={(e) => setHospitalName(e.target.value)}
              placeholder="Official hospital name"
              required
            />

            <label>Hospital Registration / License Number</label>
            <input
              type="text"
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              placeholder="License or registration number"
              required
            />

            <label>Hospital Contact Number</label>
            <input
              type="tel"
              value={hospitalPhone}
              onChange={(e) => setHospitalPhone(e.target.value)}
              placeholder="+91 XXXXX XXXXX"
              required
            />

            <label>Password</label>
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              minLength={6}
            />

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={adminAgreeTerms}
                onChange={(e) => setAdminAgreeTerms(e.target.checked)}
                required
              />
              <span>I agree to the Terms & Conditions and Privacy Policy</span>
            </label>

            <p className="verification-note">
              Note: Your account will be in Pending Verification state. Our team will verify your hospital details before full access is granted.
            </p>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Signing up...' : 'Sign Up'}
            </button>
          </form>
        )}

        <p className="auth-footer">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  )
}
