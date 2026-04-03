import express from 'express'
import { Op } from 'sequelize'
import { Campaign, Hospital, User } from '../models/index.js'
import { protect } from '../middleware/auth.js'
import { sendHospitalHandshake } from '../services/notify.js'

const router = express.Router()

async function resolveHospitalAdminEmail(hospital) {
  if (hospital?.admin_email) {
    return hospital.admin_email
  }

  const hospitalAdmin = await User.findOne({
    where: { hospital_id: hospital?.id, role: 'hospital_admin' },
    attributes: ['email'],
    order: [['created_at', 'ASC']],
  })

  return hospitalAdmin?.email || null
}

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
        hospitalAdminNote: c.hospital_admin_note,
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
      include: [
        { model: Hospital, as: 'Hospital', attributes: ['id', 'name', 'address', 'city'] },
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
      ],
      raw: true,
      nest: true,
    })
    if (!c) return res.status(404).json({ message: 'Campaign not found' })
    res.json({
      ...c,
      _id: c.id,
      hospital: c.Hospital,
      campaigner: c.user ? { _id: c.user.id, name: c.user.name, email: c.user.email } : null,
      patientName: c.patient_name,
      amountNeeded: parseFloat(c.target_amount),
      amountRaised: parseFloat(c.raised_amount || 0),
      ipdNumber: c.patient_ipd_number,
      medicalBillUrl: c.medical_bill_url,
      patientIdentityProofUrl: c.patient_identity_proof_url,
      treatingDoctorName: c.treating_doctor_name,
      medicalCondition: c.medical_condition,
      hospitalAdminNote: c.hospital_admin_note,
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
      if (!medicalBillUrl || !patientIdentityProofUrl) {
        return res.status(400).json({ message: 'Medical bill and identity proof are required to submit' })
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
      const adminEmail = await resolveHospitalAdminEmail(hospital)

      if (!adminEmail) {
        throw new Error(`No hospital admin email found for hospital ${hospital.id}`)
      }

      await sendHospitalHandshake(adminEmail, campaign.id.toString(), patientName)
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
      hospitalAdminNote: populated.hospital_admin_note,
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

// PATCH /api/campaigns/:id/documents - Update verification documents after needs-info
router.patch('/:id/documents', protect, async (req, res) => {
  try {
    if (req.user.role !== 'user') {
      return res.status(403).json({ message: 'Only users can update documents' })
    }

    const { medicalBillUrl, patientIdentityProofUrl } = req.body
    if (!medicalBillUrl || !patientIdentityProofUrl) {
      return res.status(400).json({ message: 'Medical bill and identity proof are required' })
    }

    const campaign = await Campaign.findByPk(req.params.id)
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' })
    if (campaign.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Not your campaign' })
    }
    if (campaign.status !== 'needs_info') {
      return res.status(400).json({ message: 'Campaign is not awaiting updated documents' })
    }

    await campaign.update({
      medical_bill_url: medicalBillUrl,
      patient_identity_proof_url: patientIdentityProofUrl,
      status: 'pending_hospital_verification',
      hospital_admin_note: null,
    })

    if (campaign.hospital_id) {
      const hospital = await Hospital.findByPk(campaign.hospital_id)
      if (hospital && hospital.is_verified) {
        const adminEmail = await resolveHospitalAdminEmail(hospital)

        if (adminEmail) {
          await sendHospitalHandshake(adminEmail, campaign.id.toString(), campaign.patient_name)
        }
        await campaign.update({ hospital_handshake_sent_at: new Date() })
      }
    }

    const updated = await Campaign.findByPk(campaign.id, {
      include: [{ model: Hospital, as: 'Hospital', attributes: ['id', 'name', 'city'] }],
      raw: true,
      nest: true,
    })

    res.json({
      ...updated,
      _id: updated.id,
      hospital: updated.Hospital,
      patientName: updated.patient_name,
      amountNeeded: parseFloat(updated.target_amount),
      amountRaised: parseFloat(updated.raised_amount || 0),
      medicalBillUrl: updated.medical_bill_url,
      patientIdentityProofUrl: updated.patient_identity_proof_url,
      hospitalAdminNote: updated.hospital_admin_note,
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
