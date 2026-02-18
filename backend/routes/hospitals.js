import express from 'express'
import { Hospital } from '../models/index.js'
import { protect, requireRole } from '../middleware/auth.js'

const router = express.Router()

// GET /api/hospitals - List verified hospitals (public)
router.get('/', async (req, res) => {
  try {
    const hospitals = await Hospital.findAll({
      where: { is_verified: true },
      attributes: ['id', 'name', 'address', 'city', 'admin_email', 'contact_phone'],
      raw: true,
    })
    res.json(hospitals.map((h) => ({ ...h, _id: h.id })))
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

// POST /api/hospitals - Add hospital (platform employee)
router.post('/', protect, requireRole('employee'), async (req, res) => {
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
    })
    res.json({ ...hospital.toJSON(), _id: hospital.id })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
