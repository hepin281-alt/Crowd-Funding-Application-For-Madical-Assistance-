import express from 'express'
import { Op } from 'sequelize'
import { Campaign, User, Hospital, DisbursementRequest, Transaction } from '../models/index.js'
import { protect, requireRole } from '../middleware/auth.js'
import { sendCampaignVerified, sendCampaignRejected, sendCampaignNeedsInfo } from '../services/notify.js'

const router = express.Router()

router.use(protect)
router.use(requireRole(['hospital_admin']))

async function resolveHospitalForAdmin(user) {
  if (user.hospital_id) {
    const byId = await Hospital.findByPk(user.hospital_id)
    if (byId) return byId
  }

  if (user.license_number) {
    const byLicense = await Hospital.findOne({ where: { license_number: user.license_number } })
    if (byLicense) return byLicense
  }

  if (user.hospital_name) {
    return Hospital.findOne({ where: { name: user.hospital_name } })
  }

  return null
}

function mapCampaign(c) {
  return {
    ...c,
    _id: c.id,
    patientName: c.patient_name,
    medicalCondition: c.medical_condition,
    treatingDoctorName: c.treating_doctor_name,
    medicalBillUrl: c.medical_bill_url,
    patientIdentityProofUrl: c.patient_identity_proof_url,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
    amountNeeded: parseFloat(c.target_amount || 0),
    amountRaised: parseFloat(c.raised_amount || 0),
    campaignTitle: c.campaign_title,
    campaigner: c.user
      ? { _id: c.user.id, name: c.user.name, email: c.user.email }
      : null,
  }
}

// GET /api/hospital-admin/overview
router.get('/overview', async (req, res) => {
  try {
    const hospital = await resolveHospitalForAdmin(req.user)
    if (!hospital) {
      return res.status(400).json({ message: 'Hospital admin must be linked to a valid hospital' })
    }

    const allCampaigns = await Campaign.findAll({
      where: { hospital_id: hospital.id },
      attributes: ['id', 'status', 'target_amount', 'raised_amount', 'updated_at', 'hospital_admin_note'],
      raw: true,
    })

    const totalVerified = allCampaigns.filter((c) => ['hospital_verified', 'active', 'completed'].includes(c.status)).length
    const activePatients = allCampaigns.filter((c) => ['hospital_verified', 'active'].includes(c.status)).length
    const pendingRequests = allCampaigns.filter((c) => c.status === 'pending_hospital_verification').length
    const totalFundsRaised = allCampaigns.reduce((sum, c) => sum + (parseFloat(c.raised_amount || 0) || 0), 0)

    const pendingPayoutRows = await DisbursementRequest.findAll({
      where: { status: { [Op.in]: ['PENDING', 'APPROVED'] } },
      include: [{ model: Campaign, as: 'Campaign', attributes: ['id', 'hospital_id'], where: { hospital_id: hospital.id } }],
      attributes: ['requested_amount', 'status'],
      raw: true,
      nest: true,
    })
    const pendingPayouts = pendingPayoutRows.reduce((sum, r) => sum + (parseFloat(r.requested_amount || 0) || 0), 0)

    const approvedPayoutCount = pendingPayoutRows.filter((r) => r.status === 'APPROVED').length

    const notifications = []
    if (pendingRequests > 0) {
      notifications.push({ type: 'verification', message: `${pendingRequests} campaign(s) need medical verification.` })
    }
    if (approvedPayoutCount > 0) {
      notifications.push({ type: 'payout', message: `${approvedPayoutCount} payout(s) are ready for reconciliation.` })
    }

    res.json({
      hospital: {
        id: hospital.id,
        name: hospital.name,
        city: hospital.city,
        licenseNumber: hospital.license_number,
        verified: !!hospital.is_verified,
      },
      metrics: {
        totalVerified,
        totalFundsRaised,
        activePatients,
        pendingPayouts,
        pendingRequests,
      },
      notifications,
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/hospital-admin/campaigns
router.get('/campaigns', async (req, res) => {
  try {
    const hospital = await resolveHospitalForAdmin(req.user)
    if (!hospital) {
      return res.status(400).json({ message: 'Hospital admin must be linked to a valid hospital' })
    }

    const { tab = 'pending', search = '', status = 'all' } = req.query
    const where = { hospital_id: hospital.id }

    if (status !== 'all') {
      where.status = status
    } else if (tab === 'pending') {
      where.status = 'pending_hospital_verification'
    } else if (tab === 'active') {
      where.status = { [Op.in]: ['hospital_verified', 'active'] }
    } else if (tab === 'history') {
      where.status = { [Op.in]: ['completed', 'rejected', 'needs_info'] }
    }

    if (search?.trim()) {
      const q = `%${search.trim()}%`
      where[Op.or] = [
        { patient_name: { [Op.iLike]: q } },
        { treating_doctor_name: { [Op.iLike]: q } },
        { campaign_title: { [Op.iLike]: q } },
      ]
    }

    const campaigns = await Campaign.findAll({
      where,
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
      order: [['updated_at', 'DESC']],
      raw: true,
      nest: true,
    })

    res.json(campaigns.map(mapCampaign))
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/hospital-admin/financials
router.get('/financials', async (req, res) => {
  try {
    const hospital = await resolveHospitalForAdmin(req.user)
    if (!hospital) {
      return res.status(400).json({ message: 'Hospital admin must be linked to a valid hospital' })
    }

    const pendingPayouts = await DisbursementRequest.findAll({
      where: { status: { [Op.in]: ['PENDING', 'APPROVED'] } },
      include: [{ model: Campaign, as: 'Campaign', attributes: ['id', 'patient_name', 'hospital_id'], where: { hospital_id: hospital.id } }],
      order: [['created_at', 'DESC']],
      raw: true,
      nest: true,
    })

    const payoutRecords = await Transaction.findAll({
      include: [
        {
          model: DisbursementRequest,
          include: [{ model: Campaign, as: 'Campaign', attributes: ['id', 'patient_name', 'hospital_id'], where: { hospital_id: hospital.id } }],
        },
      ],
      order: [['created_at', 'DESC']],
      raw: true,
      nest: true,
    })

    const utilizationProofs = await DisbursementRequest.findAll({
      where: { status: 'PAID' },
      include: [{ model: Campaign, as: 'Campaign', attributes: ['id', 'patient_name', 'hospital_id'], where: { hospital_id: hospital.id } }],
      order: [['updated_at', 'DESC']],
      raw: true,
      nest: true,
    })

    res.json({
      totals: {
        pendingPayoutAmount: pendingPayouts.reduce((sum, p) => sum + (parseFloat(p.requested_amount || 0) || 0), 0),
        paidOutAmount: payoutRecords.reduce((sum, t) => sum + (parseFloat(t.amount || 0) || 0), 0),
      },
      pendingPayouts: pendingPayouts.map((p) => ({
        _id: p.id,
        campaignId: p.Campaign?.id,
        patientName: p.Campaign?.patient_name,
        amount: parseFloat(p.requested_amount || 0),
        status: p.status,
        createdAt: p.created_at,
      })),
      payoutRecords: payoutRecords.map((t) => ({
        _id: t.id,
        campaignId: t.DisbursementRequest?.Campaign?.id,
        patientName: t.DisbursementRequest?.Campaign?.patient_name,
        amount: parseFloat(t.amount || 0),
        transactionReference: t.transaction_reference,
        createdAt: t.created_at,
      })),
      utilizationProofs: utilizationProofs.map((u) => ({
        _id: u.id,
        campaignId: u.Campaign?.id,
        patientName: u.Campaign?.patient_name,
        documentUrl: u.invoice_image_url,
        updatedAt: u.updated_at,
      })),
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/hospital-admin/pending
router.get('/pending', async (req, res) => {
  try {
    const hospital = await resolveHospitalForAdmin(req.user)
    if (!hospital) {
      return res.status(400).json({ message: 'Hospital admin must be linked to a valid hospital' })
    }
    const campaigns = await Campaign.findAll({
      where: { hospital_id: hospital.id, status: 'pending_hospital_verification' },
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
      order: [['created_at', 'ASC']],
      raw: true,
      nest: true,
    })
    res.json(campaigns.map(mapCampaign))
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/hospital-admin/verify/:campaignId
router.post('/verify/:campaignId', async (req, res) => {
  try {
    const { ipdNumber } = req.body
    const hospital = await resolveHospitalForAdmin(req.user)
    if (!hospital) {
      return res.status(400).json({ message: 'Hospital admin must be linked to a valid hospital' })
    }

    const campaign = await Campaign.findByPk(req.params.campaignId, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
        { model: Hospital, as: 'Hospital', attributes: ['id', 'name'] }
      ]
    })

    if (!campaign) return res.status(404).json({ message: 'Campaign not found' })
    if (campaign.hospital_id !== hospital.id) {
      return res.status(403).json({ message: 'Not your hospital' })
    }
    if (campaign.status !== 'pending_hospital_verification') {
      return res.status(400).json({ message: 'Campaign already processed' })
    }

    if (!ipdNumber || !ipdNumber.trim()) {
      return res.status(400).json({ message: 'Patient Registration Number (IPD No) is required' })
    }

    await campaign.update({
      patient_ipd_number: ipdNumber.trim(),
      status: 'hospital_verified',
      verified_by_hospital_at: new Date(),
      verified_by_hospital_admin_id: req.user.id,
      payout_mode: 'DIRECT_TO_HOSPITAL',
      hospital_admin_note: null,
    })

    // Send notification to campaigner
    if (campaign.user && campaign.Hospital) {
      await sendCampaignVerified(
        campaign.user.email,
        campaign.patient_name,
        campaign.Hospital.name
      )
    }

    const c = await Campaign.findByPk(campaign.id, { raw: true })
    res.json({
      ...c,
      _id: c.id,
      patientName: c.patient_name,
      amountNeeded: parseFloat(c.target_amount),
      amountRaised: parseFloat(c.raised_amount || 0),
      ipdNumber: c.patient_ipd_number,
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/hospital-admin/request-info/:campaignId
router.post('/request-info/:campaignId', async (req, res) => {
  try {
    const { note } = req.body
    const hospital = await resolveHospitalForAdmin(req.user)
    if (!hospital) {
      return res.status(400).json({ message: 'Hospital admin must be linked to a valid hospital' })
    }

    const campaign = await Campaign.findByPk(req.params.campaignId, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
        { model: Hospital, as: 'Hospital', attributes: ['id', 'name'] }
      ]
    })

    if (!campaign) return res.status(404).json({ message: 'Campaign not found' })
    if (campaign.hospital_id !== hospital.id) {
      return res.status(403).json({ message: 'Not your hospital' })
    }
    if (campaign.status !== 'pending_hospital_verification') {
      return res.status(400).json({ message: 'Campaign already processed' })
    }

    if (!note || !note.trim()) {
      return res.status(400).json({ message: 'A note is required' })
    }

    await campaign.update({
      status: 'needs_info',
      hospital_admin_note: note.trim(),
      verified_by_hospital_admin_id: req.user.id,
    })

    if (campaign.user && campaign.Hospital) {
      await sendCampaignNeedsInfo(
        campaign.user.email,
        campaign.patient_name,
        campaign.Hospital.name,
        note.trim()
      )
    }

    res.json(campaign)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/hospital-admin/reject/:campaignId
router.post('/reject/:campaignId', async (req, res) => {
  try {
    const { reason } = req.body
    const hospital = await resolveHospitalForAdmin(req.user)
    if (!hospital) {
      return res.status(400).json({ message: 'Hospital admin must be linked to a valid hospital' })
    }

    const campaign = await Campaign.findByPk(req.params.campaignId, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
        { model: Hospital, as: 'Hospital', attributes: ['id', 'name'] }
      ]
    })

    if (!campaign) return res.status(404).json({ message: 'Campaign not found' })
    if (campaign.hospital_id !== hospital.id) {
      return res.status(403).json({ message: 'Not your hospital' })
    }
    if (campaign.status !== 'pending_hospital_verification') {
      return res.status(400).json({ message: 'Campaign already processed' })
    }

    await campaign.update({
      status: 'rejected',
      rejection_reason: reason || 'Rejected by hospital',
      verified_by_hospital_admin_id: req.user.id,
    })

    // Send notification to campaigner
    if (campaign.user && campaign.Hospital) {
      await sendCampaignRejected(
        campaign.user.email,
        campaign.patient_name,
        campaign.Hospital.name,
        reason
      )
    }

    res.json(campaign)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
