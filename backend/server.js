import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import connectDB from './config/db.js'
import authRoutes from './routes/auth.js'
import hospitalRoutes from './routes/hospitals.js'
import campaignRoutes from './routes/campaigns.js'
import donationRoutes from './routes/donations.js'
import invoiceRoutes from './routes/invoices.js'
import employeeRoutes from './routes/employee.js'
import hospitalAdminRoutes from './routes/hospitalAdmin.js'
import receiptRoutes from './routes/receipts.js'

dotenv.config()
connectDB()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: 'http://localhost:5173', credentials: true }))
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/hospitals', hospitalRoutes)
app.use('/api/campaigns', campaignRoutes)
app.use('/api/donations', donationRoutes)
app.use('/api/invoices', invoiceRoutes)
app.use('/api/employee', employeeRoutes)
app.use('/api/hospital-admin', hospitalAdminRoutes)
app.use('/api/receipts', receiptRoutes)

app.get('/api/health', (_, res) => res.json({ ok: true }))

app.listen(PORT, () => {
  console.log(`CareFund API running at http://localhost:${PORT}`)
})
