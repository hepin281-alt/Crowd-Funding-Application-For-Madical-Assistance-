import express from 'express'
import jwt from 'jsonwebtoken'
import { User } from '../models/index.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' })

function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, role } = req.body

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Name, email, password, and role are required' })
    }

    const validRoles = ['employee', 'donor', 'campaigner', 'hospital_admin']
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: `Role must be one of: ${validRoles.join(', ')}` })
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' })
    }

    if (role === 'hospital_admin' && !req.body.hospitalId) {
      return res.status(400).json({ message: 'Hospital selection is required for Hospital Admin' })
    }

    const existing = await User.findOne({ where: { email } })
    if (existing) {
      return res.status(400).json({ message: 'Email already registered' })
    }

    const isEmployee = role === 'employee'
    const isHospitalAdmin = role === 'hospital_admin'
    const needsVerification = isEmployee || isHospitalAdmin
    const verificationCode = needsVerification ? generateVerificationCode() : undefined
    const verificationCodeExpiresAt = needsVerification
      ? new Date(Date.now() + 15 * 60 * 1000)
      : undefined
    const isVerified = !needsVerification

    const userData = { name, email, password, role, is_verified: isVerified }
    if (needsVerification) {
      userData.verification_code = verificationCode
      userData.verification_code_expires_at = verificationCodeExpiresAt
    }
    if (role === 'hospital_admin' && req.body.hospitalId) {
      userData.hospital_id = parseInt(req.body.hospitalId)
    }

    const user = await User.create(userData)

    if (needsVerification) {
      console.log(`[CareFund] Verification code for ${email}: ${verificationCode}`)
    }

    const token = generateToken(user.id)
    const payload = {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.is_verified,
      },
    }
    if (needsVerification) {
      payload.requiresVerification = true
      if (process.env.NODE_ENV !== 'production') {
        payload.verificationCode = verificationCode
      }
    }
    res.status(201).json(payload)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    const user = await User.findOne({ where: { email } })
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const match = await user.comparePassword(password)
    if (!match) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    if (role && user.role !== role) {
      return res.status(403).json({ message: `You are registered as ${user.role}` })
    }

    const token = generateToken(user.id)
    const payload = {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.is_verified,
      },
    }
    const needsVerification =
      (user.role === 'employee' || user.role === 'hospital_admin') && !user.is_verified
    if (needsVerification) {
      payload.requiresVerification = true
      if (process.env.NODE_ENV !== 'production') {
        payload.verificationCode = user.verification_code
      }
    }
    res.json(payload)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/auth/verify-identity
router.post('/verify-identity', protect, async (req, res) => {
  try {
    const { code } = req.body
    const user = req.user

    if (user.role !== 'employee' && user.role !== 'hospital_admin') {
      return res.status(400).json({ message: 'Only employees and hospital admins need verification' })
    }

    if (user.is_verified) {
      return res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: true,
        },
      })
    }

    if (!code) {
      return res.status(400).json({ message: 'Verification code is required' })
    }

    const u = await User.findByPk(user.id)
    if (!u.verification_code || !u.verification_code_expires_at) {
      return res.status(400).json({ message: 'No verification code found. Please request a new one.' })
    }

    if (new Date() > u.verification_code_expires_at) {
      await u.update({ verification_code: null, verification_code_expires_at: null })
      return res.status(400).json({ message: 'Code expired. Please request a new one.' })
    }

    if (u.verification_code !== code.trim()) {
      return res.status(400).json({ message: 'Invalid verification code' })
    }

    await u.update({ is_verified: true, verification_code: null, verification_code_expires_at: null })

    res.json({
      user: {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        isVerified: true,
      },
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/auth/resend-verification
router.post('/resend-verification', protect, async (req, res) => {
  try {
    const user = req.user

    if (user.role !== 'employee' && user.role !== 'hospital_admin') {
      return res.status(400).json({ message: 'Only employees and hospital admins need verification' })
    }

    const u = await User.findByPk(user.id)
    if (u.is_verified) {
      return res.json({ message: 'Already verified' })
    }

    const verificationCode = generateVerificationCode()
    await u.update({
      verification_code: verificationCode,
      verification_code_expires_at: new Date(Date.now() + 15 * 60 * 1000),
    })

    console.log(`[CareFund] Verification code for ${u.email}: ${verificationCode}`)

    const payload = { message: 'Verification code sent to your email' }
    if (process.env.NODE_ENV !== 'production') {
      payload.verificationCode = verificationCode
    }
    res.json(payload)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/auth/me
router.get('/me', protect, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      isVerified: req.user.is_verified,
    },
  })
})

export default router
