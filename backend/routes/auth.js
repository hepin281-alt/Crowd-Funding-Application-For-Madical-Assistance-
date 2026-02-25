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
    const { name, email, password, role, phone, hospitalName, licenseNumber } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' })
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' })
    }

    // Validate role-specific fields
    if (role === 'user') {
      if (!phone) {
        return res.status(400).json({ message: 'Phone number is required for users' })
      }
    } else if (role === 'hospital_admin') {
      if (!hospitalName || !licenseNumber) {
        return res.status(400).json({ message: 'Hospital name and license number are required for hospital admins' })
      }
    }

    const existing = await User.findOne({ where: { email } })
    if (existing) {
      return res.status(400).json({ message: 'Email already registered' })
    }

    let userData = { name, email, password, role: role || 'user', is_verified: false }

    if (role === 'user' && phone) {
      userData.phone = phone
    }

    if (role === 'hospital_admin') {
      userData.hospital_name = hospitalName
      userData.license_number = licenseNumber
      userData.hospital_phone = phone // Store hospital phone in hospital_phone field
      userData.is_verified = false // Hospital admins start unverified
    }

    const user = await User.create(userData)

    const token = generateToken(user.id)
    const payload = {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        is_verified: user.is_verified,
        ...(user.role === 'hospital_admin' && {
          hospital_name: user.hospital_name,
          license_number: user.license_number,
        }),
      },
    }
    res.status(201).json(payload)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

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

    const token = generateToken(user.id)
    const payload = {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        is_verified: user.is_verified,
        ...(user.role === 'hospital_admin' && {
          hospital_name: user.hospital_name,
          license_number: user.license_number,
        }),
      },
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

    if (!['admin', 'hospital_admin'].includes(user.role)) {
      return res.status(400).json({ message: 'Only admins need verification' })
    }

    if (user.is_verified) {
      return res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          is_verified: true,
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
        is_verified: true,
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

    if (!['admin', 'hospital_admin'].includes(user.role)) {
      return res.status(400).json({ message: 'Only admins need verification' })
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
  const userObj = {
    id: req.user.id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    is_verified: req.user.is_verified,
  }

  // Include hospital-specific fields for hospital_admin role
  if (req.user.role === 'hospital_admin') {
    userObj.hospital_name = req.user.hospital_name
    userObj.license_number = req.user.license_number
  }

  res.json({ user: userObj })
})

export default router
