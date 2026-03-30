import express from 'express'
import { db, Donation, Campaign, User, Receipt } from '../models/index.js'
import { protect, requireRole } from '../middleware/auth.js'
import { sendDonationReceipt } from '../services/notify.js'
import { createDonationWithLock } from '../services/donationService.js'

const router = express.Router()
const SKIP_CAMPAIGN_VERIFICATION = process.env.SKIP_CAMPAIGN_VERIFICATION === 'true'

function maskEmail(email) {
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return null
  }
  const [local, domain] = email.split('@')
  if (!local) return `***@${domain}`
  if (local.length === 1) return `${local}***@${domain}`
  return `${local.slice(0, 2)}***@${domain}`
}

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

// GET /api/donations/campaign/:campaignId - Donor-wise list for campaign owner
router.get('/campaign/:campaignId', protect, requireRole(['user', 'campaigner']), async (req, res) => {
  try {
    const campaign = await Campaign.findByPk(req.params.campaignId)
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' })

    if (Number(campaign.user_id) !== Number(req.user.id)) {
      return res.status(403).json({ message: 'Not your campaign' })
    }

    const donations = await Donation.findAll({
      where: { campaign_id: campaign.id },
      include: [{ model: User, as: 'User', attributes: ['id', 'name', 'email'] }],
      order: [['created_at', 'DESC']],
      raw: true,
      nest: true,
    })

    const donationIds = donations.map((d) => d.id)
    let receiptByDonationId = new Map()
    if (donationIds.length > 0) {
      const receipts = await Receipt.findAll({
        where: { campaign_id: campaign.id, donation_id: donationIds },
        attributes: ['id', 'donation_id', 'disbursement_request_id', 'created_at'],
        order: [['created_at', 'DESC']],
        raw: true,
      })

      receiptByDonationId = new Map(
        receipts.map((r) => [String(r.donation_id), r])
      )
    }

    res.json(
      donations.map((d) => {
        const receipt = receiptByDonationId.get(String(d.id))
        return {
          ...d,
          _id: d.id,
          donorId: d.donor_id,
          donorName: d.User?.name || 'Anonymous Donor',
          donorEmailMasked: maskEmail(d.User?.email),
          amount: parseFloat(d.amount || 0),
          donatedAt: d.created_at,
          receipt: receipt
            ? {
              _id: receipt.id,
              issuedAt: receipt.created_at,
              utilized: Boolean(receipt.disbursement_request_id),
            }
            : null,
        }
      })
    )
  } catch (err) {
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
