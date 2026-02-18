import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import CampaignCard from '../components/CampaignCard'

export default function Campaigns() {
  const { isDonor } = useAuth()
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.campaigns
      .list()
      .then(setCampaigns)
      .catch(() => setCampaigns([]))
      .finally(() => setLoading(false))
  }, [])

  const refreshCampaigns = () => {
    api.campaigns.list().then(setCampaigns).catch(() => {})
  }

  return (
    <div className="cases-page campaigns-page">
      <div className="container">
        <h1>Medical Campaigns</h1>
        <p className="page-desc">
          Hospital-verified campaigns. Donations go to escrow and are paid directly to hospitals.
        </p>

        {loading ? (
          <p className="loading-text">Loading...</p>
        ) : campaigns.length === 0 ? (
          <div className="empty-state card">
            <p>No verified campaigns at the moment.</p>
          </div>
        ) : (
          <div className="cases-grid">
            {campaigns.map((c) => (
              <CampaignCard
                key={c._id}
                campaign={c}
                canDonate={isDonor}
                onDonated={refreshCampaigns}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
