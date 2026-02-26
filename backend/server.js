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
import uploadRoutes from './routes/uploads.js'

dotenv.config()
connectDB()

const app = express()
const PORT = process.env.PORT || 3001

const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174']
app.use(cors({ origin: allowedOrigins, credentials: true }))
app.use(express.json())

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

app.use('/api/auth', authRoutes)
app.use('/api/campaigns', campaignRoutes)
app.use('/api/donations', donationRoutes)
app.use('/api/receipts', receiptRoutes)
app.use('/api/uploads', uploadRoutes)

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
      uploads: '/api/uploads'
    }
  })
})

app.get('/api/health', (_, res) => res.json({ ok: true }))

app.listen(PORT, () => {
  console.log(`CareFund API running at http://localhost:${PORT}`)
})
