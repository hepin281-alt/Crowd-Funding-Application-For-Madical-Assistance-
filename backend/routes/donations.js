import express from 'express'
import { Donation, Campaign, User } from '../models/index.js'
import { protect, requireRole } from '../middleware/auth.js'
import { sendDonationReceipt } from '../services/notify.js'

const router = express.Router()

// POST /api/donations
router.post('/', protect, requireRole('donor'), async (req, res) => {
  try {
    const { campaignId, amount } = req.body

    if (!campaignId || !amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid campaignId and amount are required' })
    }

    const campaign = await Campaign.findByPk(campaignId)
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' })
    if (campaign.status !== 'hospital_verified' && campaign.status !== 'active') {
      return res.status(400).json({ message: 'Campaign is not open for donations' })
    }

    const donation = await Donation.create({
      campaign_id: parseInt(campaignId),
      donor_id: req.user.id,
      amount,
    })

    const newRaised = parseFloat(campaign.raised_amount || 0) + parseFloat(amount)
    await campaign.update({
      raised_amount: newRaised,
      status: 'active',
    })

    // Send donation receipt email
    await sendDonationReceipt(
      req.user.email,
      campaign.patient_name,
      parseFloat(amount),
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
    res.status(500).json({ message: err.message })
  }
})

// GET /api/donations/my
router.get('/my', protect, requireRole('donor'), async (req, res) => {
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
