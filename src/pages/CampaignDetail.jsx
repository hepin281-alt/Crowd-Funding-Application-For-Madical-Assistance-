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

        const currentNeeded = Number(campaign?.amountNeeded) || 0
        const currentRaised = Number(campaign?.amountRaised) || 0
        const isFullyFundedNow = currentNeeded > 0 && currentRaised >= currentNeeded
        if (isFullyFundedNow) {
            setError('This campaign is fully funded')
            return
        }

        if (!isDonor) {
            setError('Please login as a donor to contribute')
            return
        }

        const amount = Number(donationAmount)
        if (!amount || amount <= 0) {
            setError('Please enter a valid amount')
            return
        }
        if (amount > remaining) {
            setError(`You can donate up to ₹${remaining.toLocaleString()}`)
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

    const amountNeeded = Number(campaign.amountNeeded) || 0
    const amountRaised = Number(campaign.amountRaised) || 0
    const progress = amountNeeded > 0
        ? Math.min((amountRaised / amountNeeded) * 100, 100)
        : 0
    const remaining = Math.max(amountNeeded - amountRaised, 0)
    const isFullyFunded = amountNeeded > 0 && amountRaised >= amountNeeded

    const statusLabel = {
        pending_hospital_verification: 'Under Hospital Review',
        needs_info: 'Action Required: Update Documents',
        hospital_verified: 'Hospital Verified',
        active: 'Accepting Donations',
        completed: 'Funds Disbursed',
        rejected: 'Rejected by Hospital',
    }[campaign.status] || campaign.status

    const statusGuidance = {
        pending_hospital_verification: {
            meaning: 'Hospital team is reviewing submitted documents and treatment details.',
            nextStep: 'Wait for verification result. You will see either approval or a request for updates.',
        },
        needs_info: {
            meaning: 'Hospital requested updated documents before verification can continue.',
            nextStep: 'Upload corrected files and click Resubmit for Verification.',
        },
        hospital_verified: {
            meaning: 'Campaign is verified and eligible for invoice workflow.',
            nextStep: 'You can prepare invoice submission when treatment billing is due.',
        },
        active: {
            meaning: 'Campaign is receiving donations and progressing toward target amount.',
            nextStep: 'Track progress and submit invoices when payment milestone is reached.',
        },
        completed: {
            meaning: 'Funding and settlement cycle has been completed for this campaign.',
            nextStep: 'Use Invoice & Verification to review payout history and references.',
        },
        rejected: {
            meaning: 'Hospital verification was rejected based on submitted details.',
            nextStep: 'Review rejection details and create a corrected request if needed.',
        },
    }

    const currentStatusGuidance = statusGuidance[campaign.status] || {
        meaning: 'Status information is available for campaign lifecycle tracking.',
        nextStep: 'Open Invoice & Verification for detailed processing updates.',
    }

    const isOwner = user?.id && campaign.user_id && Number(user.id) === Number(campaign.user_id)
    const formatDate = (value, fallback = 'Date not available') => {
        if (!value) return fallback
        const d = new Date(value)
        return Number.isNaN(d.getTime()) ? fallback : d.toLocaleDateString()
    }
    const handleBack = () => {
        if (window.history.length > 1) {
            navigate(-1)
            return
        }
        navigate('/campaigns')
    }

    return (
        <div className="campaign-detail-page">
            <div className="container">
                <div style={{ marginBottom: '1rem' }}>
                    <button type="button" className="btn btn-secondary" onClick={handleBack}>
                        Back
                    </button>
                </div>
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
                                    <span className="amount-large">₹{amountRaised.toLocaleString()}</span>
                                    <span className="amount-target"> raised of ₹{amountNeeded.toLocaleString()}</span>
                                </div>
                                <div className="progress-bar">
                                    <div className={`progress-fill ${isFullyFunded ? 'funded' : ''}`} style={{ width: `${progress}%` }}></div>
                                </div>
                                <p className="progress-text">{isFullyFunded ? 'Fully funded' : `${progress.toFixed(1)}% funded`}</p>
                                {isFullyFunded ? (
                                    <p className="funded-message">This campaign has been fully funded. Thank you to all donors!</p>
                                ) : (
                                    <p className="remaining-text">₹{remaining.toLocaleString()} remaining to reach the goal</p>
                                )}
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
                                        ✓ Verified on {formatDate(campaign.verified_by_hospital_at)}
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
                                        <p>{formatDate(campaign.created_at)}</p>
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
                                                    ? formatDate(campaign.verified_by_hospital_at)
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
                        {isOwner && (
                            <div className="card review-docs">
                                <h2>Campaign Actions</h2>
                                <Link to={`/campaigner/campaign/${campaign._id}/invoice`}>
                                    <button className="btn btn-secondary btn-full" style={{ marginBottom: '0.75rem' }}>
                                        Invoice & Verification
                                    </button>
                                </Link>

                                {campaign.hospitalAdminNote ? (
                                    <p className="doc-note">
                                        <strong>Admin note:</strong> {campaign.hospitalAdminNote}
                                    </p>
                                ) : (
                                    <p className="form-hint" style={{ marginTop: 0 }}>
                                        Document resubmission unlocks only when hospital requests updates.
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
                                            disabled={campaign.status !== 'needs_info'}
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => billInputRef.current?.click()}
                                            disabled={uploading.bill || campaign.status !== 'needs_info'}
                                        >
                                            {uploading.bill ? 'Uploading...' : 'Upload'}
                                        </button>
                                        <input
                                            ref={billInputRef}
                                            type="file"
                                            accept="image/*,application/pdf"
                                            className="file-input-hidden"
                                            disabled={campaign.status !== 'needs_info'}
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
                                            disabled={campaign.status !== 'needs_info'}
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => identityInputRef.current?.click()}
                                            disabled={uploading.identity || campaign.status !== 'needs_info'}
                                        >
                                            {uploading.identity ? 'Uploading...' : 'Upload'}
                                        </button>
                                        <input
                                            ref={identityInputRef}
                                            type="file"
                                            accept="image/*,application/pdf"
                                            className="file-input-hidden"
                                            disabled={campaign.status !== 'needs_info'}
                                            onChange={(e) => handleDocUpload(e.target.files?.[0], setIdentityProofUrl, 'identity')}
                                        />
                                    </div>

                                    {docError && <p className="auth-error">{docError}</p>}
                                    {docSuccess && <p className="auth-success">{docSuccess}</p>}

                                    <button
                                        type="submit"
                                        className="btn btn-primary btn-full"
                                        disabled={campaign.status !== 'needs_info'}
                                    >
                                        {campaign.status === 'needs_info'
                                            ? 'Resubmit for Verification'
                                            : 'Resubmission Locked'}
                                    </button>
                                </form>
                            </div>
                        )}

                        <div className="card trust-indicators">
                            <h3>Status Guide</h3>
                            <p><strong>Current:</strong> {statusLabel}</p>
                            <p>{currentStatusGuidance.meaning}</p>
                            <p><strong>Next step:</strong> {currentStatusGuidance.nextStep}</p>
                        </div>

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
