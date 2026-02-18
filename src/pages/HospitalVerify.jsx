import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function HospitalVerify() {
  const { campaignId } = useParams()
  const { user, isHospitalAdmin } = useAuth()
  const navigate = useNavigate()
  const [campaign, setCampaign] = useState(null)
  const [ipdNumber, setIpdNumber] = useState('')
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

  const handleReject = async () => {
    if (!confirm('Reject this campaign?')) return
    setLoading(true)
    try {
      await api.hospitalAdmin.reject(campaignId, 'Rejected by hospital')
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

  const needsLogin = !user || !isHospitalAdmin

  return (
    <div className="auth-page">
      <div className="auth-card card verify-card">
        <h1>Verify Campaign</h1>
        <p className="auth-subtitle">
          A campaign for <strong>{campaign.patientName}</strong> claims admission
          at your facility. Enter the Patient Registration Number (IPD No) to
          verify.
        </p>
        <p className="case-desc">{campaign.description}</p>
        <p className="case-amount">
          Amount requested: ₹{campaign.amountNeeded?.toLocaleString()}
        </p>

        {needsLogin ? (
          <p>
            <a href="/login">Login as Hospital Admin</a> to verify.
          </p>
        ) : (
          <form onSubmit={handleVerify} className="auth-form">
            <label>Patient Registration Number (IPD No)</label>
            <input
              type="text"
              value={ipdNumber}
              onChange={(e) => setIpdNumber(e.target.value)}
              placeholder="IPD-2024-001"
              required
            />

            {error && <p className="auth-error">{error}</p>}
            {success && (
              <p className="auth-success">✓ Campaign verified successfully!</p>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading || success}
            >
              {loading ? 'Verifying...' : success ? 'Verified' : 'Verify'}
            </button>

            {!success && (
              <button
                type="button"
                className="btn btn-reject btn-full"
                onClick={handleReject}
                disabled={loading}
              >
                Reject
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  )
}
