import express from 'express'
import { Sequelize, Op } from 'sequelize'
import db from '../config/database.js'
import { Campaign, Donation, Hospital, DisbursementRequest, User } from '../models/index.js'
import { protect, requireRole } from '../middleware/auth.js'

const router = express.Router()

// GET /analytics/campaign-performance
router.get('/campaign-performance', protect, requireRole('super_admin'), async (req, res) => {
    try {
        const campaigns = await db.query(
            `SELECT 
                id,
                campaign_title,
                target_amount,
                raised_amount,
                status,
                created_at
            FROM campaigns
            ORDER BY raised_amount DESC
            LIMIT 10`,
            { type: Sequelize.QueryTypes.SELECT }
        )

        const performance = campaigns.map((c) => ({
            name: c.campaign_title?.substring(0, 20) || 'Campaign',
            target: parseFloat(c.target_amount) || 0,
            raised: parseFloat(c.raised_amount) || 0,
            percentage: Math.round(((parseFloat(c.raised_amount) || 0) / (parseFloat(c.target_amount) || 1)) * 100),
            status: c.status,
        }))

        res.json(performance)
    } catch (error) {
        console.error('Campaign performance error:', error.message)
        res.status(500).json({ error: error.message })
    }
})

// GET /analytics/donation-trends
router.get('/donation-trends', protect, requireRole('super_admin'), async (req, res) => {
    try {
        const trends = await db.query(
            `SELECT 
                DATE(created_at) as date,
                COUNT(*) as donations,
                SUM(amount) as totalAmount,
                AVG(amount) as avgAmount
            FROM donations
            WHERE created_at >= NOW() - INTERVAL '30 days'
            GROUP BY DATE(created_at)
            ORDER BY DATE(created_at) ASC`,
            { type: Sequelize.QueryTypes.SELECT }
        )

        res.json(trends)
    } catch (error) {
        console.error('Donation trends error:', error.message)
        res.status(500).json({ error: error.message })
    }
})

// GET /analytics/hospital-performance
router.get('/hospital-performance', protect, requireRole('super_admin'), async (req, res) => {
    try {
        const hospitals = await db.query(
            `SELECT 
                h.id,
                h.name,
                h.city,
                COUNT(c.id) as campaignCount,
                COALESCE(SUM(c.raised_amount), 0) as totalRaised
            FROM hospitals h
            LEFT JOIN campaigns c ON h.id = c.hospital_id
            GROUP BY h.id, h.name, h.city
            ORDER BY totalRaised DESC
            LIMIT 10`,
            { type: Sequelize.QueryTypes.SELECT }
        )

        res.json(hospitals)
    } catch (error) {
        console.error('Hospital performance error:', error.message)
        res.status(500).json({ error: error.message })
    }
})

// GET /analytics/payout-efficiency
router.get('/payout-efficiency', protect, requireRole('super_admin'), async (req, res) => {
    try {
        const payoutData = await db.query(
            `SELECT 
                status,
                COUNT(*) as count,
                SUM(requested_amount) as total
            FROM disbursement_requests
            GROUP BY status`,
            { type: Sequelize.QueryTypes.SELECT }
        )

        const efficiency = {
            pending: payoutData.find((p) => p.status === 'PENDING') || { count: 0, total: 0 },
            approved: payoutData.find((p) => p.status === 'APPROVED') || { count: 0, total: 0 },
            paid: payoutData.find((p) => p.status === 'PAID') || { count: 0, total: 0 },
        }

        res.json(efficiency)
    } catch (error) {
        console.error('Payout efficiency error:', error.message)
        res.status(500).json({ error: error.message })
    }
})

// GET /analytics/donor-segments
router.get('/donor-segments', protect, requireRole('super_admin'), async (req, res) => {
    try {
        const byDonationAmount = await db.query(
            `SELECT 
                CASE 
                    WHEN amount < 1000 THEN 'Small (< ₹1K)'
                    WHEN amount < 5000 THEN 'Medium (₹1K-5K)'
                    WHEN amount < 10000 THEN 'Large (₹5K-10K)'
                    ELSE 'Very Large (> ₹10K)'
                END as segment,
                COUNT(*) as count,
                SUM(amount) as total
            FROM donations
            GROUP BY segment
            ORDER BY total DESC`,
            { type: Sequelize.QueryTypes.SELECT }
        )

        res.json(byDonationAmount)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// GET /analytics/summary
router.get('/summary', protect, requireRole('super_admin'), async (req, res) => {
    try {
        const totalDonations = await Donation.count()

        const uniqueDonorsResult = await db.query(
            'SELECT COUNT(DISTINCT donor_id) as count FROM donations',
            { type: Sequelize.QueryTypes.SELECT }
        )
        const uniqueDonors = uniqueDonorsResult[0]?.count || 0

        const avgDonationResult = await db.query(
            'SELECT AVG(amount) as avg FROM donations',
            { type: Sequelize.QueryTypes.SELECT }
        )
        const avgDonation = Math.round(avgDonationResult[0]?.avg || 0)

        const successfulCampaignsResult = await db.query(
            'SELECT COUNT(*) as count FROM campaigns WHERE raised_amount >= target_amount',
            { type: Sequelize.QueryTypes.SELECT }
        )
        const successfulCampaigns = successfulCampaignsResult[0]?.count || 0
        const totalCampaigns = await Campaign.count()

        res.json({
            totalDonations,
            uniqueDonors,
            avgDonation,
            successfulCampaigns,
            totalCampaigns,
        })
    } catch (error) {
        console.error('Summary error:', error.message)
        res.status(500).json({ error: error.message })
    }
})

export default router
