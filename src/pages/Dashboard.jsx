import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'

export default function Dashboard() {
    const { user, isUser } = useAuth()
    const [campaigns, setCampaigns] = useState([])
    const [donations, setDonations] = useState([])
    const [receipts, setReceipts] = useState([])
    const [loading, setLoading] = useState(true)
    const [userTab, setUserTab] = useState('requests')

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

    const totalDonated = donations.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0)
    const totalRaised = campaigns.reduce((sum, c) => sum + (parseFloat(c.amountRaised) || 0), 0)
    const receiptByDonationId = new Map()
    receipts
        .filter((r) => r?.donation_id)
        .forEach((r) => {
            const key = String(r.donation_id)
            // Keep the first entry from DESC-sorted data to represent the latest receipt state.
            if (!receiptByDonationId.has(key)) {
                receiptByDonationId.set(key, r)
            }
        })

    const statusLabel = (status) => {
        const labels = {
            pending_hospital_verification: 'Awaiting Hospital Verification',
            needs_info: 'Needs Updated Documents',
            hospital_verified: 'Hospital Verified',
            active: 'Live',
            completed: 'Completed',
            rejected: 'Rejected',
        }
        return labels[status] || status || 'Pending'
    }

    const campaignBadgeClass = (status) => {
        if (status === 'pending_hospital_verification') return 'status-pending_hospital_verification'
        if (status === 'active' || status === 'hospital_verified' || status === 'completed') return 'status-active'
        if (status === 'needs_info' || status === 'rejected') return 'status-needs_info'
        return ''
    }

    const openReceipt = async (id) => {
        try {
            await api.receipts.downloadReceiptFile(id)
        } catch (err) {
            alert(err.message || 'Failed to download receipt')
        }
    }

    const openCertificate = async (id) => {
        try {
            await api.receipts.downloadCertificateFile(id)
        } catch (err) {
            alert(err.message || 'Failed to download certificate')
        }
    }

    // User Dashboard
    if (isUser) {
        return (
            <div className="dashboard user-dashboard user-dashboard-warm">
                <div className="container">
                    <h1>CareFund User Dashboard</h1>
                    <p className="welcome-text">Welcome, {user?.name}. Track your help requests and contributions in one place.</p>

                    <div className="user-tabs card">
                        <button
                            type="button"
                            className={`user-tab-btn ${userTab === 'requests' ? 'active' : ''}`}
                            onClick={() => setUserTab('requests')}
                        >
                            My Help Requests
                        </button>
                        <button
                            type="button"
                            className={`user-tab-btn ${userTab === 'contributions' ? 'active' : ''}`}
                            onClick={() => setUserTab('contributions')}
                        >
                            My Contributions
                        </button>
                    </div>

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
                            <span className="stat-label">Help Requests Created</span>
                        </div>
                    </div>

                    {userTab === 'requests' ? (
                        <section className="campaigns-section">
                            <div className="section-header">
                                <h2>Campaigner View</h2>
                                <Link to="/campaigner/create">
                                    <button className="btn btn-primary">Create New Request</button>
                                </Link>
                            </div>

                            {loading ? (
                                <p className="loading-text">Loading help requests...</p>
                            ) : campaigns.length === 0 ? (
                                <div className="empty-state card">
                                    <p>You have not created a help request yet.</p>
                                    <Link to="/campaigner/create">
                                        <button className="btn btn-primary">Create Campaign</button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="case-list">
                                    {campaigns.map((c) => {
                                        const amountNeeded = Number(c.amountNeeded) || 0
                                        const amountRaised = Number(c.amountRaised) || 0
                                        const progress = amountNeeded > 0 ? Math.min((amountRaised / amountNeeded) * 100, 100) : 0
                                        const campaignId = c._id || c.id
                                        const campaignUrl = `${window.location.origin}/campaigns/${campaignId}`
                                        const shareMessage = encodeURIComponent(`Support ${c.patientName || 'this patient'} on CareFund`) + `&url=${encodeURIComponent(campaignUrl)}`

                                        return (
                                            <div key={campaignId} className="case-item card campaign-item warm-card">
                                                <div className="case-item-header">
                                                    <h3>{c.patientName || 'Campaign'}</h3>
                                                    <span className={`status-badge ${campaignBadgeClass(c.status)}`}>{statusLabel(c.status)}</span>
                                                </div>

                                                <div className="trust-badge-row">
                                                    <span className="trust-badge">Hospital Verified Flow</span>
                                                    <span className="trust-badge">Direct Payout</span>
                                                    <span className="trust-badge">ID Verified</span>
                                                </div>

                                                <p className="case-desc">{c.description}</p>

                                                {c.status === 'pending_hospital_verification' && (
                                                    <p className="case-meta"><strong>Verification:</strong> Currently being reviewed by {c.hospital?.name || 'the selected hospital'}.</p>
                                                )}

                                                <div className="case-progress">
                                                    <div className="progress-bar">
                                                        <div className="progress-fill" style={{ width: `${progress}%` }} />
                                                    </div>
                                                    <p className="progress-text">
                                                        ₹{amountRaised.toLocaleString()} of ₹{amountNeeded.toLocaleString()} raised ({progress.toFixed(1)}%)
                                                    </p>
                                                </div>

                                                <div className="case-meta">
                                                    <strong>Document Vault:</strong>{' '}
                                                    {c.medicalBillUrl ? <a href={c.medicalBillUrl} target="_blank" rel="noreferrer">Medical Bill</a> : 'Medical Bill pending'}{' '}
                                                    |{' '}
                                                    {c.patientIdentityProofUrl ? <a href={c.patientIdentityProofUrl} target="_blank" rel="noreferrer">Identity Proof</a> : 'Identity Proof pending'}
                                                </div>

                                                <div className="case-meta">
                                                    <strong>Transparency Feed:</strong>{' '}
                                                    {c.status === 'completed'
                                                        ? 'Hospital settlement completed and campaign closed.'
                                                        : c.status === 'hospital_verified' || c.status === 'active'
                                                            ? 'Campaign is eligible for direct hospital payout once invoices are matched.'
                                                            : 'Awaiting verification stage completion before payout lifecycle starts.'}
                                                </div>

                                                <div className="share-row">
                                                    <a
                                                        className="btn btn-secondary"
                                                        href={`https://wa.me/?text=${shareMessage}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                    >
                                                        Share on WhatsApp
                                                    </a>
                                                    <a
                                                        className="btn btn-secondary"
                                                        href={`https://twitter.com/intent/tweet?text=${shareMessage}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                    >
                                                        Share on Twitter
                                                    </a>
                                                    <a
                                                        className="btn btn-secondary"
                                                        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(campaignUrl)}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                    >
                                                        Share on Facebook
                                                    </a>
                                                </div>

                                                <div className="case-actions">
                                                    <Link to={`/campaigns/${campaignId}`}>
                                                        <button className="btn btn-primary">Open Campaign</button>
                                                    </Link>
                                                    <Link to={`/campaigner/campaign/${campaignId}/invoice`}>
                                                        <button className="btn btn-secondary">Invoice & Verification</button>
                                                    </Link>
                                                    {c.status === 'needs_info' && (
                                                        <Link to={`/campaigns/${campaignId}`}>
                                                            <button className="btn btn-secondary">Update Documents</button>
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </section>
                    ) : (
                        <section className="donation-history">
                            <h2>Donor View</h2>
                            <div className="section-header" style={{ marginBottom: '1rem' }}>
                                <Link to="/donor/campaigns">
                                    <button className="btn btn-primary">Browse Running Campaigns</button>
                                </Link>
                            </div>
                            {loading ? (
                                <p className="loading-text">Loading contributions...</p>
                            ) : donations.length === 0 ? (
                                <div className="empty-state card">
                                    <p>You have not made any contribution yet.</p>
                                    <Link to="/campaigns">
                                        <button className="btn btn-primary">Browse Campaigns</button>
                                    </Link>
                                </div>
                            ) : (
                                <>
                                    <div className="donation-list">
                                        {donations.map((d) => {
                                            const donationId = String(d._id || d.id || d.donation_id || '')
                                            const receipt = receiptByDonationId.get(donationId)
                                            return (
                                                <div key={donationId} className="donation-item card donation-item-stacked warm-card">
                                                    <div className="donation-info">
                                                        <h3>{d.campaign?.patientName || 'Campaign'}</h3>
                                                        <span className="donation-date">
                                                            {d.createdAt || d.created_at ? new Date(d.createdAt || d.created_at).toLocaleDateString() : '—'}
                                                        </span>
                                                    </div>
                                                    <span className="donation-amount">₹{(Number(d.amount) || 0).toLocaleString()}</span>

                                                    <div className="donation-actions-row">
                                                        {receipt ? (
                                                            <>
                                                                <button className="btn btn-primary" onClick={() => openReceipt(receipt._id || receipt.id)}>
                                                                    Download Receipt
                                                                </button>
                                                                <button className="btn btn-secondary" onClick={() => openCertificate(receipt._id || receipt.id)}>
                                                                    Download Tax Certificate
                                                                </button>
                                                                {receipt.invoice?.documentUrl ? (
                                                                    <a href={receipt.invoice.documentUrl} target="_blank" rel="noreferrer" className="btn btn-secondary">
                                                                        View Utilization Proof
                                                                    </a>
                                                                ) : (
                                                                    <span className="case-meta">Utilization proof pending</span>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <span className="case-meta">Receipt will appear once processed.</span>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>

                                    <div className="impact-feed card warm-card">
                                        <h3>Impact Feed</h3>
                                        <ul>
                                            {donations.slice(0, 5).map((d) => {
                                                const donationId = String(d._id || d.id || d.donation_id || '')
                                                const receipt = receiptByDonationId.get(donationId)
                                                const reachedGoal = ['completed'].includes(d.campaign?.status)
                                                const hasProof = !!receipt?.invoice?.documentUrl
                                                const text = reachedGoal
                                                    ? `${d.campaign?.patientName || 'A patient'} reached their goal. Thank you for helping.`
                                                    : hasProof
                                                        ? `New utilization proof is available for ${d.campaign?.patientName || 'your supported campaign'}.`
                                                        : `${d.campaign?.patientName || 'Campaign'} is still in treatment journey. Updates expected soon.`
                                                return <li key={`impact-${donationId}`}>{text}</li>
                                            })}
                                        </ul>
                                    </div>
                                </>
                            )}
                        </section>
                    )}
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
