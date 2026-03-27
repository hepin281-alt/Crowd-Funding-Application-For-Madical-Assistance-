import express from 'express'
import { Receipt, Campaign, DisbursementRequest, User, Donation } from '../models/index.js'
import { protect, requireRole } from '../middleware/auth.js'
import { generateReceiptPDF, generateCertificatePDF, generateUtilizationCertificate } from '../services/pdf.js'
import { sendDonationUtilizedNotification } from '../services/notify.js'

const router = express.Router()

// GET /api/receipts/my
router.get('/my', protect, requireRole('user'), async (req, res) => {
  try {
    const receipts = await Receipt.findAll({
      where: { donor_id: req.user.id },
      include: [
        { model: Campaign, as: 'Campaign', attributes: ['id', 'patient_name'] },
        { model: DisbursementRequest, as: 'DisbursementRequest', attributes: ['id', 'requested_amount', 'invoice_image_url'] },
      ],
      order: [['created_at', 'DESC']],
      raw: true,
      nest: true,
    })
    res.json(
      receipts.map((r) => ({
        ...r,
        _id: r.id,
        campaign: r.Campaign ? { _id: r.Campaign.id, patientName: r.Campaign.patient_name } : null,
        invoice: r.DisbursementRequest
          ? {
            amount: parseFloat(r.DisbursementRequest.requested_amount),
            documentUrl: r.DisbursementRequest.invoice_image_url,
          }
          : null,
      }))
    )
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/receipts/:id - Get receipt details
router.get('/:id', protect, async (req, res) => {
  try {
    const receipt = await Receipt.findByPk(req.params.id, {
      include: [
        { model: Campaign, as: 'Campaign' },
        { model: DisbursementRequest, as: 'DisbursementRequest' },
        { model: User, as: 'Donor', attributes: ['id', 'name', 'email', 'phone'] },
      ],
    })

    if (!receipt) return res.status(404).json({ message: 'Receipt not found' })

    // Check authorization
    if (receipt.donor_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' })
    }

    res.json({
      ...receipt.toJSON(),
      _id: receipt.id,
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/receipts/:id/download - Download receipt PDF
router.get('/:id/download', protect, async (req, res) => {
  try {
    const receipt = await Receipt.findByPk(req.params.id, {
      include: [
        { model: Campaign, as: 'Campaign' },
        { model: User, as: 'Donor', attributes: ['email', 'name', 'phone'] },
      ],
    })

    if (!receipt) return res.status(404).json({ message: 'Receipt not found' })

    if (receipt.donor_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' })
    }

    const pdfBuffer = await generateReceiptPDF({
      receiptNumber: receipt.receipt_number || `RCP-${receipt.id}`,
      receiptDate: receipt.receipt_date,
      donorName: receipt.donor_name || receipt.Donor?.name,
      donorEmail: receipt.donor_email || receipt.Donor?.email,
      donorPhone: receipt.donor_phone || receipt.Donor?.phone,
      amount: receipt.amount,
      campaignName: receipt.Campaign?.patient_name,
      patientName: receipt.Campaign?.patient_name,
      medicalCondition: receipt.Campaign?.medical_condition,
      hospitalName: receipt.Campaign?.custom_hospital_name,
      panNumber: receipt.pan_number,
      organizationName: receipt.organization_name,
      tax80gEligible: receipt.tax_80g_eligible,
    })

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="donation-receipt-${receipt.receipt_number || receipt.id}.pdf"`)
    res.send(pdfBuffer)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/receipts/:id/certificate - Download certificate PDF
router.get('/:id/certificate', protect, async (req, res) => {
  try {
    const receipt = await Receipt.findByPk(req.params.id, {
      include: [
        { model: Campaign, as: 'Campaign' },
        { model: User, as: 'Donor', attributes: ['name'] },
      ],
    })

    if (!receipt) return res.status(404).json({ message: 'Receipt not found' })

    if (receipt.donor_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' })
    }

    const pdfBuffer = await generateCertificatePDF({
      certificateNumber: `CERT-${receipt.id}`,
      donorName: receipt.donor_name || receipt.Donor?.name,
      amount: receipt.amount,
      patientName: receipt.Campaign?.patient_name,
      dateIssued: receipt.receipt_date,
    })

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="appreciation-certificate-${receipt.id}.pdf"`)
    res.send(pdfBuffer)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/receipts/:id/utilization - Download utilization certificate
router.get('/:id/utilization', protect, async (req, res) => {
  try {
    const receipt = await Receipt.findByPk(req.params.id, {
      include: [
        { model: Campaign, as: 'Campaign' },
        { model: DisbursementRequest, as: 'DisbursementRequest' },
        { model: User, as: 'Donor', attributes: ['name'] },
      ],
    })

    if (!receipt) return res.status(404).json({ message: 'Receipt not found' })

    if (receipt.donor_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' })
    }

    if (!receipt.utilization_proof) {
      return res.status(400).json({ message: 'Utilization certificate not yet available' })
    }

    const pdfBuffer = await generateUtilizationCertificate({
      donorName: receipt.donor_name || receipt.Donor?.name,
      patientName: receipt.Campaign?.patient_name,
      amount: receipt.amount,
      hospitalName: receipt.Campaign?.custom_hospital_name,
      medicalCondition: receipt.Campaign?.medical_condition,
      utilizationDate: new Date(),
      invoiceReference: receipt.DisbursementRequest?.id || 'N/A',
      certificateNumber: `UTIL-${receipt.id}`,
    })

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="utilization-certificate-${receipt.id}.pdf"`)
    res.send(pdfBuffer)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/receipts/:id/mark-utilized - Mark receipt as utilized and send notification
router.post('/:id/mark-utilized', protect, async (req, res) => {
  try {
    const receipt = await Receipt.findByPk(req.params.id, {
      include: [
        { model: Campaign, as: 'Campaign' },
        { model: User, as: 'Donor', attributes: ['email', 'name'] },
        { model: DisbursementRequest, as: 'DisbursementRequest' },
      ],
    })

    if (!receipt) return res.status(404).json({ message: 'Receipt not found' })

    // Only admin can mark as utilized
    if (req.user.role !== 'admin' && req.user.role !== 'hospital_admin') {
      return res.status(403).json({ message: 'Unauthorized' })
    }

    // Generate utilization certificate and send email
    const receiptUrl = `${process.env.FRONTEND_URL}/receipts/${receipt.id}/utilization`

    await receipt.update({
      certificate_issued: true,
    })

    // Send utilization notification email
    await sendDonationUtilizedNotification(
      receipt.donor_email || receipt.Donor?.email,
      receipt.donor_name || receipt.Donor?.name,
      receipt.Campaign?.patient_name,
      receipt.amount,
      receipt.Campaign?.custom_hospital_name || 'Medical Facility',
      receiptUrl
    )

    res.json({
      message: 'Receipt marked as utilized and donor notified',
      receipt,
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router

