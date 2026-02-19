import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function InvoiceUpload() {
  const { campaignId } = useParams()
  const { isCampaigner } = useAuth()
  const navigate = useNavigate()
  const [amount, setAmount] = useState('')
  const [documentUrl, setDocumentUrl] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
      navigate('/campaigner')
    } catch (err) {
      setError(err.message || 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  if (!isCampaigner) {
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

          <label>Invoice Document URL</label>
          <input
            type="url"
            value={documentUrl}
            onChange={(e) => setDocumentUrl(e.target.value)}
            placeholder="https://... or paste link to invoice"
            required
          />
          <p className="form-hint">
            Upload your invoice to a file host (Google Drive, Dropbox, etc.) and
            paste the shareable link here.
          </p>

          {error && <p className="auth-error">{error}</p>}

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading ? 'Uploading...' : 'Submit Invoice'}
          </button>
        </form>
      </div>
    </div>
  )
}
