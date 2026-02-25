import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'

export default function Dashboard() {
    const { user, isAdmin, isUser } = useAuth()
    const [campaigns, setCampaigns] = useState([])
    const [donations, setDonations] = useState([])
    const [receipts, setReceipts] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            try {
                if (isUser) {
                    const [c, d, r] = await Promise.all([
                        api.campaigns.my().catch(() => []),
                        api.donations.my().catch(() => []),
                        api.receipts.my().catch(() => []),
                    ])
                    setCampaigns(Array.isArray(c) ? c : [])
                    setDonations(Array.isArray(d) ? d : [])
                    setReceipts(Array.isArray(r) ? r : [])
                }
            } catch (err) {
                console.error('Dashboard error:', err)
            }
            setLoading(false)
        }
        load()
    }, [isUser])

    const totalDonated = donations.reduce((sum, d) => sum + (d.amount || 0), 0)
    const totalRaised = campaigns.reduce((sum, c) => sum + (c.amountRaised || 0), 0)

    // User Dashboard
    if (isUser) {
        return (
            <div className="dashboard user-dashboard">
                <div className="container">
                    <h1>My Dashboard</h1>
                    <p className="welcome-text">Welcome, {user?.name}!</p>

                    <div className="dashboard-stats">
                        <div className="stat-card card">
                            <span className="stat-value">₹{totalDonated.toLocaleString()}</span>
                            <span className="stat-label">Total Donated</span>
                        </div>
                        <div className="stat-card card">
                            <span className="stat-value">₹{totalRaised.toLocaleString()}</span>
                            <span className="stat-label">Total Raised</span>
                        </div>
                        <div className="stat-card card">
                            <span className="stat-value">{campaigns.length}</span>
                            <span className="stat-label">Campaigns Created</span>
                        </div>
                    </div>

                    {/* My Campaigns Section */}
                    <section className="campaigns-section">
                        <div className="section-header">
                            <h2>My Campaigns</h2>
                        </div>

                        {loading ? (
                            <p className="loading-text">Loading campaigns...</p>
                        ) : campaigns.length === 0 ? (
                            <div className="empty-state card">
                                <p>You haven't created any campaigns yet.</p>
                                <Link to="/create">
                                    <button className="btn btn-primary">Create Campaign</button>
                                </Link>
                            </div>
                        ) : (
                            <div className="case-list">
                                {campaigns.map((c) => (
                                    <div key={c._id || c.id} className="case-item card campaign-item">
                                        <div className="case-item-header">
                                            <h3>{c.patientName || 'Campaign'}</h3>
                                            <span className="status-badge">{c.status || 'pending'}</span>
                                        </div>
                                        <p className="case-desc">{c.description}</p>
                                        <p className="case-amount">
                                            ₹{(c.amountRaised || 0).toLocaleString()} / ₹{(c.amountNeeded || 0).toLocaleString()} raised
                                        </p>
                                        <Link to={`/campaigns/${c._id || c.id}`}>
                                            <button className="btn btn-secondary">View Campaign</button>
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Donation History Section */}
                    <section className="donation-history">
                        <h2>My Donations</h2>
                        {loading ? (
                            <p className="loading-text">Loading donations...</p>
                        ) : donations.length === 0 ? (
                            <div className="empty-state card">
                                <p>You haven't made any donations yet.</p>
                                <Link to="/campaigns">
                                    <button className="btn btn-primary">Browse Campaigns</button>
                                </Link>
                            </div>
                        ) : (
                            <div className="donation-list">
                                {donations.map((d) => (
                                    <div key={d._id || d.id} className="donation-item card">
                                        <div className="donation-info">
                                            <h3>{d.campaign?.patientName || 'Campaign'}</h3>
                                            <span className="donation-date">
                                                {d.createdAt ? new Date(d.createdAt).toLocaleDateString() : '—'}
                                            </span>
                                        </div>
                                        <span className="donation-amount">₹{d.amount}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Receipts Section */}
                    {receipts.length > 0 && (
                        <section className="receipts-section">
                            <h2>Utilization Receipts</h2>
                            <p>Proof of how donations were used.</p>
                            <div className="donation-list">
                                {receipts.map((r) => (
                                    <div key={r._id || r.id} className="donation-item card receipt-item">
                                        <div className="donation-info">
                                            <h3>{r.campaign?.patientName || 'Campaign'}</h3>
                                            <span>Amount: ₹{r.amount}</span>
                                            {r.invoice?.documentUrl && (
                                                <a href={r.invoice.documentUrl} target="_blank" rel="noreferrer">
                                                    View proof
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </div>
        )
    }

    // Admin Dashboard
    if (isAdmin) {
        return (
            <div className="dashboard admin-dashboard">
                <div className="container">
                    <h1>Admin Dashboard</h1>
                    <p className="welcome-text">Welcome, Admin {user?.name}!</p>

                    <section className="pending-verifications">
                        <h2>Pending User Verifications</h2>
                        <div className="empty-state card">
                            <p>No pending verifications at this time.</p>
                        </div>
                    </section>
                </div>
            </div>
        )
    }

    // Fallback
    return (
        <div className="dashboard">
            <div className="container">
                <p>Loading dashboard...</p>
            </div>
        </div>
    )
}
