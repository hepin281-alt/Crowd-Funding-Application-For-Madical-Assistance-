import express from 'express'
import jwt from 'jsonwebtoken'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import { User, Hospital } from '../models/index.js'
import db from '../config/database.js'
import { protect } from '../middleware/auth.js'
import { sendVerificationCodeToUser } from '../services/notify.js'

const router = express.Router()

const uploadDir = path.join(process.cwd(), 'uploads')
fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
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

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' })

function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function generateResetToken() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

function maskPhoneNumber(phone) {
  if (!phone) return null
  const digits = String(phone).replace(/\D/g, '')
  if (digits.length <= 4) return phone
  return `***-***-${digits.slice(-4)}`
}

function buildUserPayload(user) {
  const payload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    is_verified: user.is_verified,
    login_disabled: user.login_disabled,
    phone: user.phone,
    hospital_phone: user.hospital_phone,
  }

  if (user.role === 'hospital_admin') {
    payload.hospital_name = user.hospital_name
    payload.license_number = user.license_number
  }

  return payload
}

function getOtpDeliveryPhone(user) {
  return user.phone || user.hospital_phone || null
}

function getOtpSuccessMessage(delivery) {
  if (delivery.emailSent && delivery.smsSent) {
    return 'A verification code has been sent to your email and phone number'
  }

  if (delivery.emailSent) {
    return 'A verification code has been sent to your email address'
  }

  if (delivery.smsSent) {
    return 'A verification code has been sent to your phone number'
  }

  return 'A verification code has been generated. Please request a new OTP.'
}

async function issueVerificationCode(user, { purpose = 'verification', expiresInMinutes = 10, phone = getOtpDeliveryPhone(user), transaction } = {}) {
  const otpCode = generateVerificationCode()
  const updateOptions = transaction ? { transaction } : undefined

  await user.update(
    {
      verification_code: otpCode,
      verification_code_expires_at: new Date(Date.now() + expiresInMinutes * 60 * 1000),
    },
    updateOptions
  )

  const delivery = await sendVerificationCodeToUser({
    email: user.email,
    phone,
    recipientName: user.name,
    verificationCode: otpCode,
    purpose,
  })

  return { otpCode, delivery }
}


// POST /api/auth/signup
router.post('/signup', upload.single('hospitalDocument'), async (req, res) => {
  try {
    const { name, email, password, role, phone, hospitalName, licenseNumber } = req.body
    const signupRole = role || 'user'

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' })
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' })
    }

    if (!['user', 'hospital_admin'].includes(signupRole)) {
      return res.status(400).json({ message: 'Invalid role selected' })
    }

    // Validate role-specific fields
    if (signupRole === 'user') {
      if (!phone) {
        return res.status(400).json({ message: 'Phone number is required for users' })
      }
    } else if (signupRole === 'hospital_admin') {
      if (!hospitalName || !licenseNumber) {
        return res.status(400).json({ message: 'Hospital name and license number are required for hospital admins' })
      }
      if (!req.file) {
        return res.status(400).json({ message: 'Medical license document is required for hospital admins' })
      }
    }

    const existing = await User.findOne({ where: { email } })
    if (existing) {
      return res.status(400).json({ message: 'Email already registered' })
    }

    const signupResult = await db.transaction(async (t) => {
      let userData = { name, email, password, role: signupRole, is_verified: false }

      if (signupRole === 'user' && phone) {
        userData.phone = phone
      }

      if (signupRole === 'hospital_admin') {
        const baseUrl = `${req.protocol}://${req.get('host')}`
        const documentUrl = `${baseUrl}/uploads/${req.file.filename}`

        // Ensure onboarding requests are visible in Super Admin > Hospitals.
        const hospital = await Hospital.create(
          {
            name: hospitalName,
            license_number: licenseNumber,
            admin_email: email,
            contact_phone: phone || null,
            document_url: documentUrl,
            bank_account_number: 'PENDING',
            bank_account_name: hospitalName,
            bank_name: 'Pending Verification',
            is_verified: false,
          },
          { transaction: t }
        )

        userData.hospital_name = hospitalName
        userData.license_number = licenseNumber
        userData.hospital_phone = phone
        userData.hospital_id = hospital.id
        userData.is_verified = false
      }

      const createdUser = await User.create(userData, { transaction: t })

      if (signupRole === 'user') {
        const verification = await issueVerificationCode(createdUser, {
          purpose: 'signup verification',
          expiresInMinutes: 10,
          transaction: t,
        })

        return {
          user: createdUser,
          otpCode: verification.otpCode,
          delivery: verification.delivery,
        }
      }

      return { user: createdUser, otpCode: null, delivery: null }
    })

    const { user, otpCode, delivery } = signupResult

    if (signupRole === 'user') {
      const payload = {
        requires_verification: true,
        message: getOtpSuccessMessage(delivery),
        masked_phone: maskPhoneNumber(user.phone),
        user: buildUserPayload(user),
      }
      if (process.env.NODE_ENV !== 'production') {
        payload.otpCode = otpCode
      }
      return res.status(201).json(payload)
    }

    const token = generateToken(user.id)
    const payload = {
      token,
      user: buildUserPayload(user),
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

    if (user.login_disabled) {
      return res.status(403).json({ message: 'Login access has been disabled for this account. Please contact support.' })
    }

    const match = await user.comparePassword(password)
    if (!match) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    if (user.role === 'user' && !user.is_verified) {
      return res.status(403).json({
        message: 'Please verify your account during signup before logging in.',
      })
    }

    const token = generateToken(user.id)
    const payload = {
      token,
      user: buildUserPayload(user),
    }
    res.json(payload)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/auth/verify-signup-otp
router.post('/verify-signup-otp', async (req, res) => {
  try {
    const { email, password, code } = req.body

    if (!email || !password || !code) {
      return res.status(400).json({ message: 'Email, password, and OTP code are required' })
    }

    const user = await User.findOne({ where: { email } })
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    if (user.login_disabled) {
      return res.status(403).json({ message: 'Login access has been disabled for this account. Please contact support.' })
    }

    const match = await user.comparePassword(password)
    if (!match) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    if (user.role !== 'user') {
      return res.status(400).json({ message: 'OTP verification is only required for user accounts' })
    }

    if (!user.verification_code || !user.verification_code_expires_at) {
      return res.status(400).json({ message: 'No verification code found. Please request a new OTP.' })
    }

    if (new Date() > user.verification_code_expires_at) {
      await user.update({ verification_code: null, verification_code_expires_at: null })
      return res.status(400).json({ message: 'OTP expired. Please request a new one.' })
    }

    if (user.verification_code !== code.trim()) {
      return res.status(400).json({ message: 'Invalid verification code' })
    }

    await user.update({
      is_verified: true,
      verification_code: null,
      verification_code_expires_at: null,
    })

    const token = generateToken(user.id)
    res.json({
      token,
      user: buildUserPayload(user),
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/auth/resend-signup-otp
router.post('/resend-signup-otp', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    const user = await User.findOne({ where: { email } })
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    if (user.login_disabled) {
      return res.status(403).json({ message: 'Login access has been disabled for this account. Please contact support.' })
    }

    const match = await user.comparePassword(password)
    if (!match) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    if (user.role !== 'user') {
      return res.status(400).json({ message: 'OTP resend is only required for user accounts' })
    }

    if (user.is_verified) {
      return res.json({ message: 'Your account is already verified' })
    }

    const { otpCode, delivery } = await db.transaction(async (t) => {
      return issueVerificationCode(user, {
        purpose: 'signup verification',
        expiresInMinutes: 10,
        transaction: t,
      })
    })
    const payload = {
      message: getOtpSuccessMessage(delivery),
      masked_phone: maskPhoneNumber(user.phone),
    }
    if (process.env.NODE_ENV !== 'production') {
      payload.otpCode = otpCode
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

    if (user.role !== 'hospital_admin') {
      return res.status(400).json({ message: 'Only hospital admins need verification' })
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

    if (user.role !== 'hospital_admin') {
      return res.status(400).json({ message: 'Only hospital admins need verification' })
    }

    const u = await User.findByPk(user.id)
    if (u.is_verified) {
      return res.json({ message: 'Already verified' })
    }

    const { otpCode, delivery } = await db.transaction(async (t) => {
      return issueVerificationCode(u, {
        purpose: 'identity verification',
        expiresInMinutes: 15,
        phone: getOtpDeliveryPhone(u),
        transaction: t,
      })
    })

    const payload = { message: getOtpSuccessMessage(delivery) }
    if (process.env.NODE_ENV !== 'production') {
      payload.verificationCode = otpCode
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
    login_disabled: req.user.login_disabled,
    last_seen_at: req.user.last_seen_at,
  }

  // Include hospital-specific fields for hospital_admin role
  if (req.user.role === 'hospital_admin') {
    userObj.hospital_name = req.user.hospital_name
    userObj.license_number = req.user.license_number
  }

  res.json({ user: userObj })
})

// POST /api/auth/ping
router.post('/ping', protect, (_req, res) => {
  res.json({ ok: true })
})

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ message: 'Email is required' })
    }

    const user = await User.findOne({ where: { email } })
    if (!user) {
      // Return success even if user not found (security best practice)
      return res.json({ message: 'If email exists, password reset link has been sent' })
    }

    const resetToken = generateResetToken()
    const resetTokenExpiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000) // 1 hour

    await user.update({
      reset_token: resetToken,
      reset_token_expires_at: resetTokenExpiresAt,
    })

    console.log(`[CareFund] Password reset token for ${user.email}: ${resetToken}`)

    const payload = { message: 'Password reset link sent to your email' }
    if (process.env.NODE_ENV !== 'production') {
      payload.resetToken = resetToken
    }
    res.json(payload)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body

    if (!token || !password) {
      return res.status(400).json({ message: 'Token and password are required' })
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' })
    }

    const user = await User.findOne({
      where: { reset_token: token }
    })

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' })
    }

    if (!user.reset_token_expires_at || new Date() > user.reset_token_expires_at) {
      await user.update({ reset_token: null, reset_token_expires_at: null })
      return res.status(400).json({ message: 'Reset token has expired' })
    }

    await user.update({
      password,
      reset_token: null,
      reset_token_expires_at: null,
    })

    res.json({ message: 'Password reset successfully' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
