import { useEffect, useState } from 'react'
import { api } from '../api/client'
import CampaignCard from '../components/CampaignCard'

export default function DonorCampaigns() {
    const [campaigns, setCampaigns] = useState([])
    const [loading, setLoading] = useState(true)

    const loadCampaigns = () => {
        api.campaigns
            .list()
            .then((list) => {
                const running = (Array.isArray(list) ? list : []).filter((c) => {
                    const isRunningStatus = c.status === 'hospital_verified' || c.status === 'active'
                    const raised = Number(c.amountRaised) || 0
                    const needed = Number(c.amountNeeded) || 0
                    const isStillOpen = needed <= 0 || raised < needed
                    return isRunningStatus && isStillOpen
                })
                setCampaigns(running)
            })
            .catch(() => setCampaigns([]))
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        loadCampaigns()
    }, [])

    return (
        <div className="cases-page campaigns-page">
            <div className="container">
                <h1>Running Campaigns</h1>
                <p className="page-desc">
                    Browse currently running, hospital-verified campaigns and donate safely via escrow.
                </p>

                {loading ? (
                    <p className="loading-text">Loading...</p>
                ) : campaigns.length === 0 ? (
                    <div className="empty-state card">
                        <p>No running campaigns at the moment.</p>
                    </div>
                ) : (
                    <div className="cases-grid">
                        {campaigns.map((c) => (
                            <CampaignCard key={c._id} campaign={c} onDonated={loadCampaigns} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
