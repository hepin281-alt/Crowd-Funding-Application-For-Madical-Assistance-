import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function HospitalVerify() {
  const { campaignId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [campaign, setCampaign] = useState(null)
  const [ipdNumber, setIpdNumber] = useState('')
  const [requestNote, setRequestNote] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (campaignId) {
      api.campaigns
        .get(campaignId)
        .then(setCampaign)
        .catch(() => setCampaign(null))
    }
  }, [campaignId])

  const handleVerify = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!ipdNumber.trim()) {
      setError('Patient Registration Number (IPD No) is required')
      setLoading(false)
      return
    }

    try {
      await api.hospitalAdmin.verify(campaignId, ipdNumber.trim())
      setSuccess(true)
      setCampaign((prev) =>
        prev ? { ...prev, status: 'hospital_verified', ipdNumber } : null
      )
    } catch (err) {
      setError(err.message || 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const handleRequestInfo = async () => {
    setError('')
    if (!requestNote.trim()) {
      setError('Add a short note describing what needs to be updated')
      return
    }
    setLoading(true)
    try {
      await api.hospitalAdmin.requestInfo(campaignId, requestNote.trim())
      navigate('/hospital-admin')
    } catch (err) {
      setError(err.message || 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    if (!confirm('Reject and flag this campaign?')) return
    setLoading(true)
    try {
      await api.hospitalAdmin.reject(campaignId, rejectReason.trim() || 'Rejected by hospital')
      navigate('/hospital-admin')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!campaign) {
    return (
      <div className="auth-page">
        <div className="auth-card card">
          <p className="loading-text">Loading...</p>
        </div>
      </div>
    )
  }

  if (campaign.status === 'hospital_verified') {
    return (
      <div className="auth-page">
        <div className="auth-card card">
          <h1>✓ Already Verified</h1>
          <p>This campaign has been verified by the hospital.</p>
          <p>Patient: {campaign.patientName}</p>
          <p>IPD No: {campaign.ipdNumber}</p>
        </div>
      </div>
    )
  }

  if (campaign.status !== 'pending_hospital_verification') {
    return (
      <div className="auth-page">
        <div className="auth-card card">
          <h1>Campaign Status</h1>
          <p>Status: {campaign.status}</p>
        </div>
      </div>
    )
  }

  const isHospitalAdmin = user?.role === 'hospital_admin'
  const needsLogin = !user || !isHospitalAdmin

  const renderDocument = (url) => {
    if (!url) {
      return <div className="doc-placeholder">No document uploaded</div>
    }
    const lower = url.toLowerCase()
    if (lower.endsWith('.pdf')) {
      return (
        <iframe
          className="doc-frame"
          src={url}
          title="Document preview"
        />
      )
    }
    return <img className="doc-image" src={url} alt="Document preview" />
  }

  return (
    <div className="verification-review">
      <div className="container">
        <div className="review-header">
          <div>
            <h1>Verification Review</h1>
            <p className="review-subtitle">
              Confirm the patient and documents before approving.
            </p>
          </div>
          <span className="status-badge status-pending_hospital_verification">
            Pending Verification
          </span>
        </div>

        {needsLogin ? (
          <div className="card auth-card">
            <p>
              <a href="/login">Login as Hospital Admin</a> to verify.
            </p>
          </div>
        ) : (
          <div className="review-grid">
            <div className="card review-claims">
              <h2>Patient & Medical Claim</h2>
              <div className="review-row">
                <div>
                  <span className="review-label">Patient Name</span>
                  <p>{campaign.patientName}</p>
                </div>
                <div>
                  <span className="review-label">Diagnosis</span>
                  <p>{campaign.medicalCondition || '—'}</p>
                </div>
              </div>
              <div className="review-row">
                <div>
                  <span className="review-label">Treating Doctor</span>
                  <p>{campaign.treatingDoctorName || '—'}</p>
                </div>
                <div>
                  <span className="review-label">Requested Amount</span>
                  <p>₹{campaign.amountNeeded?.toLocaleString()}</p>
                </div>
              </div>
              <div className="review-row">
                <div>
                  <span className="review-label">Campaigner</span>
                  <p>{campaign.campaigner?.name || '—'}</p>
                </div>
                <div>
                  <span className="review-label">Email</span>
                  <p>{campaign.campaigner?.email || '—'}</p>
                </div>
              </div>
              <div className="review-block">
                <span className="review-label">Story</span>
                <p className="case-desc">{campaign.description}</p>
              </div>

              <div className="review-actions">
                <form onSubmit={handleVerify} className="review-form">
                  <label>Patient Registration Number (IPD No)</label>
                  <input
                    type="text"
                    value={ipdNumber}
                    onChange={(e) => setIpdNumber(e.target.value)}
                    placeholder="IPD-2024-001"
                    required
                  />
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading || success}
                  >
                    {loading ? 'Approving...' : 'Approve & Activate'}
                  </button>
                </form>

                <div className="review-form">
                  <label>Request Modification (Needs Info)</label>
                  <textarea
                    rows={4}
                    value={requestNote}
                    onChange={(e) => setRequestNote(e.target.value)}
                    placeholder="e.g., Please upload a clearer bill or the updated estimate from yesterday."
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleRequestInfo}
                    disabled={loading}
                  >
                    Request Update
                  </button>
                </div>

                <div className="review-form">
                  <label>Reject / Flag (Optional Reason)</label>
                  <textarea
                    rows={3}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="e.g., No record of patient in hospital system."
                  />
                  <button
                    type="button"
                    className="btn btn-reject"
                    onClick={handleReject}
                    disabled={loading}
                  >
                    Reject / Flag
                  </button>
                </div>
              </div>

              {error && <p className="auth-error">{error}</p>}
              {success && (
                <p className="auth-success">✓ Campaign verified successfully!</p>
              )}
            </div>

            <div className="card review-docs">
              <h2>Verification Documents</h2>
              <div className="doc-section">
                <div className="doc-header">
                  <h3>Medical Estimate / Bill</h3>
                  {campaign.medicalBillUrl && (
                    <a href={campaign.medicalBillUrl} target="_blank" rel="noreferrer">
                      Open in new tab
                    </a>
                  )}
                </div>
                {renderDocument(campaign.medicalBillUrl)}
              </div>

              <div className="doc-section">
                <div className="doc-header">
                  <h3>Patient Identity Proof</h3>
                  {campaign.patientIdentityProofUrl && (
                    <a href={campaign.patientIdentityProofUrl} target="_blank" rel="noreferrer">
                      Open in new tab
                    </a>
                  )}
                </div>
                {renderDocument(campaign.patientIdentityProofUrl)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
