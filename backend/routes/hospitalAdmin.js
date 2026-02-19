import express from 'express'
import { Campaign, User } from '../models/index.js'
import { protect, requireRole } from '../middleware/auth.js'

const router = express.Router()

router.use(protect)
router.use(requireRole(['hospital_admin']))

// GET /api/hospital-admin/pending
router.get('/pending', async (req, res) => {
  try {
    const hospitalId = req.user.hospital_id
    if (!hospitalId) {
      return res.status(400).json({ message: 'Hospital admin must be linked to a hospital' })
    }
    const campaigns = await Campaign.findAll({
      where: { hospital_id: hospitalId, status: 'pending_hospital_verification' },
      include: [{ model: User, as: 'User', attributes: ['id', 'name', 'email'] }],
      order: [['created_at', 'ASC']],
      raw: true,
      nest: true,
    })
    res.json(
      campaigns.map((c) => ({
        ...c,
        _id: c.id,
        patientName: c.patient_name,
        amountNeeded: parseFloat(c.target_amount),
        campaigner: c.User
          ? { _id: c.User.id, name: c.User.name, email: c.User.email }
          : null,
      }))
    )
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/hospital-admin/verify/:campaignId
router.post('/verify/:campaignId', async (req, res) => {
  try {
    const { ipdNumber } = req.body
    const campaign = await Campaign.findByPk(req.params.campaignId)

    if (!campaign) return res.status(404).json({ message: 'Campaign not found' })
    if (campaign.hospital_id !== req.user.hospital_id) {
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
    })

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

// POST /api/hospital-admin/reject/:campaignId
router.post('/reject/:campaignId', async (req, res) => {
  try {
    const { reason } = req.body
    const campaign = await Campaign.findByPk(req.params.campaignId)

    if (!campaign) return res.status(404).json({ message: 'Campaign not found' })
    if (campaign.hospital_id !== req.user.hospital_id) {
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

    res.json(campaign)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
