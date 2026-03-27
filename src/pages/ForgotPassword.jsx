import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/client'

export default function ForgotPassword() {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [loading, setLoading] = useState(false)
    const [submitted, setSubmitted] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setSuccess('')
        setLoading(true)

        if (!email) {
            setError('Please enter your email address.')
            setLoading(false)
            return
        }

        try {
            const response = await api.auth.forgotPassword(email)
            setSuccess(response.message || 'Password reset link has been sent to your email. Please check your inbox.')
            setSubmitted(true)

            // Show reset token in dev mode for testing
            if (response.resetToken) {
                setSuccess(prev => prev + `\n\nDev Mode - Reset Token: ${response.resetToken}`)
            }
        } catch (err) {
            setError(err.message || 'Failed to send password reset email')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card card">
                <h1>Forgot Password</h1>
                <p className="auth-subtitle">We'll help you reset your password</p>

                {!submitted ? (
                    <form onSubmit={handleSubmit} className="auth-form">
                        <label>Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                        />

                        {error && <p className="auth-error">{error}</p>}
                        {success && <p className="auth-success">{success}</p>}

                        <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </button>
                    </form>
                ) : (
                    <div className="auth-form">
                        <div className="auth-success">
                            <p style={{ whiteSpace: 'pre-wrap' }}>{success}</p>
                        </div>
                        {success.includes('Dev Mode') && (
                            <p className="auth-info" style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
                                Copy the reset token and go to <Link to="/reset-password">Reset Password page</Link> to reset your password.
                            </p>
                        )}
                    </div>
                )}

                <p className="auth-footer">
                    <Link to="/login">Back to Login</Link>
                </p>
            </div>
        </div>
    )
}
