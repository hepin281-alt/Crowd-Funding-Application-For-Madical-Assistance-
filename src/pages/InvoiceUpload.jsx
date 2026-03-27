import { useEffect, useState } from 'react'
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
  const [historyLoading, setHistoryLoading] = useState(true)
  const [historyError, setHistoryError] = useState('')
  const [invoiceHistory, setInvoiceHistory] = useState([])

  useEffect(() => {
    const loadHistory = async () => {
      setHistoryLoading(true)
      setHistoryError('')
      try {
        const list = await api.invoices.byCampaign(campaignId)
        setInvoiceHistory(Array.isArray(list) ? list : [])
      } catch (err) {
        setHistoryError(err.message || 'Failed to load invoice history')
      } finally {
        setHistoryLoading(false)
      }
    }

    if (campaignId) {
      loadHistory()
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
      const list = await api.invoices.byCampaign(campaignId)
      setInvoiceHistory(Array.isArray(list) ? list : [])
      setAmount('')
      setDocumentUrl('')
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

        <div style={{ marginTop: '1.5rem' }}>
          <h2 style={{ marginBottom: '0.5rem' }}>Verification & Settlement History</h2>
          <p className="form-hint" style={{ marginTop: 0 }}>
            Use this to track whether your invoice is pending, matched by employee, or settled to hospital.
          </p>

          {historyLoading ? (
            <p className="form-hint">Loading history...</p>
          ) : historyError ? (
            <p className="auth-error">{historyError}</p>
          ) : invoiceHistory.length === 0 ? (
            <p className="form-hint">No invoices submitted yet for this campaign.</p>
          ) : (
            <div className="case-list">
              {invoiceHistory.map((inv) => (
                <div key={inv._id || inv.id} className="case-item card" style={{ marginBottom: '0.75rem' }}>
                  <p><strong>Amount:</strong> Rs {Number(inv.amount || inv.requested_amount || 0).toLocaleString()}</p>
                  <p><strong>Status:</strong> {statusLabel(inv.status)}</p>
                  <p>
                    <strong>Invoice:</strong>{' '}
                    <a href={inv.documentUrl || inv.invoice_image_url} target="_blank" rel="noreferrer">
                      Open document
                    </a>
                  </p>
                  {inv.admin_note && <p><strong>Admin Note:</strong> {inv.admin_note}</p>}
                  {inv.payoutRef ? <p><strong>Payout Ref:</strong> {inv.payoutRef}</p> : null}
                  {inv.settledAt ? (
                    <p><strong>Settled At:</strong> {new Date(inv.settledAt).toLocaleString()}</p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
