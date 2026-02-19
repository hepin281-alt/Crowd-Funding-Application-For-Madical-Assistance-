import express from 'express'
import { Op } from 'sequelize'
import { Campaign, Hospital } from '../models/index.js'
import { protect } from '../middleware/auth.js'
import { sendHospitalHandshake } from '../services/notify.js'

const router = express.Router()

// GET /api/campaigns/my - My campaigns (campaigner)
router.get('/my', protect, async (req, res) => {
  try {
    if (req.user.role !== 'campaigner') {
      return res.status(403).json({ message: 'Only campaigners can view their campaigns' })
    }
    const campaigns = await Campaign.findAll({
      where: { user_id: req.user.id },
      include: [{ model: Hospital, as: 'Hospital', attributes: ['id', 'name', 'city'] }],
      order: [['created_at', 'DESC']],
      raw: true,
      nest: true,
    })
    res.json(
      campaigns.map((c) => ({
        ...c,
        _id: c.id,
        hospital: c.Hospital ? { _id: c.Hospital.id, name: c.Hospital.name, city: c.Hospital.city } : null,
        patientName: c.patient_name,
        amountNeeded: parseFloat(c.target_amount),
        amountRaised: parseFloat(c.raised_amount || 0),
      }))
    )
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/campaigns - List active/hospital-verified campaigns (public)
router.get('/', async (req, res) => {
  try {
    const campaigns = await Campaign.findAll({
      where: { status: { [Op.in]: ['hospital_verified', 'active'] } },
      include: [{ model: Hospital, as: 'Hospital', attributes: ['id', 'name', 'city'] }],
      order: [['created_at', 'DESC']],
      raw: true,
      nest: true,
    })
    res.json(
      campaigns.map((c) => ({
        ...c,
        _id: c.id,
        hospital: c.Hospital ? { _id: c.Hospital.id, name: c.Hospital.name, city: c.Hospital.city } : null,
        patientName: c.patient_name,
        amountNeeded: parseFloat(c.target_amount),
        amountRaised: parseFloat(c.raised_amount || 0),
      }))
    )
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/campaigns/:id
router.get('/:id', async (req, res) => {
  try {
    const c = await Campaign.findByPk(req.params.id, {
      include: [{ model: Hospital, as: 'Hospital', attributes: ['id', 'name', 'address', 'city'] }],
      raw: true,
      nest: true,
    })
    if (!c) return res.status(404).json({ message: 'Campaign not found' })
    res.json({
      ...c,
      _id: c.id,
      hospital: c.Hospital,
      patientName: c.patient_name,
      amountNeeded: parseFloat(c.target_amount),
      amountRaised: parseFloat(c.raised_amount || 0),
      ipdNumber: c.patient_ipd_number,
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/campaigns - Create campaign (campaigner)
router.post('/', protect, async (req, res) => {
  try {
    const { patientName, description, amountNeeded, hospitalId, documents } = req.body

    if (req.user.role !== 'campaigner') {
      return res.status(403).json({ message: 'Only campaigners can create campaigns' })
    }

    if (!patientName || !description || !amountNeeded || !hospitalId) {
      return res.status(400).json({
        message: 'patientName, description, amountNeeded, hospitalId required',
      })
    }

    const hospital = await Hospital.findByPk(hospitalId)
    if (!hospital || !hospital.is_verified) {
      return res.status(400).json({ message: 'Invalid or unverified hospital' })
    }

    const campaign = await Campaign.create({
      patient_name: patientName,
      description,
      target_amount: Number(amountNeeded),
      hospital_id: parseInt(hospitalId),
      user_id: req.user.id,
      status: 'pending_hospital_verification',
      payout_mode: 'DIRECT_TO_HOSPITAL',
    })

    await sendHospitalHandshake(hospital.admin_email, campaign.id.toString(), patientName)
    await campaign.update({ hospital_handshake_sent_at: new Date() })

    const populated = await Campaign.findByPk(campaign.id, {
      include: [{ model: Hospital, as: 'Hospital', attributes: ['id', 'name', 'city'] }],
      raw: true,
      nest: true,
    })
    res.status(201).json({
      ...populated,
      _id: populated.id,
      hospital: populated.Hospital,
      patientName: populated.patient_name,
      amountNeeded: parseFloat(populated.target_amount),
      amountRaised: 0,
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
