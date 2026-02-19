import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'

export default function VerifyIdentity() {
  const { user, updateUser } = useAuth()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!code.trim()) {
      setError('Enter the 6-digit code')
      return
    }
    setLoading(true)
    try {
      const { user: userData } = await api.auth.verifyIdentity(code.trim())
      updateUser(userData)
      navigate('/employee')
    } catch (err) {
      setError(err.message || 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setError('')
    setResending(true)
    try {
      const res = await api.auth.resendVerification()
      if (res.verificationCode) {
        setError(`New code (dev only): ${res.verificationCode}`)
      } else {
        setError('New code sent to your email')
      }
    } catch (err) {
      setError(err.message || 'Could not resend')
    } finally {
      setResending(false)
    }
  }

  if (!user) {
    navigate('/login')
    return null
  }
  if (user.role !== 'employee' && user.role !== 'hospital_admin') {
    navigate('/')
    return null
  }
  if (user.isVerified) {
    navigate(user.role === 'hospital_admin' ? '/hospital-admin' : '/employee')
    return null
  }

  return (
    <div className="auth-page">
      <div className="auth-card card verify-card">
        <h1>Verify Your Identity</h1>
        <p className="auth-subtitle">
          We've sent a 6-digit verification code to <strong>{user?.email}</strong>.
          Enter it below to complete your setup.
        </p>
        <p className="verify-hint">
          Check your email inbox. In development, the code is also shown in the server console.
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>Verification Code</label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            className="verify-input"
          />

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify Identity'}
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-full btn-link-style"
            onClick={handleResend}
            disabled={resending}
          >
            {resending ? 'Sending...' : 'Resend Code'}
          </button>
        </form>
      </div>
    </div>
  )
}
