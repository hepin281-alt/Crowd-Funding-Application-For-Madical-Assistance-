import express from 'express'
import MedicalCase from '../models/MedicalCase.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

// GET /api/cases - List verified cases (public)
router.get('/', async (req, res) => {
  try {
    const cases = await MedicalCase.find({ status: 'verified' })
      .sort({ createdAt: -1 })
      .lean()
    res.json(cases)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/cases/:id - Get single case
router.get('/:id', async (req, res) => {
  try {
    const c = await MedicalCase.findById(req.params.id).lean()
    if (!c) return res.status(404).json({ message: 'Case not found' })
    res.json(c)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
