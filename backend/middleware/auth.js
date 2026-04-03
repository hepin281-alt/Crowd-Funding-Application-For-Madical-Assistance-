import jwt from 'jsonwebtoken'
import { User } from '../models/index.js'
import { Hospital } from '../models/index.js'

export const protect = async (req, res, next) => {
  let token
  const auth = req.headers.authorization
  if (auth?.startsWith('Bearer ')) token = auth.slice(7)

  if (!token) {
    return res.status(401).json({ message: 'Not authorized' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret')
    const user = await User.findByPk(decoded.id)
    if (!user) return res.status(401).json({ message: 'User not found' })

    if (user.login_disabled) {
      return res.status(403).json({ message: 'Account access disabled' })
    }

    // Legacy role cleanup: convert deprecated admin role to super_admin.
    if (user.role === 'admin') {
      await user.update({ role: 'super_admin' })
      user.role = 'super_admin'
    }

    if (user.role === 'hospital_admin' && !user.hospital_id) {
      const hospital = await Hospital.findOne({
        where: user.email
          ? { admin_email: user.email }
          : user.license_number
            ? { license_number: user.license_number }
            : user.hospital_name
              ? { name: user.hospital_name }
              : null,
      })

      if (hospital) {
        await user.update({ hospital_id: hospital.id }, { hooks: false })
        user.hospital_id = hospital.id
      }
    }

    const now = Date.now()
    const lastSeenMs = user.last_seen_at ? new Date(user.last_seen_at).getTime() : 0
    if (!lastSeenMs || now - lastSeenMs > 30000) {
      await user.update({ last_seen_at: new Date(now) }, { hooks: false })
    }

    req.user = user
    next()
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' })
  }
}

export const requireRole = (roleOrRoles) => (req, res, next) => {
  const roles = Array.isArray(roleOrRoles) ? roleOrRoles : [roleOrRoles]
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({ message: 'Access denied' })
  }
  next()
}
