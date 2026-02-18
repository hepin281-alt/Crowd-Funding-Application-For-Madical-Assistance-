import express from 'express'
import { Hospital } from '../models/index.js'
import { protect, requireRole } from '../middleware/auth.js'

const router = express.Router()

router.use(protect)
router.use(requireRole('employee'))

router.use((req, res, next) => {
  if (!req.user.is_verified) {
    return res.status(403).json({
      message: 'Please verify your identity before accessing the dashboard',
      requiresVerification: true,
    })
  }
  next()
})

// GET /api/employee/hospitals
router.get('/hospitals', async (req, res) => {
  try {
    const hospitals = await Hospital.findAll({
      order: [['created_at', 'DESC']],
      raw: true,
    })
    res.json(hospitals.map((h) => ({ ...h, _id: h.id })))
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
