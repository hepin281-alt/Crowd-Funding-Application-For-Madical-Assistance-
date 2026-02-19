import express from 'express'
import { Receipt, Campaign, DisbursementRequest } from '../models/index.js'
import { protect, requireRole } from '../middleware/auth.js'

const router = express.Router()

// GET /api/receipts/my
router.get('/my', protect, requireRole('donor'), async (req, res) => {
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

export default router
