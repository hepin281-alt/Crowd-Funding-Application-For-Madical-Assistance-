import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function CampaignDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user, isDonor } = useAuth()
    const [campaign, setCampaign] = useState(null)
    const [loading, setLoading] = useState(true)
    const [donationAmount, setDonationAmount] = useState('')
    const [donating, setDonating] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [docError, setDocError] = useState('')
    const [docSuccess, setDocSuccess] = useState('')
    const [medicalBillUrl, setMedicalBillUrl] = useState('')
    const [identityProofUrl, setIdentityProofUrl] = useState('')
    const [uploading, setUploading] = useState({ bill: false, identity: false })
    const billInputRef = useRef(null)
    const identityInputRef = useRef(null)

    useEffect(() => {
        loadCampaign()
    }, [id])

    const loadCampaign = () => {
        api.campaigns
            .get(id)
            .then((data) => {
                setCampaign(data)
                setMedicalBillUrl(data.medicalBillUrl || '')
                setIdentityProofUrl(data.patientIdentityProofUrl || '')
            })
            .catch(() => {
                setError('Campaign not found')
                setCampaign(null)
            })
            .finally(() => setLoading(false))
    }

    const handleDocUpload = async (file, setUrl, key) => {
        if (!file) return
        setUploading((prev) => ({ ...prev, [key]: true }))
        setDocError('')
        try {
            const result = await api.uploads.upload(file)
            setUrl(result.url)
        } catch (err) {
            setDocError(err.message || 'Upload failed')
        } finally {
            setUploading((prev) => ({ ...prev, [key]: false }))
        }
    }

    const handleResubmit = async (e) => {
        e.preventDefault()
        setDocError('')
        setDocSuccess('')
        if (!medicalBillUrl.trim() || !identityProofUrl.trim()) {
            setDocError('Both documents are required to resubmit')
            return
        }
        try {
            await api.campaigns.updateDocuments(campaign._id, {
                medicalBillUrl: medicalBillUrl.trim(),
                patientIdentityProofUrl: identityProofUrl.trim(),
            })
            setDocSuccess('Documents resubmitted for verification')
            loadCampaign()
        } catch (err) {
            setDocError(err.message || 'Resubmission failed')
        }
    }

    const handleDonate = async (e) => {
        e.preventDefault()
        setError('')
        setSuccess(false)

        if (!isDonor) {
            setError('Please login as a donor to contribute')
            return
        }

        const amount = Number(donationAmount)
        if (!amount || amount <= 0) {
            setError('Please enter a valid amount')
            return
        }

        setDonating(true)
        try {
            await api.donations.create(campaign._id, amount)
            setSuccess(true)
            setDonationAmount('')
            loadCampaign()
        } catch (err) {
            setError(err.message || 'Donation failed')
        } finally {
            setDonating(false)
        }
    }

    if (loading) {
        return (
            <div className="campaign-detail-page">
                <div className="container">
                    <p className="loading-text">Loading campaign...</p>
                </div>
            </div>
        )
    }

    if (!campaign) {
        return (
            <div className="campaign-detail-page">
                <div className="container">
                    <div className="card">
                        <h1>Campaign Not Found</h1>
                        <p>The campaign you're looking for doesn't exist or has been removed.</p>
                        <Link to="/campaigns">
                            <button className="btn btn-primary">Browse Campaigns</button>
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    const progress = campaign.amountNeeded > 0
        ? Math.min((campaign.amountRaised / campaign.amountNeeded) * 100, 100)
        : 0

    const statusLabel = {
        pending_hospital_verification: 'Awaiting Hospital Verification',
        needs_info: 'Needs Updated Documents',
        hospital_verified: 'Verified by Hospital',
        active: 'Active',
        completed: 'Completed',
        rejected: 'Rejected'
    }[campaign.status] || campaign.status

    const isOwner = user?.id && campaign.user_id && Number(user.id) === Number(campaign.user_id)

    return (
        <div className="campaign-detail-page">
            <div className="container">
                <div className="campaign-detail-grid">
                    <div className="campaign-main">
                        <div className="card campaign-header">
                            <div className="campaign-status-row">
                                <span className={`status-badge status-${campaign.status}`}>
                                    {statusLabel}
                                </span>
                                {campaign.hospital && (
                                    <span className="hospital-badge">
                                        🏥 {campaign.hospital.name}
                                    </span>
                                )}
                            </div>

                            <h1>{campaign.patientName}</h1>

                            {campaign.ipdNumber && (
                                <p className="ipd-number">
                                    <strong>Patient Registration No:</strong> {campaign.ipdNumber}
                                </p>
                            )}

                            <div className="campaign-progress">
                                <div className="amount-raised">
                                    <span className="amount-large">₹{campaign.amountRaised?.toLocaleString() || 0}</span>
                                    <span className="amount-target"> raised of ₹{campaign.amountNeeded?.toLocaleString()}</span>
                                </div>
                                <div className="progress-bar">
                                    <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                                </div>
                                <p className="progress-text">{progress.toFixed(1)}% funded</p>
                            </div>
                        </div>

                        <div className="card campaign-description">
                            <h2>About This Campaign</h2>
                            <p className="description-text">{campaign.description}</p>
                        </div>

                        {campaign.hospital && (
                            <div className="card hospital-info">
                                <h2>Hospital Information</h2>
                                <p><strong>Name:</strong> {campaign.hospital.name}</p>
                                {campaign.hospital.city && <p><strong>City:</strong> {campaign.hospital.city}</p>}
                                {campaign.hospital.address && <p><strong>Address:</strong> {campaign.hospital.address}</p>}
                                {campaign.verified_by_hospital_at && (
                                    <p className="verified-date">
                                        ✓ Verified on {new Date(campaign.verified_by_hospital_at).toLocaleDateString()}
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="card campaign-timeline">
                            <h2>Campaign Timeline</h2>
                            <div className="timeline">
                                <div className="timeline-item completed">
                                    <div className="timeline-marker">✓</div>
                                    <div className="timeline-content">
                                        <h3>Campaign Created</h3>
                                        <p>{new Date(campaign.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                {campaign.status === 'needs_info' && (
                                    <div className="timeline-item pending">
                                        <div className="timeline-marker">○</div>
                                        <div className="timeline-content">
                                            <h3>Hospital Requested Updates</h3>
                                            <p>{isOwner ? (campaign.hospitalAdminNote || 'Update documents and resubmit') : 'Updates requested by hospital'}</p>
                                        </div>
                                    </div>
                                )}

                                {campaign.status !== 'rejected' && (
                                    <div className={`timeline-item ${['hospital_verified', 'active', 'completed'].includes(campaign.status) ? 'completed' : 'pending'}`}>
                                        <div className="timeline-marker">
                                            {['hospital_verified', 'active', 'completed'].includes(campaign.status) ? '✓' : '○'}
                                        </div>
                                        <div className="timeline-content">
                                            <h3>Hospital Verification</h3>
                                            <p>
                                                {campaign.verified_by_hospital_at
                                                    ? new Date(campaign.verified_by_hospital_at).toLocaleDateString()
                                                    : 'Pending verification'}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {campaign.status === 'rejected' && (
                                    <div className="timeline-item rejected">
                                        <div className="timeline-marker">✗</div>
                                        <div className="timeline-content">
                                            <h3>Rejected by Hospital</h3>
                                            {campaign.rejection_reason && <p>{campaign.rejection_reason}</p>}
                                        </div>
                                    </div>
                                )}

                                {campaign.status !== 'rejected' && (
                                    <>
                                        <div className={`timeline-item ${campaign.amountRaised > 0 ? 'completed' : 'pending'}`}>
                                            <div className="timeline-marker">
                                                {campaign.amountRaised > 0 ? '✓' : '○'}
                                            </div>
                                            <div className="timeline-content">
                                                <h3>Receiving Donations</h3>
                                                <p>{campaign.amountRaised > 0 ? `₹${campaign.amountRaised.toLocaleString()} raised` : 'Awaiting donations'}</p>
                                            </div>
                                        </div>

                                        <div className={`timeline-item ${campaign.status === 'completed' ? 'completed' : 'pending'}`}>
                                            <div className="timeline-marker">
                                                {campaign.status === 'completed' ? '✓' : '○'}
                                            </div>
                                            <div className="timeline-content">
                                                <h3>Funds Disbursed</h3>
                                                <p>{campaign.status === 'completed' ? 'Paid to hospital' : 'Pending'}</p>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="campaign-sidebar">
                        {campaign.status === 'needs_info' && isOwner && (
                            <div className="card review-docs">
                                <h2>Update Verification Documents</h2>
                                {campaign.hospitalAdminNote && (
                                    <p className="doc-note">
                                        <strong>Admin note:</strong> {campaign.hospitalAdminNote}
                                    </p>
                                )}
                                <form className="doc-form" onSubmit={handleResubmit}>
                                    <label>Medical Estimate / Bill</label>
                                    <div className="upload-row">
                                        <input
                                            type="url"
                                            value={medicalBillUrl}
                                            onChange={(e) => setMedicalBillUrl(e.target.value)}
                                            placeholder="https://example.com/medical-bill.pdf"
                                            className="form-input"
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => billInputRef.current?.click()}
                                            disabled={uploading.bill}
                                        >
                                            {uploading.bill ? 'Uploading...' : 'Upload'}
                                        </button>
                                        <input
                                            ref={billInputRef}
                                            type="file"
                                            accept="image/*,application/pdf"
                                            className="file-input-hidden"
                                            onChange={(e) => handleDocUpload(e.target.files?.[0], setMedicalBillUrl, 'bill')}
                                        />
                                    </div>

                                    <label>Patient Identity Proof</label>
                                    <div className="upload-row">
                                        <input
                                            type="url"
                                            value={identityProofUrl}
                                            onChange={(e) => setIdentityProofUrl(e.target.value)}
                                            placeholder="https://example.com/id-proof.pdf"
                                            className="form-input"
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => identityInputRef.current?.click()}
                                            disabled={uploading.identity}
                                        >
                                            {uploading.identity ? 'Uploading...' : 'Upload'}
                                        </button>
                                        <input
                                            ref={identityInputRef}
                                            type="file"
                                            accept="image/*,application/pdf"
                                            className="file-input-hidden"
                                            onChange={(e) => handleDocUpload(e.target.files?.[0], setIdentityProofUrl, 'identity')}
                                        />
                                    </div>

                                    {docError && <p className="auth-error">{docError}</p>}
                                    {docSuccess && <p className="auth-success">{docSuccess}</p>}

                                    <button type="submit" className="btn btn-primary btn-full">
                                        Resubmit for Verification
                                    </button>
                                </form>
                            </div>
                        )}
                        {(campaign.status === 'hospital_verified' || campaign.status === 'active') && (
                            <div className="card donate-card">
                                <h2>Support This Campaign</h2>
                                {!user ? (
                                    <div>
                                        <p>Please login to donate</p>
                                        <Link to="/login">
                                            <button className="btn btn-primary btn-full">Login</button>
                                        </Link>
                                    </div>
                                ) : !isDonor ? (
                                    <div>
                                        <p>Only donors can contribute to campaigns</p>
                                        <Link to="/signup?role=donor">
                                            <button className="btn btn-primary btn-full">Sign up as Donor</button>
                                        </Link>
                                    </div>
                                ) : (
                                    <form onSubmit={handleDonate} className="donate-form">
                                        <label>Donation Amount (₹)</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={donationAmount}
                                            onChange={(e) => setDonationAmount(e.target.value)}
                                            placeholder="Enter amount"
                                            disabled={donating || success}
                                        />

                                        {error && <p className="auth-error">{error}</p>}
                                        {success && <p className="auth-success">Thank you for your donation!</p>}

                                        <button
                                            type="submit"
                                            className="btn btn-primary btn-full"
                                            disabled={donating || success}
                                        >
                                            {donating ? 'Processing...' : success ? 'Donated!' : 'Donate Now'}
                                        </button>
                                    </form>
                                )}
                            </div>
                        )}

                        <div className="card trust-indicators">
                            <h3>Trust & Safety</h3>
                            <ul className="trust-list">
                                <li>✓ Hospital verified campaign</li>
                                <li>✓ Funds held in escrow</li>
                                <li>✓ Direct payment to hospital</li>
                                <li>✓ Invoice verification required</li>
                                <li>✓ Donation receipts provided</li>
                            </ul>
                        </div>

                        <div className="card share-card">
                            <h3>Share This Campaign</h3>
                            <p>Help spread the word</p>
                            <div className="share-buttons">
                                <button className="btn btn-secondary btn-full" onClick={() => {
                                    navigator.clipboard.writeText(window.location.href)
                                    alert('Link copied to clipboard!')
                                }}>
                                    📋 Copy Link
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
