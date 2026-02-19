import jwt from 'jsonwebtoken'
import { User } from '../models/index.js'

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
