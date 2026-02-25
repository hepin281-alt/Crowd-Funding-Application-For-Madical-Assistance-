import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AdminPendingVerification() {
    const navigate = useNavigate()
    const { user, isAdmin } = useAuth()

    useEffect(() => {
        // If user is not hospital_admin, redirect to dashboard
        if (!user) {
            navigate('/login', { replace: true })
        } else if (user.role !== 'hospital_admin') {
            navigate('/dashboard', { replace: true })
        } else if (user.is_verified) {
            navigate('/admin-dashboard', { replace: true })
        }
    }, [user, navigate])

    if (!user || user.role !== 'hospital_admin') {
        return null
    }

    return (
        <div className="verification-container">
            <div className="verification-card">
                <div className="verification-icon pending">
                    <i className="fas fa-hourglass-half"></i>
                </div>

                <h1>Account Pending Verification</h1>

                <div className="verification-details">
                    <p className="hospital-name">
                        <strong>Hospital:</strong> {user.hospital_name}
                    </p>
                    <p className="registered-email">
                        <strong>Email:</strong> {user.email}
                    </p>
                </div>

                <div className="pending-message">
                    <h2>Your hospital admin account is pending verification</h2>
                    <p>
                        Thank you for registering! We have received your information and our team is reviewing your hospital details.
                    </p>

                    <div className="verification-checklist">
                        <h3>What happens next:</h3>
                        <ul>
                            <li>
                                <span className="check-icon">✓</span>
                                <span>We verify your hospital license number ({user.license_number})</span>
                            </li>
                            <li>
                                <span className="check-icon">✓</span>
                                <span>We validate your hospital registration with authorities</span>
                            </li>
                            <li>
                                <span className="check-icon">✓</span>
                                <span>We reach out to confirm contact information</span>
                            </li>
                            <li>
                                <span className="check-icon">✓</span>
                                <span>Once verified, you can access the admin dashboard</span>
                            </li>
                        </ul>
                    </div>

                    <div className="timeline">
                        <h3>Verification Timeline:</h3>
                        <p>
                            This process typically takes <strong>2-5 business days</strong>. You'll receive an email notification once your account
                            is verified.
                        </p>
                    </div>

                    <div className="support-section">
                        <h3>Questions or Issues?</h3>
                        <p>
                            If you need to update your information or have any questions, please contact us at{' '}
                            <a href="mailto:verify@carefund.org">verify@carefund.org</a> with your hospital name.
                        </p>
                    </div>
                </div>

                <div className="action-buttons">
                    <button className="btn btn-primary" onClick={() => navigate('/')}>
                        Return to Home
                    </button>
                    <button className="btn btn-secondary" onClick={() => navigate('/campaigns')}>
                        Browse Campaigns
                    </button>
                </div>

                <p className="helpful-tip">
                    💡 While your account is pending verification, you can browse available campaigns and learn more about how CareFund works.
                </p>
            </div>
        </div>
    )
}
