import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import connectDB from './config/db.js'
import authRoutes from './routes/auth.js'
import campaignRoutes from './routes/campaigns.js'
import donationRoutes from './routes/donations.js'
import receiptRoutes from './routes/receipts.js'
import invoiceRoutes from './routes/invoices.js'
import uploadRoutes from './routes/uploads.js'
import hospitalsRoutes from './routes/hospitals.js'
import hospitalAdminRoutes from './routes/hospitalAdmin.js'
import superAdminRoutes from './routes/superAdmin.js'

dotenv.config()
connectDB()

const app = express()
const PORT = process.env.PORT || 3001
const isDev = process.env.NODE_ENV !== 'production'

const allowedOrigins = new Set(['http://localhost:5173', 'http://localhost:5174'])
app.use(cors({
  origin: (origin, callback) => {
    if (isDev) {
      return callback(null, true)
    }
    // Allow non-browser tools and all localhost/dev ports.
    if (!origin || origin.startsWith('http://localhost:') || allowedOrigins.has(origin)) {
      return callback(null, true)
    }
    return callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
}))
app.use(express.json())

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

app.use('/api/auth', authRoutes)
app.use('/api/campaigns', campaignRoutes)
app.use('/api/donations', donationRoutes)
app.use('/api/receipts', receiptRoutes)
app.use('/api/invoices', invoiceRoutes)
app.use('/api/uploads', uploadRoutes)
app.use('/api/hospitals', hospitalsRoutes)
app.use('/api/hospital-admin', hospitalAdminRoutes)
app.use('/api/super-admin', superAdminRoutes)

app.get('/', (_, res) => {
  res.json({
    message: 'CareFund API Server',
    status: 'running',
    frontend: 'http://localhost:5173',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      campaigns: '/api/campaigns',
      donations: '/api/donations',
      receipts: '/api/receipts',
      invoices: '/api/invoices',
      uploads: '/api/uploads',
      hospitals: '/api/hospitals'
    }
  })
})

app.get('/api/health', (_, res) => res.json({ ok: true }))

app.listen(PORT, () => {
  console.log(`CareFund API running at http://localhost:${PORT}`)
})
