import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('donor')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!email || !password) {
      setError('Please fill in all fields.')
      return
    }

    try {
      const { token, user: userData, requiresVerification } = await api.auth.login(
        email,
        password,
        role
      )
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
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <h1>Login</h1>
        <p className="auth-subtitle">Sign in to your CareFund account</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>I am a</label>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="donor">Donor</option>
            <option value="campaigner">Campaigner</option>
            <option value="hospital_admin">Hospital Admin</option>
            <option value="employee">Platform Admin</option>
          </select>

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
            placeholder="••••••••"
            required
          />

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  )
}
