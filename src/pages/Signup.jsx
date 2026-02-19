import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'

export default function Signup() {
  const [searchParams] = useSearchParams()
  const roleParam = searchParams.get('role')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState(
    ['employee', 'donor', 'campaigner', 'hospital_admin'].includes(roleParam)
      ? roleParam
      : 'donor'
  )
  const [hospitalId, setHospitalId] = useState('')
  const [hospitals, setHospitals] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (['employee', 'donor', 'campaigner', 'hospital_admin'].includes(roleParam)) {
      setRole(roleParam)
    }
  }, [roleParam])

  useEffect(() => {
    if (role === 'hospital_admin') {
      api.hospitals.list().then(setHospitals).catch(() => setHospitals([]))
    }
  }, [role])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!name || !email || !password) {
      setError('Please fill in all fields.')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      setLoading(false)
      return
    }

    try {
      const body = { name, email, password, role }
      if (role === 'hospital_admin' && hospitalId) body.hospitalId = hospitalId
      const { token, user: userData, requiresVerification } = await api.auth.signup(body)
      login(userData, token)
      if (requiresVerification) {
        navigate('/verify-identity')
      } else {
        const routes = {
          employee: '/employee',
          donor: '/donor',
          campaigner: '/campaigner',
          hospital_admin: '/hospital-admin',
        }
        navigate(routes[role] || '/')
      }
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

        <form onSubmit={handleSubmit} className="auth-form">
          <label>I am a</label>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="donor">Donor</option>
            <option value="campaigner">Campaigner</option>
            <option value="hospital_admin">Hospital Admin</option>
            <option value="employee">Platform Admin</option>
          </select>

          {role === 'hospital_admin' && (
            <>
              <label>Hospital (required for Hospital Admin)</label>
              <select
                value={hospitalId}
                onChange={(e) => setHospitalId(e.target.value)}
                required={role === 'hospital_admin'}
              >
                <option value="">Select hospital</option>
                {hospitals.map((h) => (
                  <option key={h._id} value={h._id}>
                    {h.name} - {h.city || h.address}
                  </option>
                ))}
              </select>
            </>
          )}

          <label>Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            required
          />

          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
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

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Signing up...' : 'Sign Up'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  )
}
