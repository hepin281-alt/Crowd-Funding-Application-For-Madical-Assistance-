import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { api } from '../api/client'

export default function ResetPassword() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const [token, setToken] = useState(searchParams.get('token') || '')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setSuccess('')

        if (!token) {
            setError('Reset token is required. Please use the link from your email.')
            return
        }

        if (!password || !confirmPassword) {
            setError('Please fill in all fields.')
            return
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters.')
            return
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.')
            return
        }

        setLoading(true)

        try {
            await api.auth.resetPassword(token, password)
            setSuccess('Password has been reset successfully! Redirecting to login...')
            setTimeout(() => {
                navigate('/login')
            }, 2000)
        } catch (err) {
            setError(err.message || 'Failed to reset password')
            setLoading(false)
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card card">
                <h1>Reset Password</h1>
                <p className="auth-subtitle">Enter your new password</p>

                <form onSubmit={handleSubmit} className="auth-form">
                    <label>Reset Token</label>
                    <input
                        type="text"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        placeholder="Paste reset token here"
                        required
                    />

                    <label>New Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                    />

                    <label>Confirm Password</label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                    />

                    {error && <p className="auth-error">{error}</p>}
                    {success && <p className="auth-success">{success}</p>}

                    <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                        {loading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>

                <p className="auth-footer">
                    <Link to="/login">Back to Login</Link>
                </p>
            </div>
        </div>
    )
}
