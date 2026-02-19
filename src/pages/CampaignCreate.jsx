import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function CampaignCreate() {
  const { user, isCampaigner } = useAuth()
  const navigate = useNavigate()
  const [hospitals, setHospitals] = useState([])
  const [patientName, setPatientName] = useState('')
  const [description, setDescription] = useState('')
  const [amountNeeded, setAmountNeeded] = useState('')
  const [hospitalId, setHospitalId] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isCampaigner) return
    api.hospitals.list().then(setHospitals).catch(() => setHospitals([]))
  }, [isCampaigner])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!patientName || !description || !amountNeeded || !hospitalId) {
      setError('Please fill in all fields')
      setLoading(false)
      return
    }

    if (amountNeeded <= 0) {
      setError('Amount must be positive')
      setLoading(false)
      return
    }

    try {
      const campaign = await api.campaigns.create({
        patientName,
        description,
        amountNeeded: Number(amountNeeded),
        hospitalId,
      })
      navigate('/campaigner')
    } catch (err) {
      setError(err.message || 'Failed to create campaign')
    } finally {
      setLoading(false)
    }
  }

  if (!user || !isCampaigner) {
    navigate('/login')
    return null
  }

  return (
    <div className="auth-page">
      <div className="auth-card card create-campaign-card">
        <h1>Create Campaign</h1>
        <p className="auth-subtitle">
          Select a hospital from our verified database. They will verify your
          campaign.
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>Patient Name</label>
          <input
            type="text"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            placeholder="Patient name"
            required
          />

          <label>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Medical condition, treatment needed..."
            rows={4}
            required
          />

          <label>Amount Needed (₹)</label>
          <input
            type="number"
            min="1"
            value={amountNeeded}
            onChange={(e) => setAmountNeeded(e.target.value)}
            placeholder="50000"
            required
          />

          <label>Select Hospital (required)</label>
          <select
            value={hospitalId}
            onChange={(e) => setHospitalId(e.target.value)}
            required
          >
            <option value="">Choose hospital</option>
            {hospitals.map((h) => (
              <option key={h._id} value={h._id}>
                {h.name} - {h.city || h.address}
              </option>
            ))}
          </select>

          {error && <p className="auth-error">{error}</p>}

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Campaign'}
          </button>
        </form>
      </div>
    </div>
  )
}
