import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import axiosInstance from '../api/axiosInstance'

export default function InvoiceUpload() {
  const { campaignId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [amount, setAmount] = useState('')
  const [documentUrl, setDocumentUrl] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [donorLoading, setDonorLoading] = useState(true)
  const [donorError, setDonorError] = useState('')
  const [donorContributions, setDonorContributions] = useState([])

  useEffect(() => {
    const loadDonorContributions = async () => {
      setDonorLoading(true)
      setDonorError('')
      try {
        const list = await api.donations.byCampaign(campaignId)
        setDonorContributions(Array.isArray(list) ? list : [])
      } catch (err) {
        setDonorContributions([])
        setDonorError(err.message || 'Failed to load donor contributions')
      } finally {
        setDonorLoading(false)
      }
    }

    if (campaignId) {
      loadDonorContributions()
    }
  }, [campaignId])

  const statusLabel = (status) => {
    const labels = {
      PENDING: 'Pending Employee Review',
      APPROVED: 'Matched - Ready for Settlement',
      PAID: 'Settled - Paid to Hospital',
      REJECTED: 'Rejected',
    }
    return labels[status] || status
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await axiosInstance.post('/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setDocumentUrl(response.data.url)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'File upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!amount || !documentUrl) {
      setError('Amount and invoice URL are required.')
      setLoading(false)
      return
    }

    const amt = Number(amount)
    if (!Number.isFinite(amt) || amt <= 0) {
      setError('Amount must be a positive number.')
      setLoading(false)
      return
    }

    if (!documentUrl.startsWith('http')) {
      setError('Please enter a valid URL starting with http or https.')
      setLoading(false)
      return
    }

    try {
      await api.invoices.create(campaignId, amt, documentUrl.trim())
      setAmount('')
      setDocumentUrl('')
    } catch (err) {
      setError(err.message || 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    navigate('/login')
    return null
  }

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <h1>Upload Hospital Invoice</h1>
        <p className="auth-subtitle">
          When the bill is due, upload the hospital invoice. Platform will match
          against raised funds and payout to the hospital.
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>Invoice Amount (₹)</label>
          <input
            type="number"
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="5000"
            required
          />

          <label>Invoice Document (PDF, JPG, PNG, WEBP)</label>
          <div className="file-upload-area">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={handleFileUpload}
              disabled={uploading}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{ marginBottom: '0.5rem', width: '100%' }}
            >
              {uploading ? 'Uploading...' : 'Choose File'}
            </button>
            {documentUrl && (
              <p style={{ color: '#10b981', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                ✓ File uploaded successfully
              </p>
            )}
          </div>
          <p className="form-hint">
            Or paste invoice URL manually (optional):
          </p>
          <input
            type="url"
            value={documentUrl}
            onChange={(e) => setDocumentUrl(e.target.value)}
            placeholder="https://... (optional)"
          />

          {error && <p className="auth-error">{error}</p>}

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading ? 'Uploading...' : 'Submit Invoice'}
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-full"
            onClick={() => navigate(-1)}
            style={{ marginTop: '0.5rem' }}
          >
            Back
          </button>
        </form>

        <div style={{ marginTop: '1.5rem' }}>
          <h2 style={{ marginBottom: '0.5rem' }}>Donor Contributions</h2>
          <p className="form-hint" style={{ marginTop: 0 }}>
            Donor-wise contribution list with receipt and utilization status.
          </p>

          {donorLoading ? (
            <p className="form-hint">Loading donor contributions...</p>
          ) : donorError ? (
            <p className="auth-error">{donorError}</p>
          ) : donorContributions.length === 0 ? (
            <p className="form-hint">No donor contributions found for this campaign.</p>
          ) : (
            <div className="case-list">
              {donorContributions.map((d) => (
                <div key={d._id || d.id} className="case-item card" style={{ marginBottom: '0.75rem' }}>
                  <p><strong>Donor:</strong> {d.donorName || 'Anonymous Donor'}</p>
                  {d.donorEmailMasked ? <p><strong>Contact:</strong> {d.donorEmailMasked}</p> : null}
                  <p><strong>Amount:</strong> ₹{Number(d.amount || 0).toLocaleString()}</p>
                  <p>
                    <strong>Donated At:</strong>{' '}
                    {d.donatedAt ? new Date(d.donatedAt).toLocaleString() : 'N/A'}
                  </p>
                  <p>
                    <strong>Receipt Status:</strong>{' '}
                    {d.receipt
                      ? d.receipt.utilized
                        ? 'Utilized'
                        : 'Issued'
                      : 'Pending'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
