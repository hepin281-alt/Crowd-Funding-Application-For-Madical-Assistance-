import express from 'express'
import { protect, requireRole } from '../middleware/auth.js'
import { Sequelize } from 'sequelize'
import crypto from 'crypto'
import db from '../config/database.js'
import { Campaign, Donation, User, Hospital, DisbursementRequest, Transaction, AuditLog, PlatformSetting } from '../models/index.js'
import { sendHospitalApplicationApproved, sendHospitalApplicationRejected } from '../services/notify.js'

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

const allowOpsRoles = requireRole('super_admin')
const allowSuperAdminOnly = requireRole('super_admin')

/**
 * ===== OVERVIEW METRICS =====
 */

router.get('/metrics', allowOpsRoles, async (req, res) => {
    try {
        const metrics = await db.transaction(async (t) => {
            // Financial metrics
            const totalRaised = await Donation.sum('amount', { transaction: t }) || 0

            const pendingPayouts = await DisbursementRequest.findAll({
                where: { status: 'PENDING' },
                attributes: [[Sequelize.fn('SUM', Sequelize.col('requested_amount')), 'total']],
                transaction: t,
                raw: true,
            })

            const disbursedPayouts = await DisbursementRequest.findAll({
                where: { status: 'PAID' },
                attributes: [[Sequelize.fn('SUM', Sequelize.col('requested_amount')), 'total']],
                transaction: t,
                raw: true,
            })

            const approvedPayouts = await DisbursementRequest.findAll({
                where: { status: 'APPROVED' },
                attributes: [[Sequelize.fn('SUM', Sequelize.col('requested_amount')), 'total']],
                transaction: t,
                raw: true,
            })

            const totalDisbursed = Number(disbursedPayouts[0]?.total || 0)
            const totalApproved = Number(approvedPayouts[0]?.total || 0)
            const escrowBalance = Math.max(Number(totalRaised || 0) - totalDisbursed, 0)
            const availableEscrow = Math.max(escrowBalance - totalApproved, 0)

            // Activity metrics
            const activeCampaigns = await Campaign.count({
                where: { status: 'active' },
                transaction: t,
            })

            const totalCampaigns = await Campaign.count({ transaction: t })
            const totalHospitals = await Hospital.count({ transaction: t })

            const totalDonors = await User.count({
                where: { role: 'user', is_verified: true },
                transaction: t,
            })

            // Approval queue
            const hospitalsAwaitingOnboarding = await Hospital.count({
                where: {
                    [Sequelize.Op.or]: [
                        { status: 'PENDING' },
                        {
                            status: null,
                            verified_at: null,
                        },
                    ],
                    suspended: false,
                },
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
                    pendingPayouts: pendingPayouts[0]?.total || 0,
                    approvedPayouts: totalApproved,
                    totalDisbursed,
                    escrowBalance,
                    availableEscrow,
                    escrowUtilization: escrowBalance > 0 ? Math.round((totalApproved / escrowBalance) * 100) : 0,
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

router.get('/hospitals', allowSuperAdminOnly, async (req, res) => {
    try {
        const { status, search } = req.query
        const where = {}

        // Backfill legacy hospital_admin signups that have no linked hospital row.
        const orphanAdmins = await User.findAll({
            where: {
                role: 'hospital_admin',
                hospital_id: null,
            },
            attributes: ['id', 'name', 'email', 'hospital_name', 'license_number', 'hospital_phone'],
        })

        for (const admin of orphanAdmins) {
            if (!admin.hospital_name) continue

            let hospital = null

            if (admin.license_number) {
                hospital = await Hospital.findOne({
                    where: { license_number: admin.license_number },
                    order: [['id', 'ASC']],
                })
            }

            if (!hospital) {
                hospital = await Hospital.findOne({
                    where: { admin_email: admin.email },
                    order: [['id', 'ASC']],
                })
            }

            if (!hospital) {
                hospital = await Hospital.findOne({
                    where: { name: admin.hospital_name },
                    order: [['id', 'ASC']],
                })
            }

            if (!hospital) {
                hospital = await Hospital.create({
                    name: admin.hospital_name,
                    license_number: admin.license_number || null,
                    admin_email: admin.email,
                    contact_phone: admin.hospital_phone || null,
                    address: '__AUTO_MIGRATED__',
                    bank_account_number: 'PENDING',
                    bank_account_name: admin.hospital_name,
                    bank_name: 'Pending Verification',
                    is_verified: false,
                })
            }

            await admin.update({ hospital_id: hospital.id })
        }

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

        // Hide duplicate rows (same license/name) in queue while preserving the row linked to an admin if possible.
        const dedupeKey = (h) => (h.license_number && h.license_number.trim()) || (h.name && h.name.trim().toLowerCase()) || `hospital-${h.id}`
        const byKey = new Map()

        for (const h of hospitals) {
            const key = dedupeKey(h)
            const existing = byKey.get(key)

            if (!existing) {
                byKey.set(key, h)
                continue
            }

            const existingHasAdmin = !!existing.admin
            const currentHasAdmin = !!h.admin

            if (!existingHasAdmin && currentHasAdmin) {
                byKey.set(key, h)
            }
        }

        const dedupedHospitals = Array.from(byKey.values())
        const hospitalIds = dedupedHospitals.map((h) => h.id)

        let activeCountsByHospital = new Map()
        if (hospitalIds.length) {
            const campaignCounts = await Campaign.findAll({
                where: {
                    hospital_id: hospitalIds,
                    status: 'active',
                },
                attributes: [
                    'hospital_id',
                    [Sequelize.fn('COUNT', Sequelize.col('id')), 'active_campaign_count'],
                ],
                group: ['hospital_id'],
                raw: true,
            })

            activeCountsByHospital = new Map(
                campaignCounts.map((row) => [
                    Number(row.hospital_id),
                    Number(row.active_campaign_count || 0),
                ])
            )
        }

        const response = dedupedHospitals.map((h) => ({
            ...h.toJSON(),
            active_campaign_count: activeCountsByHospital.get(h.id) || 0,
        }))

        res.json(response)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

router.get('/hospitals/pending/count', allowSuperAdminOnly, async (_req, res) => {
    try {
        const count = await Hospital.count({
            where: {
                [Sequelize.Op.or]: [{ status: 'PENDING' }, { status: null, verified_at: null }],
                suspended: false,
            },
        })
        res.json({ count })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

router.get('/hospitals/pending/recent', allowSuperAdminOnly, async (req, res) => {
    try {
        const limit = Math.min(Math.max(parseInt(req.query.limit || '5', 10), 1), 20)
        const pending = await Hospital.findAll({
            where: {
                [Sequelize.Op.or]: [{ status: 'PENDING' }, { status: null, verified_at: null }],
                suspended: false,
            },
            attributes: ['id', 'name', 'license_number', 'city', 'created_at'],
            order: [['created_at', 'DESC']],
            limit,
            raw: true,
        })
        res.json(pending)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

router.get('/hospitals/:id', allowSuperAdminOnly, async (req, res) => {
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

router.get('/admins', allowSuperAdminOnly, async (req, res) => {
    try {
        const { search } = req.query
        const where = { role: 'hospital_admin' }
        const onlineWindowMs = 60 * 1000

        if (search) {
            where[Sequelize.Op.or] = [
                { name: { [Sequelize.Op.iLike]: `%${search}%` } },
                { email: { [Sequelize.Op.iLike]: `%${search}%` } },
                { hospital_name: { [Sequelize.Op.iLike]: `%${search}%` } },
                { license_number: { [Sequelize.Op.iLike]: `%${search}%` } },
            ]
        }

        const admins = await User.findAll({
            where,
            include: [
                {
                    model: Hospital,
                    attributes: ['id', 'name', 'license_number', 'verified_at', 'suspended', 'status'],
                    required: false,
                },
            ],
            attributes: ['id', 'name', 'email', 'phone', 'hospital_phone', 'hospital_name', 'license_number', 'hospital_id', 'is_verified', 'login_disabled', 'last_seen_at', 'created_at'],
            order: [['created_at', 'DESC']],
        })

        res.json(
            admins.map((admin) => {
                const row = admin.toJSON()
                const linkedHospital = row.Hospital || null
                const lastSeenAt = row.last_seen_at ? new Date(row.last_seen_at).getTime() : 0
                const onlineNow = Boolean(lastSeenAt && Date.now() - lastSeenAt <= onlineWindowMs)
                return {
                    ...row,
                    online_now: onlineNow,
                    linked_hospital: linkedHospital
                        ? {
                            id: linkedHospital.id,
                            name: linkedHospital.name,
                            license_number: linkedHospital.license_number,
                            verified_at: linkedHospital.verified_at,
                            suspended: linkedHospital.suspended,
                            status: linkedHospital.status,
                        }
                        : null,
                }
            })
        )
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

router.get('/admins/:id', allowSuperAdminOnly, async (req, res) => {
    try {
        const admin = await User.findOne({
            where: {
                id: req.params.id,
                role: 'hospital_admin',
            },
            include: [
                {
                    model: Hospital,
                    attributes: ['id', 'name', 'license_number', 'verified_at', 'suspended', 'status', 'city', 'created_at'],
                    required: false,
                },
            ],
            attributes: ['id', 'name', 'email', 'phone', 'hospital_phone', 'hospital_name', 'license_number', 'hospital_id', 'is_verified', 'login_disabled', 'last_seen_at', 'created_at'],
        })

        if (!admin) {
            return res.status(404).json({ error: 'Hospital admin not found' })
        }

        const row = admin.toJSON()
        const linkedHospital = row.Hospital || null
        res.json({
            ...row,
            linked_hospital: linkedHospital
                ? {
                    id: linkedHospital.id,
                    name: linkedHospital.name,
                    license_number: linkedHospital.license_number,
                    verified_at: linkedHospital.verified_at,
                    suspended: linkedHospital.suspended,
                    status: linkedHospital.status,
                    city: linkedHospital.city,
                    created_at: linkedHospital.created_at,
                }
                : null,
        })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

router.patch('/admins/:id/verification', allowSuperAdminOnly, async (req, res) => {
    try {
        const { is_verified } = req.body

        if (typeof is_verified !== 'boolean') {
            return res.status(400).json({ error: 'is_verified must be boolean' })
        }

        const admin = await User.findOne({
            where: {
                id: req.params.id,
                role: 'hospital_admin',
            },
        })

        if (!admin) {
            return res.status(404).json({ error: 'Hospital admin not found' })
        }

        admin.is_verified = is_verified
        await admin.save()

        await AuditLog.create({
            admin_id: req.user.id,
            action: is_verified ? 'VERIFY_HOSPITAL_ADMIN' : 'UNVERIFY_HOSPITAL_ADMIN',
            target_id: admin.id,
            details: {
                admin_email: admin.email,
                hospital_id: admin.hospital_id,
            },
        })

        res.json({ message: 'Hospital admin verification updated', admin })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

router.patch('/admins/:id/login-access', allowSuperAdminOnly, async (req, res) => {
    try {
        const { login_disabled } = req.body

        if (typeof login_disabled !== 'boolean') {
            return res.status(400).json({ error: 'login_disabled must be boolean' })
        }

        const admin = await User.findOne({
            where: {
                id: req.params.id,
                role: 'hospital_admin',
            },
        })

        if (!admin) {
            return res.status(404).json({ error: 'Hospital admin not found' })
        }

        admin.login_disabled = login_disabled
        await admin.save()

        await AuditLog.create({
            admin_id: req.user.id,
            action: login_disabled ? 'DISABLE_HOSPITAL_ADMIN_LOGIN' : 'ENABLE_HOSPITAL_ADMIN_LOGIN',
            target_id: admin.id,
            details: {
                admin_email: admin.email,
                hospital_id: admin.hospital_id,
            },
        })

        res.json({ message: 'Hospital admin login access updated', admin })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

router.post('/admins/:id/password-reset', allowSuperAdminOnly, async (req, res) => {
    try {
        const admin = await User.findOne({
            where: {
                id: req.params.id,
                role: 'hospital_admin',
            },
        })

        if (!admin) {
            return res.status(404).json({ error: 'Hospital admin not found' })
        }

        const resetToken = crypto.randomBytes(24).toString('hex')
        const resetTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000)

        await admin.update({
            reset_token: resetToken,
            reset_token_expires_at: resetTokenExpiresAt,
        })

        await AuditLog.create({
            admin_id: req.user.id,
            action: 'INITIATE_HOSPITAL_ADMIN_PASSWORD_RESET',
            target_id: admin.id,
            details: {
                admin_email: admin.email,
            },
        })

        const payload = {
            message: 'Password reset initiated',
            expires_at: resetTokenExpiresAt,
        }

        if (process.env.NODE_ENV !== 'production') {
            payload.resetToken = resetToken
            payload.resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`
        }

        res.json(payload)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

router.post('/hospitals/:id/approve', allowSuperAdminOnly, async (req, res) => {
    try {
        const hospital = await Hospital.findByPk(req.params.id)

        if (!hospital) {
            return res.status(404).json({ error: 'Hospital not found' })
        }

        hospital.is_verified = true
        hospital.status = 'APPROVED'
        hospital.rejection_reason = null
        hospital.suspended = false
        hospital.suspended_at = null
        hospital.suspension_reason = null
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

        try {
            await sendHospitalApplicationApproved(hospital.admin_email, hospital.name, hospital.id)
        } catch (notifyError) {
            console.warn('Hospital approval email failed:', notifyError.message)
        }

        res.json({ message: 'Hospital approved', hospital })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

router.post('/hospitals/:id/suspend', allowSuperAdminOnly, async (req, res) => {
    try {
        const { reason } = req.body
        const hospital = await Hospital.findByPk(req.params.id)

        if (!hospital) {
            return res.status(404).json({ error: 'Hospital not found' })
        }

        hospital.suspended = true
        hospital.status = 'REJECTED'
        hospital.rejection_reason = reason || 'Rejected during verification'
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

        try {
            await sendHospitalApplicationRejected(
                hospital.admin_email,
                hospital.name,
                hospital.id,
                reason || 'Rejected during verification'
            )
        } catch (notifyError) {
            console.warn('Hospital rejection email failed:', notifyError.message)
        }

        res.json({ message: 'Hospital suspended', hospital })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

/**
 * ===== CAMPAIGN OVERSIGHT =====
 */

router.get('/campaigns', allowOpsRoles, async (req, res) => {
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

router.get('/audit-logs', allowOpsRoles, async (req, res) => {
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

router.post('/campaigns/:id/report', allowOpsRoles, async (req, res) => {
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

router.post('/campaigns/:id/abort', allowOpsRoles, async (req, res) => {
    try {
        const { reason } = req.body
        const campaign = await Campaign.findByPk(req.params.id)

        if (!campaign) {
            return res.status(404).json({ error: 'Campaign not found' })
        }

        const abortReason = (reason || '').trim() || 'Aborted by platform admin'

        campaign.status = 'rejected'
        campaign.reported = true
        campaign.report_reason = `ABORTED: ${abortReason}`
        campaign.rejection_reason = abortReason
        await campaign.save()

        await AuditLog.create({
            admin_id: req.user.id,
            action: 'ABORT_CAMPAIGN',
            target_id: campaign.id,
            details: { reason: abortReason },
        })

        res.json({ message: 'Campaign aborted permanently', campaign })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

/**
 * ===== FINANCE & PAYOUTS =====
 */

router.get('/payouts/queue', allowSuperAdminOnly, async (req, res) => {
    try {
        const payoutQueue = await DisbursementRequest.findAll({
            where: {
                status: {
                    [Sequelize.Op.in]: ['PENDING', 'APPROVED'],
                },
            },
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

        const statusPriority = { PENDING: 0, APPROVED: 1 }
        const sortedQueue = payoutQueue.sort((a, b) => {
            const aPriority = statusPriority[a.status] ?? 99
            const bPriority = statusPriority[b.status] ?? 99

            if (aPriority !== bPriority) return aPriority - bPriority

            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        })

        res.json(sortedQueue)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

router.get('/transactions', allowSuperAdminOnly, async (req, res) => {
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

router.post('/receipts/:id/regenerate', allowSuperAdminOnly, async (req, res) => {
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

const RBAC_SETTING_KEY = 'rbac_settings'
const CMS_SETTING_KEY = 'cms_content'
const EMAIL_TEMPLATES_SETTING_KEY = 'email_templates'

const DEFAULT_RBAC_SETTINGS = {
    roles: ['user', 'hospital_admin'],
    permissions: {
        user: ['view_campaigns', 'donate', 'view_receipts'],
        hospital_admin: ['verify_campaigns', 'manage_hospital'],
    },
    available_permissions: {
        user: ['view_campaigns', 'donate', 'view_receipts'],
        hospital_admin: ['verify_campaigns', 'manage_hospital'],
    },
}

const DEFAULT_CMS_CONTENT = {
    terms_of_service: 'Terms content here...',
    privacy_policy: 'Privacy content here...',
    how_it_works: 'How it works content here...',
    hospital_onboarding: `For CareFund, the hospital onboarding process is the gatekeeper of your platform's integrity. It follows a professional B2B (Business-to-Business) workflow where the hospital must prove its legal and financial standing before it can verify any patient campaigns.\n\n1. The Onboarding Journey: How Hospitals Join\n\nThe interaction follows a four-step request-and-verify loop:\n\nInitial Lead/Signup: A hospital representative visits the Partner with Us page on the CareFund website and fills out an interest form.\n\nDetailed Registration: After email verification, they access a Hospital Onboarding Portal to upload legal and bank documents.\n\nThe Pending State: Once submitted, the hospital's status in your database becomes PENDING_VERIFICATION.\n\nSuper Admin Alert: This submission triggers a notification or a New Request badge on the Super Admin dashboard.\n\n2. Required Details for Hospital Verification\n\nTo build a trust-first platform, the Super Admin needs specific data points to perform due diligence:\n\nCategory: Identity\nSpecific Details Required: Registered Hospital Name, Physical Address, and Official Website.\n\nCategory: Legal\nSpecific Details Required: Medical License Number, Government Registration Certificate, and Tax ID (e.g., GST/VAT/EIN).\n\nCategory: Personnel\nSpecific Details Required: Name, Designation, and Official Email of the designated Hospital Admin.\n\nCategory: Financial\nSpecific Details Required: Hospital Bank Account Name, IBAN/Swift Code, and a cancelled check (to ensure the Direct-to-Hospital payout model works correctly).\n\n3. How the Request Pops Up to the Super Admin\n\nIn your React + Node.js stack, you can handle this pop up in two ways to ensure the Super Admin never misses a request:\n\nA. The Real-Time Notification (Socket.io)\nIf the Super Admin is currently logged in, you can use WebSockets to show a toast notification in the corner of their screen the moment a hospital hits Submit.\n\nB. The Action Required Badge\nOn the Super Admin Sidebar, a red numeric badge should appear next to the Hospitals menu item.\n\nExample: Hospitals (3) indicating three new hospitals are waiting for review.\n\n4. The Verification Workflow (The Interaction)\n\nWhen the Super Admin clicks on a pending request, they enter the split-screen verification view:\n\nReview: The Super Admin compares the uploaded Medical License image against the License Number typed in the form.\n\nCommunication: If a document is blurry, the Super Admin uses a Request Clarification button to send an automated email back to the hospital admin.\n\nFinal Authorization: Once the Super Admin is satisfied, they click Authorize Hospital.\n\nActivation: The system automatically sends the Hospital Admin their login credentials, and that hospital now appears in the dropdown menu for Campaigners to select.`,
    faq: 'FAQ content here...',
}

const DEFAULT_EMAIL_TEMPLATES = [
    {
        id: 'campaign_approved',
        name: 'Campaign Approved',
        subject: 'Your campaign has been approved!',
        body: 'Hi {{name}},\n\nGreat news. Your campaign has been approved and is now visible to donors.',
    },
    {
        id: 'campaign_rejected',
        name: 'Campaign Rejected',
        subject: 'Your campaign needs more information',
        body: 'Hi {{name}},\n\nYour campaign submission needs additional information before it can be approved.',
    },
    {
        id: 'donation_received',
        name: 'Donation Received',
        subject: 'Thank you for your donation!',
        body: 'Hi {{name}},\n\nThank you for your donation of {{amount}} to {{campaignTitle}}.',
    },
    {
        id: 'payout_processed',
        name: 'Payout Processed',
        subject: 'Your funds have been transferred',
        body: 'Hi {{name}},\n\nYour payout request for {{amount}} has been processed successfully.',
    },
    {
        id: 'hospital_verified',
        name: 'Hospital Verified',
        subject: 'Your hospital has been verified',
        body: 'Hi {{name}},\n\nYour hospital account has been verified and can now manage campaigns.',
    },
]

function normalizeRbacPayload(payload = {}) {
    const availablePermissions = payload.available_permissions || DEFAULT_RBAC_SETTINGS.available_permissions
    const roles = Array.isArray(payload.roles) ? payload.roles : DEFAULT_RBAC_SETTINGS.roles
    const permissions = payload.permissions && typeof payload.permissions === 'object' ? payload.permissions : {}

    const sanitizedRoles = roles.filter((role) => Object.prototype.hasOwnProperty.call(availablePermissions, role))
    const normalizedPermissions = {}

    for (const role of sanitizedRoles) {
        const allowedList = Array.isArray(availablePermissions[role]) ? availablePermissions[role] : []
        const requested = Array.isArray(permissions[role]) ? permissions[role] : []
        normalizedPermissions[role] = requested.filter((perm) => allowedList.includes(perm))
    }

    return {
        roles: sanitizedRoles,
        permissions: normalizedPermissions,
        available_permissions: availablePermissions,
    }
}

function normalizeEmailTemplates(payload) {
    const incoming = Array.isArray(payload) ? payload : []
    const byId = new Map(incoming.map((item) => [item?.id, item]))

    return DEFAULT_EMAIL_TEMPLATES.map((template) => {
        const candidate = byId.get(template.id) || {}

        return {
            id: template.id,
            name: template.name,
            subject: typeof candidate.subject === 'string' && candidate.subject.trim() ? candidate.subject.trim() : template.subject,
            body: typeof candidate.body === 'string' && candidate.body.trim() ? candidate.body : template.body,
        }
    })
}

function normalizeCmsContent(payload = {}) {
    return {
        ...DEFAULT_CMS_CONTENT,
        ...(payload && typeof payload === 'object' ? payload : {}),
    }
}

async function loadSettingOrDefault(key, fallbackValue) {
    const setting = await PlatformSetting.findOne({ where: { key } })
    return setting?.value || fallbackValue
}

router.get('/settings/rbac', allowSuperAdminOnly, async (req, res) => {
    try {
        const stored = await loadSettingOrDefault(RBAC_SETTING_KEY, DEFAULT_RBAC_SETTINGS)
        const rbac = normalizeRbacPayload(stored)
        res.json(rbac)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

router.post('/settings/rbac', allowSuperAdminOnly, async (req, res) => {
    try {
        const payload = normalizeRbacPayload(req.body)

        await PlatformSetting.upsert({
            key: RBAC_SETTING_KEY,
            value: payload,
        })

        await AuditLog.create({
            admin_id: req.user.id,
            action: 'UPDATE_RBAC',
            target_id: null,
            details: { roles: payload.roles },
        })

        res.json({ message: 'RBAC settings updated successfully', settings: payload })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

router.get('/settings/email-templates', allowSuperAdminOnly, async (req, res) => {
    try {
        const stored = await loadSettingOrDefault(EMAIL_TEMPLATES_SETTING_KEY, DEFAULT_EMAIL_TEMPLATES)
        const templates = normalizeEmailTemplates(stored)
        res.json(templates)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

router.post('/settings/email-templates', allowSuperAdminOnly, async (req, res) => {
    try {
        const templates = normalizeEmailTemplates(req.body?.templates)

        await PlatformSetting.upsert({
            key: EMAIL_TEMPLATES_SETTING_KEY,
            value: templates,
        })

        await AuditLog.create({
            admin_id: req.user.id,
            action: 'UPDATE_EMAIL_TEMPLATES',
            target_id: null,
            details: { count: templates.length },
        })

        res.json({ message: 'Email templates updated successfully', templates })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

router.get('/settings/cms', allowSuperAdminOnly, async (req, res) => {
    try {
        const stored = await loadSettingOrDefault(CMS_SETTING_KEY, DEFAULT_CMS_CONTENT)
        const cmsContent = normalizeCmsContent(stored)
        res.json(cmsContent)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

router.post('/settings/cms', allowSuperAdminOnly, async (req, res) => {
    try {
        const { page, content } = req.body

        if (!page || typeof page !== 'string') {
            return res.status(400).json({ error: 'Page is required' })
        }

        const current = normalizeCmsContent(await loadSettingOrDefault(CMS_SETTING_KEY, DEFAULT_CMS_CONTENT))
        const nextContent = {
            ...current,
            [page]: typeof content === 'string' ? content : '',
        }

        await PlatformSetting.upsert({
            key: CMS_SETTING_KEY,
            value: nextContent,
        })

        // Log action
        await AuditLog.create({
            admin_id: req.user.id,
            action: 'UPDATE_CMS',
            target_id: null,
            details: { page },
        })

        res.json({ message: `${page} updated successfully`, content: nextContent })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

export default router
