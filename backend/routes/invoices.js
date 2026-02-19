import express from 'express'
import { Op } from 'sequelize'
import {
  DisbursementRequest,
  Campaign,
  Hospital,
  Donation,
  Transaction,
  Receipt,
  User,
} from '../models/index.js'
import { protect, requireRole } from '../middleware/auth.js'
import { sendReceiptToDonor } from '../services/notify.js'

const router = express.Router()

const ESCROW_ACCOUNT = process.env.ESCROW_ACCOUNT || 'CAREFUND_ESCROW'

// GET /api/invoices/pending - Pending disbursement requests (platform employee)
router.get('/pending', protect, requireRole('employee'), async (req, res) => {
  try {
    const list = await DisbursementRequest.findAll({
      where: { status: 'PENDING' },
      include: [{ model: Campaign, as: 'Campaign', include: [{ model: Hospital, as: 'Hospital' }] }],
      order: [['created_at', 'ASC']],
      raw: true,
      nest: true,
    })
    res.json(
      list.map((r) => ({
        ...r,
        _id: r.id,
        campaign: r.Campaign
          ? {
              ...r.Campaign,
              _id: r.Campaign.id,
              patientName: r.Campaign.patient_name,
              amountNeeded: parseFloat(r.Campaign.target_amount),
              amountRaised: parseFloat(r.Campaign.raised_amount),
            }
          : null,
        amount: r.requested_amount,
        documentUrl: r.invoice_image_url,
      }))
    )
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/invoices/matched - Approved (ready for settlement)
router.get('/matched', protect, requireRole('employee'), async (req, res) => {
  try {
    const list = await DisbursementRequest.findAll({
      where: { status: 'APPROVED' },
      include: [{ model: Campaign, as: 'Campaign', include: [{ model: Hospital, as: 'Hospital' }] }],
      order: [['updated_at', 'ASC']],
      raw: true,
      nest: true,
    })
    res.json(
      list.map((r) => ({
        ...r,
        _id: r.id,
        campaign: r.Campaign
          ? {
              ...r.Campaign,
              _id: r.Campaign.id,
              patientName: r.Campaign.patient_name,
              amountNeeded: parseFloat(r.Campaign.target_amount),
              amountRaised: parseFloat(r.Campaign.raised_amount),
            }
          : null,
        amount: r.requested_amount,
        documentUrl: r.invoice_image_url,
      }))
    )
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/invoices - Create disbursement request (campaigner)
router.post('/', protect, requireRole('campaigner'), async (req, res) => {
  try {
    const { campaignId, amount, documentUrl } = req.body

    if (!campaignId || !amount || !documentUrl) {
      return res.status(400).json({ message: 'campaignId, amount, documentUrl required' })
    }

    const amt = Number(amount)
    if (!Number.isFinite(amt) || amt <= 0) {
      return res.status(400).json({ message: 'Amount must be a positive number' })
    }

    const campaign = await Campaign.findByPk(campaignId)
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' })
    if (campaign.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Not your campaign' })
    }
    if (campaign.status !== 'hospital_verified' && campaign.status !== 'active') {
      return res.status(400).json({ message: 'Campaign not ready for invoice' })
    }

    const raised = parseFloat(campaign.raised_amount || 0)
    if (amt > raised) {
      return res.status(400).json({ message: 'Invoice amount exceeds raised funds' })
    }

    const req_ = await DisbursementRequest.create({
      campaign_id: parseInt(campaignId),
      invoice_image_url: documentUrl.trim(),
      requested_amount: amt,
      status: 'PENDING',
    })
    res.status(201).json({
      id: req_.id,
      _id: req_.id,
      campaign_id: req_.campaign_id,
      amount: req_.requested_amount,
      documentUrl: req_.invoice_image_url,
      status: req_.status,
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/invoices/campaign/:campaignId
router.get('/campaign/:campaignId', protect, async (req, res) => {
  try {
    const campaign = await Campaign.findByPk(req.params.campaignId)
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' })
    const isCampaigner = campaign.user_id === req.user.id
    if (!isCampaigner && req.user.role !== 'employee') {
      return res.status(403).json({ message: 'Access denied' })
    }
    const list = await DisbursementRequest.findAll({
      where: { campaign_id: req.params.campaignId },
      order: [['created_at', 'DESC']],
      raw: true,
    })
    res.json(list.map((r) => ({ ...r, _id: r.id })))
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/invoices/:id/match - Approve (platform employee)
router.post('/:id/match', protect, requireRole('employee'), async (req, res) => {
  try {
    const req_ = await DisbursementRequest.findByPk(req.params.id)
    if (!req_) return res.status(404).json({ message: 'Invoice not found' })
    if (req_.status !== 'PENDING') {
      return res.status(400).json({ message: 'Invoice already processed' })
    }
    await req_.update({ status: 'APPROVED', admin_note: 'Matched by platform' })
    res.json({ ...req_.toJSON(), _id: req_.id })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/invoices/:id/settle - Trigger payout (platform employee)
router.post('/:id/settle', protect, requireRole('employee'), async (req, res) => {
  try {
    const disbursement = await DisbursementRequest.findByPk(req.params.id, {
      include: [{ model: Campaign, as: 'Campaign', include: [{ model: Hospital, as: 'Hospital' }] }],
    })
    if (!disbursement) return res.status(404).json({ message: 'Invoice not found' })
    if (disbursement.status !== 'APPROVED') {
      return res.status(400).json({ message: 'Invoice must be approved first' })
    }

    const campaign = disbursement.Campaign
    const hospital = campaign.Hospital

    // Create Transaction record
    const transactionRef = `UTR${Date.now()}${disbursement.id}`
    await Transaction.create({
      disbursement_request_id: disbursement.id,
      from_account: ESCROW_ACCOUNT,
      to_account: hospital.bank_account_number,
      amount: disbursement.requested_amount,
      transaction_reference: transactionRef,
    })

    await disbursement.update({ status: 'PAID' })

    // Create receipts for donors
    const donations = await Donation.findAll({
      where: { campaign_id: campaign.id },
      include: [{ model: User, as: 'User', attributes: ['id', 'email'] }],
    })
    for (const d of donations) {
      await Receipt.create({
        campaign_id: campaign.id,
        disbursement_request_id: disbursement.id,
        donation_id: d.id,
        donor_id: d.donor_id,
        amount: d.amount,
        utilization_proof: disbursement.invoice_image_url,
      })
      if (d.User?.email) {
        await sendReceiptToDonor(d.User.email, campaign.id, d.amount, disbursement.invoice_image_url)
      }
    }

    res.json({
      invoice: { ...disbursement.toJSON(), _id: disbursement.id },
      payoutRef: transactionRef,
      message: `Payout initiated to ${hospital.name}. Receipts generated for donors.`,
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
