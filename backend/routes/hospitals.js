import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import { Op } from 'sequelize'
import { Hospital } from '../models/index.js'
import { protect, requireRole } from '../middleware/auth.js'
import { sendHospitalApplicationSubmitted } from '../services/notify.js'

const router = express.Router()

function getNextStepByStatus(status) {
  if (status === 'APPROVED') {
    return 'Your application is approved. Super Admin will contact you for admin account activation.'
  }
  if (status === 'REJECTED') {
    return 'Your application was rejected. Please review the remarks and submit a corrected application.'
  }
  return 'Your application is under review. Super Admin will verify your legal and banking details.'
}

const uploadDir = path.join(process.cwd(), 'uploads')
fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir)
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${Date.now()}-${crypto.randomUUID()}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
    if (!allowed.has(file.mimetype)) {
      return cb(new Error('Only JPG, PNG, WEBP images or PDF files are allowed'))
    }
    return cb(null, true)
  },
})

// GET /api/hospitals - List verified hospitals (public)
router.get('/', async (req, res) => {
  try {
    const hospitals = await Hospital.findAll({
      where: {
        is_verified: true,
        [Op.or]: [{ status: 'APPROVED' }, { status: null }],
      },
      attributes: ['id', 'name', 'address', 'city', 'admin_email', 'contact_phone'],
      raw: true,
    })
    res.json(hospitals.map((h) => ({ ...h, _id: h.id })))
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/hospitals/apply - Public hospital onboarding application
router.post('/apply', upload.single('document'), async (req, res) => {
  try {
    const {
      name,
      licenseNumber,
      adminEmail,
      address,
      city,
      bankName,
      bankAccountNumber,
      iban,
      swift,
      bankAccountName,
    } = req.body

    if (!name || !licenseNumber || !adminEmail || !address || !city || !bankName || !bankAccountName || !bankAccountNumber) {
      return res.status(400).json({ message: 'Please provide all required hospital details' })
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Medical license document is required' })
    }

    const existing = await Hospital.findOne({
      where: { license_number: licenseNumber.trim() },
    })

    if (existing) {
      return res.status(409).json({ message: 'A hospital with this license number already exists' })
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`
    const documentUrl = `${baseUrl}/uploads/${req.file.filename}`

    const hospital = await Hospital.create({
      name: name.trim(),
      license_number: licenseNumber.trim(),
      admin_email: adminEmail.trim().toLowerCase(),
      address: address.trim(),
      city: city.trim(),
      bank_name: bankName.trim(),
      bank_account_name: bankAccountName.trim(),
      bank_account_number: bankAccountNumber.trim(),
      ifsc_swift_code: swift?.trim() || null,
      bank_details: {
        accountNumber: bankAccountNumber.trim(),
        iban: iban?.trim() || null,
        swift: swift?.trim() || null,
        bankName: bankName.trim(),
      },
      document_url: documentUrl,
      is_verified: false,
      status: 'PENDING',
      suspended: false,
    })

    try {
      await sendHospitalApplicationSubmitted(hospital.admin_email, hospital.name, hospital.id)
    } catch (notifyError) {
      console.warn('Hospital application submitted email failed:', notifyError.message)
    }

    res.status(201).json({
      message: 'Hospital application submitted. Our team will review your request.',
      hospital: {
        id: hospital.id,
        name: hospital.name,
        status: hospital.status,
        submittedAt: hospital.createdAt,
        nextStep: getNextStepByStatus(hospital.status),
      },
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/hospitals/application-status?applicationId=123&adminEmail=a@b.com
router.get('/application-status', async (req, res) => {
  try {
    const applicationId = Number(req.query.applicationId)
    const adminEmail = (req.query.adminEmail || '').trim().toLowerCase()

    if (!applicationId || !adminEmail) {
      return res.status(400).json({ message: 'applicationId and adminEmail are required' })
    }

    const hospital = await Hospital.findOne({
      where: {
        id: applicationId,
        admin_email: adminEmail,
      },
      attributes: ['id', 'name', 'status', 'created_at', 'verified_at', 'rejection_reason'],
      raw: true,
    })

    if (!hospital) {
      return res.status(404).json({ message: 'Application not found for the provided details' })
    }

    res.json({
      applicationId: hospital.id,
      hospitalName: hospital.name,
      status: hospital.status || (hospital.verified_at ? 'APPROVED' : 'PENDING'),
      submittedAt: hospital.created_at,
      reviewedAt: hospital.verified_at,
      rejectionReason: hospital.rejection_reason || null,
      nextStep: getNextStepByStatus(hospital.status || (hospital.verified_at ? 'APPROVED' : 'PENDING')),
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/hospitals/:id
router.get('/:id', async (req, res) => {
  try {
    const h = await Hospital.findByPk(req.params.id, {
      attributes: { exclude: ['bank_account_number'] },
      raw: true,
    })
    if (!h) return res.status(404).json({ message: 'Hospital not found' })
    res.json({ ...h, _id: h.id })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/hospitals - Add hospital (super admin)
router.post('/', protect, requireRole('super_admin'), async (req, res) => {
  try {
    const {
      name,
      address,
      city,
      license_number,
      admin_email,
      contact_phone,
      bank_account_name,
      bank_account_number,
      bank_name,
      ifsc_swift_code,
    } = req.body

    if (!name || !admin_email || !bank_account_number || !bank_name) {
      return res.status(400).json({
        message: 'Name, admin_email, bank_account_number, bank_name required',
      })
    }

    const hospital = await Hospital.create({
      name,
      address,
      city,
      license_number,
      admin_email,
      contact_phone,
      bank_account_name,
      bank_account_number,
      bank_name,
      ifsc_swift_code,
      is_verified: true,
      status: 'APPROVED',
    })
    res.json({ ...hospital.toJSON(), _id: hospital.id })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
