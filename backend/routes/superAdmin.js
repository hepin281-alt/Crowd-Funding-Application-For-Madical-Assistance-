import express from 'express'
import { protect, requireRole } from '../middleware/auth.js'
import { Sequelize } from 'sequelize'
import db from '../config/database.js'
import { Campaign, Donation, User, Hospital, DisbursementRequest, Transaction, AuditLog } from '../models/index.js'

const router = express.Router()

// Debug endpoint - no auth required
router.get('/debug/me', protect, async (req, res) => {
    res.json({
        user: req.user,
        message: 'Current authenticated user'
    })
})

// Middleware: Super Admin authorization
router.use(protect)
router.use(requireRole('super_admin', 'admin'))

/**
 * ===== OVERVIEW METRICS =====
 */

router.get('/metrics', async (req, res) => {
    try {
        const metrics = await db.transaction(async (t) => {
            // Financial metrics
            const totalRaised = await Donation.sum('amount', { transaction: t }) || 0
            const platformFees = totalRaised * 0.02 // 2% platform fee

            const pendingPayouts = await DisbursementRequest.findAll({
                where: { status: 'PENDING' },
                attributes: [[Sequelize.fn('SUM', Sequelize.col('requested_amount')), 'total']],
                transaction: t,
                raw: true,
            })

            // Activity metrics
            const activeCampaigns = await Campaign.count({
                where: { status: 'active' },
                transaction: t,
            })

            const totalCampaigns = await Campaign.count({ transaction: t })
            const totalHospitals = await Hospital.count({ transaction: t })

            const totalDonors = await User.count({
                where: { role: 'user' },
                transaction: t,
            })

            // Approval queue
            const hospitalsAwaitingOnboarding = await User.count({
                where: { role: 'hospital_admin', is_verified: false },
                transaction: t,
            })

            // 30-day growth
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

            const dailyDonations = await Donation.findAll({
                attributes: [
                    [Sequelize.fn('DATE', Sequelize.col('created_at')), 'date'],
                    [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
                    [Sequelize.fn('SUM', Sequelize.col('amount')), 'total'],
                ],
                where: { created_at: { [Sequelize.Op.gte]: thirtyDaysAgo } },
                group: [Sequelize.fn('DATE', Sequelize.col('created_at'))],
                order: [[Sequelize.fn('DATE', Sequelize.col('created_at')), 'ASC']],
                raw: true,
                transaction: t,
            })

            const dailyCampaigns = await Campaign.findAll({
                attributes: [
                    [Sequelize.fn('DATE', Sequelize.col('created_at')), 'date'],
                    [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
                ],
                where: { created_at: { [Sequelize.Op.gte]: thirtyDaysAgo } },
                group: [Sequelize.fn('DATE', Sequelize.col('created_at'))],
                order: [[Sequelize.fn('DATE', Sequelize.col('created_at')), 'ASC']],
                raw: true,
                transaction: t,
            })

            return {
                financial: {
                    totalRaised,
                    platformFees: Math.round(platformFees * 100) / 100,
                    pendingPayouts: pendingPayouts[0]?.total || 0,
                },
                activity: {
                    activeCampaigns,
                    totalCampaigns,
                    totalHospitals,
                    totalDonors,
                },
                approvalQueue: {
                    hospitalsAwaitingOnboarding,
                },
                growthCharts: {
                    dailyDonations,
                    dailyCampaigns,
                },
            }
        })

        res.json(metrics)
    } catch (error) {
        console.error('Metrics error:', error)
        res.status(500).json({ error: error.message })
    }
})

/**
 * ===== HOSPITAL MANAGEMENT =====
 */

router.get('/hospitals', async (req, res) => {
    try {
        const { status, search } = req.query
        const where = {}

        if (status) where.verified_at = status === 'active' ? { [Sequelize.Op.ne]: null } : null

        if (search) {
            where[Sequelize.Op.or] = [
                { name: { [Sequelize.Op.iLike]: `%${search}%` } },
                { license_number: { [Sequelize.Op.iLike]: `%${search}%` } },
            ]
        }

        const hospitals = await Hospital.findAll({
            where,
            include: [
                {
                    model: User,
                    as: 'admin',
                    attributes: ['id', 'name', 'email', 'is_verified'],
                },
            ],
            order: [['created_at', 'DESC']],
        })

        res.json(hospitals)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

router.get('/hospitals/:id', async (req, res) => {
    try {
        const hospital = await Hospital.findByPk(req.params.id, {
            include: [
                {
                    model: User,
                    as: 'admin',
                    attributes: ['id', 'name', 'email', 'phone', 'is_verified'],
                },
            ],
        })

        if (!hospital) {
            return res.status(404).json({ error: 'Hospital not found' })
        }

        res.json(hospital)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

router.post('/hospitals/:id/approve', async (req, res) => {
    try {
        const hospital = await Hospital.findByPk(req.params.id)

        if (!hospital) {
            return res.status(404).json({ error: 'Hospital not found' })
        }

        hospital.verified_at = new Date()
        hospital.verified_by_admin_id = req.user.id
        await hospital.save()

        // Verify the hospital admin
        await User.update(
            { is_verified: true },
            { where: { hospital_id: hospital.id, role: 'hospital_admin' } }
        )

        // Log action
        await AuditLog.create({
            admin_id: req.user.id,
            action: 'APPROVE_HOSPITAL',
            target_id: hospital.id,
            details: { hospital_name: hospital.name },
        })

        res.json({ message: 'Hospital approved', hospital })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

router.post('/hospitals/:id/suspend', async (req, res) => {
    try {
        const { reason } = req.body
        const hospital = await Hospital.findByPk(req.params.id)

        if (!hospital) {
            return res.status(404).json({ error: 'Hospital not found' })
        }

        hospital.suspended = true
        hospital.suspended_at = new Date()
        hospital.suspension_reason = reason
        await hospital.save()

        // Log action
        await AuditLog.create({
            admin_id: req.user.id,
            action: 'SUSPEND_HOSPITAL',
            target_id: hospital.id,
            details: { reason },
        })

        res.json({ message: 'Hospital suspended', hospital })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

/**
 * ===== CAMPAIGN OVERSIGHT =====
 */

router.get('/campaigns', async (req, res) => {
    try {
        const { filter, search, sortBy = 'created_at', order = 'DESC' } = req.query
        const where = {}

        // Filter options
        if (filter === 'high-value') {
            where.target_amount = { [Sequelize.Op.gte]: 50000 }
        } else if (filter === 'high-velocity') {
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            where.created_at = { [Sequelize.Op.gte]: sevenDaysAgo }
            where.raised_amount = { [Sequelize.Op.gte]: Sequelize.col('target_amount') }
        } else if (filter === 'reported') {
            where.reported = true
        }

        if (search) {
            where[Sequelize.Op.or] = [
                { patient_name: { [Sequelize.Op.iLike]: `%${search}%` } },
                { title: { [Sequelize.Op.iLike]: `%${search}%` } },
            ]
        }

        const campaigns = await Campaign.findAll({
            where,
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name', 'email'],
                },
                {
                    model: Hospital,
                    attributes: ['id', 'name'],
                },
                {
                    model: Donation,
                    attributes: [],
                },
            ],
            attributes: {
                include: [
                    [Sequelize.fn('COUNT', Sequelize.col('Donations.id')), 'donation_count'],
                ],
            },
            group: ['Campaign.id', 'user.id', 'Hospital.id'],
            order: [[sortBy, order]],
            raw: true,
            subQuery: false,
        })

        res.json(campaigns)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

router.get('/audit-logs', async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query
        const offset = (page - 1) * limit

        const logs = await AuditLog.findAll({
            include: [
                {
                    model: User,
                    attributes: ['name', 'email'],
                },
            ],
            order: [['created_at', 'DESC']],
            limit: parseInt(limit),
            offset,
        })

        const total = await AuditLog.count()

        res.json({
            logs,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit),
            },
        })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

router.post('/campaigns/:id/report', async (req, res) => {
    try {
        const { reason } = req.body
        const campaign = await Campaign.findByPk(req.params.id)

        if (!campaign) {
            return res.status(404).json({ error: 'Campaign not found' })
        }

        campaign.reported = true
        campaign.report_reason = reason
        await campaign.save()

        // Log action
        await AuditLog.create({
            admin_id: req.user.id,
            action: 'REPORT_CAMPAIGN',
            target_id: campaign.id,
            details: { reason },
        })

        res.json({ message: 'Campaign reported', campaign })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

/**
 * ===== FINANCE & PAYOUTS =====
 */

router.get('/payouts/queue', async (req, res) => {
    try {
        const payoutQueue = await DisbursementRequest.findAll({
            where: { status: 'PENDING' },
            include: [
                {
                    model: Campaign,
                    attributes: ['id', 'patient_name', 'campaign_title'],
                    include: [
                        {
                            model: Hospital,
                            attributes: ['name', 'bank_account_number'],
                        },
                    ],
                },
            ],
            order: [['created_at', 'ASC']],
        })

        res.json(payoutQueue)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

router.get('/transactions', async (req, res) => {
    try {
        const { page = 1, limit = 50, status } = req.query
        const offset = (page - 1) * limit
        const where = {}

        if (status) where.status = status

        const transactions = await Transaction.findAll({
            where,
            include: [
                {
                    model: DisbursementRequest,
                    include: [
                        {
                            model: Campaign,
                            attributes: ['patient_name', 'campaign_title'],
                        },
                    ],
                },
            ],
            order: [['created_at', 'DESC']],
            limit: parseInt(limit),
            offset,
        })

        const total = await Transaction.count({ where })

        res.json({
            transactions,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit),
            },
        })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

router.post('/receipts/:id/regenerate', async (req, res) => {
    try {
        const donation = await Donation.findByPk(req.params.id)

        if (!donation) {
            return res.status(404).json({ error: 'Donation not found' })
        }

        // Trigger PDF regeneration
        const pdfService = await import('../services/pdf.js')
        await pdfService.generateReceipt(donation)

        // Log action
        await AuditLog.create({
            admin_id: req.user.id,
            action: 'REGENERATE_RECEIPT',
            target_id: donation.id,
            details: {},
        })

        res.json({ message: 'Receipt regenerated' })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

/**
 * ===== PLATFORM SETTINGS =====
 */

router.get('/settings/rbac', async (req, res) => {
    try {
        const roles = ['user', 'admin', 'hospital_admin', 'super_admin']
        const permissions = {
            user: ['view_campaigns', 'donate', 'view_receipts'],
            admin: ['manage_hospitals', 'view_all_campaigns', 'view_transactions'],
            hospital_admin: ['verify_campaigns', 'manage_hospital'],
            super_admin: ['manage_admins', 'manage_hospitals', 'view_all_data', 'manage_settings'],
        }

        res.json({ roles, permissions })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

router.get('/settings/email-templates', async (req, res) => {
    try {
        const templates = [
            { id: 'campaign_approved', name: 'Campaign Approved', subject: 'Your campaign has been approved!' },
            { id: 'campaign_rejected', name: 'Campaign Rejected', subject: 'Your campaign needs more information' },
            { id: 'donation_received', name: 'Donation Received', subject: 'Thank you for your donation!' },
            { id: 'payout_processed', name: 'Payout Processed', subject: 'Your funds have been transferred' },
            { id: 'hospital_verified', name: 'Hospital Verified', subject: 'Your hospital has been verified' },
        ]

        res.json(templates)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

router.get('/settings/cms', async (req, res) => {
    try {
        const cmsContent = {
            terms_of_service: 'Terms content here...',
            privacy_policy: 'Privacy content here...',
            how_it_works: 'How it works content here...',
            faq: 'FAQ content here...',
        }

        res.json(cmsContent)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

router.post('/settings/cms', async (req, res) => {
    try {
        const { page, content } = req.body

        // Log action
        await AuditLog.create({
            admin_id: req.user.id,
            action: 'UPDATE_CMS',
            target_id: null,
            details: { page },
        })

        // In a real app, save to database
        res.json({ message: `${page} updated successfully` })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

export default router
