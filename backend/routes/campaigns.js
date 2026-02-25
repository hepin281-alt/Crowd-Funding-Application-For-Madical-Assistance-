import express from 'express'
import { Op } from 'sequelize'
import { Campaign, Hospital } from '../models/index.js'
import { protect } from '../middleware/auth.js'
import { sendHospitalHandshake } from '../services/notify.js'

const router = express.Router()

// GET /api/campaigns/my - My campaigns (user)
router.get('/my', protect, async (req, res) => {
  try {
    if (req.user.role !== 'user') {
      return res.status(403).json({ message: 'Only users can view their campaigns' })
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

// POST /api/campaigns - Create or save draft campaign (user)
router.post('/', protect, async (req, res) => {
  try {
    const {
      campaignTitle,
      patientName,
      patientRelationship,
      medicalCondition,
      treatingDoctorName,
      description,
      amountNeeded,
      hospitalId,
      customHospitalName,
      deadline,
      coverImageUrl,
      medicalBillUrl,
      patientIdentityProofUrl,
      bankAccountHolderName,
      bankAccountNumber,
      bankIfscCode,
      payoutMode,
      isDraft,
    } = req.body

    if (req.user.role !== 'user') {
      return res.status(403).json({ message: 'Only users can create campaigns' })
    }

    // For draft: allow partial data; for submission: require all fields
    if (!isDraft) {
      if (!campaignTitle || !patientName || !description || !amountNeeded || (!hospitalId && !customHospitalName)) {
        return res.status(400).json({
          message: 'campaignTitle, patientName, description, amountNeeded, and hospital (verified or custom) required to submit',
        })
      }
    }

    if (amountNeeded) {
      const amt = Number(amountNeeded)
      if (!Number.isFinite(amt) || amt <= 0) {
        return res.status(400).json({ message: 'amountNeeded must be a positive number' })
      }
    }

    const allowedPayoutModes = ['DIRECT_TO_HOSPITAL', 'PERSONAL_ACCOUNT']
    if (payoutMode && !allowedPayoutModes.includes(payoutMode)) {
      return res.status(400).json({ message: 'Invalid payoutMode' })
    }

    // Verify hospital if provided
    let hospitalVerified = true
    if (hospitalId) {
      const hospital = await Hospital.findByPk(hospitalId)
      if (!hospital || !hospital.is_verified) {
        if (!isDraft) {
          return res.status(400).json({ message: 'Invalid or unverified hospital' })
        }
        hospitalVerified = false
      }
    }

    const campaignData = {
      campaign_title: campaignTitle,
      patient_name: patientName,
      patient_relationship: patientRelationship,
      medical_condition: medicalCondition,
      treating_doctor_name: treatingDoctorName,
      description,
      target_amount: amountNeeded ? Number(amountNeeded) : null,
      hospital_id: hospitalId ? parseInt(hospitalId) : null,
      custom_hospital_name: customHospitalName || null,
      user_id: req.user.id,
      deadline: deadline ? new Date(deadline) : null,
      cover_image_url: coverImageUrl,
      medical_bill_url: medicalBillUrl,
      patient_identity_proof_url: patientIdentityProofUrl,
      bank_account_holder_name: bankAccountHolderName,
      bank_account_number: bankAccountNumber,
      bank_ifsc_code: bankIfscCode,
      payout_mode: payoutMode || 'DIRECT_TO_HOSPITAL',
      status: isDraft ? 'draft' : 'pending_hospital_verification',
    }

    const campaign = await Campaign.create(campaignData)

    // Send hospital handshake only if not a draft and hospital verified
    if (!isDraft && hospitalVerified && hospitalId) {
      const hospital = await Hospital.findByPk(hospitalId)
      await sendHospitalHandshake(hospital.admin_email, campaign.id.toString(), patientName)
      await campaign.update({ hospital_handshake_sent_at: new Date() })
    }

    const populated = await Campaign.findByPk(campaign.id, {
      include: [{ model: Hospital, as: 'Hospital', attributes: ['id', 'name', 'city'] }],
      raw: true,
      nest: true,
    })

    res.status(201).json({
      ...populated,
      _id: populated.id,
      hospital: populated.Hospital,
      campaignTitle: populated.campaign_title,
      patientName: populated.patient_name,
      patientRelationship: populated.patient_relationship,
      medicalCondition: populated.medical_condition,
      treatingDoctorName: populated.treating_doctor_name,
      amountNeeded: populated.target_amount ? parseFloat(populated.target_amount) : null,
      amountRaised: 0,
      deadline: populated.deadline,
      coverImageUrl: populated.cover_image_url,
      medicalBillUrl: populated.medical_bill_url,
      patientIdentityProofUrl: populated.patient_identity_proof_url,
      bankAccountHolderName: populated.bank_account_holder_name,
      bankAccountNumber: populated.bank_account_number,
      bankIfscCode: populated.bank_ifsc_code,
      payoutMode: populated.payout_mode,
      customHospitalName: populated.custom_hospital_name,
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
