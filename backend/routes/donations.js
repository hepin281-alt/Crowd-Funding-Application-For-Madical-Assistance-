import express from 'express'
import { db, Donation, Campaign, User, Receipt } from '../models/index.js'
import { protect, requireRole } from '../middleware/auth.js'
import { sendDonationReceipt } from '../services/notify.js'
import { createDonationWithLock } from '../services/donationService.js'

const router = express.Router()
const SKIP_CAMPAIGN_VERIFICATION = process.env.SKIP_CAMPAIGN_VERIFICATION === 'true'

// POST /api/donations
router.post('/', protect, requireRole('user'), async (req, res) => {
  try {
    const { campaignId, amount } = req.body
    const requestedAmount = Number(amount)

    if (!campaignId || !Number.isFinite(requestedAmount) || requestedAmount <= 0) {
      return res.status(400).json({ message: 'Valid campaignId and amount are required' })
    }

    const { donation, campaignName } = await createDonationWithLock(
      { db, Campaign, Donation, Receipt },
      {
        campaignId,
        requestedAmount,
        user: req.user,
        skipCampaignVerification: SKIP_CAMPAIGN_VERIFICATION,
      }
    )

    // Send donation receipt email
    await sendDonationReceipt(
      req.user.email,
      campaignName,
      requestedAmount,
      campaignId
    )

    const d = await Donation.findByPk(donation.id, {
      include: [{ model: Campaign, as: 'Campaign', attributes: ['patient_name', 'target_amount', 'raised_amount'] }],
      raw: true,
      nest: true,
    })
    res.status(201).json({
      ...d,
      _id: d.id,
      campaign: d.Campaign
        ? {
          patientName: d.Campaign.patient_name,
          amountNeeded: parseFloat(d.Campaign.target_amount),
          amountRaised: parseFloat(d.Campaign.raised_amount),
        }
        : null,
    })
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message })
    }
    res.status(500).json({ message: err.message })
  }
})

// GET /api/donations/my
router.get('/my', protect, requireRole('user'), async (req, res) => {
  try {
    const donations = await Donation.findAll({
      where: { donor_id: req.user.id },
      include: [{ model: Campaign, as: 'Campaign', attributes: ['patient_name', 'target_amount', 'raised_amount'] }],
      order: [['created_at', 'DESC']],
      raw: true,
      nest: true,
    })
    res.json(
      donations.map((d) => ({
        ...d,
        _id: d.id,
        campaign: d.Campaign
          ? {
            patientName: d.Campaign.patient_name,
            amountNeeded: parseFloat(d.Campaign.target_amount),
            amountRaised: parseFloat(d.Campaign.raised_amount),
          }
          : null,
      }))
    )
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
