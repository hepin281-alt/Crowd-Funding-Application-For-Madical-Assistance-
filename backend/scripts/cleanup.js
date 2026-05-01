import dotenv from 'dotenv'
import db from '../config/database.js'
import { User, Campaign, Donation, DisbursementRequest, Receipt, Transaction, AuditLog, PlatformSetting } from '../models/index.js'

dotenv.config()

async function cleanup() {
    try {
        await db.authenticate()
        console.log('✓ Database connected')
        console.log('')

        const t = await db.transaction()

        try {
            // Count before deletion
            const usersBeforeCount = await User.count({ transaction: t })
            const campaignsBeforeCount = await Campaign.count({ transaction: t })
            const donationsBeforeCount = await Donation.count({ transaction: t })
            const disbursementsBeforeCount = await DisbursementRequest.count({ transaction: t })

            console.log('📊 BEFORE CLEANUP:')
            console.log(`   Users: ${usersBeforeCount}`)
            console.log(`   Campaigns: ${campaignsBeforeCount}`)
            console.log(`   Donations: ${donationsBeforeCount}`)
            console.log(`   Disbursements: ${disbursementsBeforeCount}`)
            console.log('')

            // Delete related records first (cascade)
            console.log('🗑️  DELETING RELATED DATA:')

            const reciptsDeleted = await Receipt.destroy({ where: {}, transaction: t })
            console.log(`   ✓ Deleted ${reciptsDeleted} receipts`)

            const transactionsDeleted = await Transaction.destroy({ where: {}, transaction: t })
            console.log(`   ✓ Deleted ${transactionsDeleted} transactions`)

            const auditLogsDeleted = await AuditLog.destroy({ where: {}, transaction: t })
            console.log(`   ✓ Deleted ${auditLogsDeleted} audit logs`)

            const disbursementsDeleted = await DisbursementRequest.destroy({ where: {}, transaction: t })
            console.log(`   ✓ Deleted ${disbursementsDeleted} disbursements`)

            const donationsDeleted = await Donation.destroy({ where: {}, transaction: t })
            console.log(`   ✓ Deleted ${donationsDeleted} donations`)

            // Delete all campaigns
            const campaignsDeleted = await Campaign.destroy({ where: {}, transaction: t })
            console.log(`   ✓ Deleted ${campaignsDeleted} campaigns`)
            console.log('')

            // Delete all users except super_admin and hospital_admin
            console.log('🗑️  DELETING NON-ADMIN USERS:')
            const usersDeleted = await User.destroy({
                where: {
                    role: {
                        [db.Sequelize.Op.notIn]: ['super_admin', 'hospital_admin']
                    }
                },
                transaction: t
            })
            console.log(`   ✓ Deleted ${usersDeleted} non-admin users`)
            console.log('')

            // Count after deletion
            const usersAfterCount = await User.count({ transaction: t })
            const campaignsAfterCount = await Campaign.count({ transaction: t })

            console.log('📊 AFTER CLEANUP:')
            console.log(`   Users: ${usersAfterCount} (kept super_admin & hospital_admin)`)
            console.log(`   Campaigns: ${campaignsAfterCount}`)
            console.log('')

            await t.commit()

            console.log('✅ CLEANUP COMPLETE!')
            console.log('')
            console.log('Summary:')
            console.log(`   - Deleted ${usersDeleted} regular users (kept super_admin & hospital_admin)`)
            console.log(`   - Deleted ${campaignsDeleted} campaigns`)
            console.log(`   - Deleted ${donationsDeleted} donations`)
            console.log(`   - Deleted ${disbursementsDeleted} disbursements`)
            console.log(`   - Deleted ${reciptsDeleted} receipts`)
            console.log(`   - Deleted ${transactionsDeleted} transactions`)
            console.log(`   - Deleted ${auditLogsDeleted} audit logs`)

            process.exit(0)
        } catch (error) {
            await t.rollback()
            throw error
        }
    } catch (error) {
        console.error('❌ Cleanup failed:', error.message)
        process.exit(1)
    }
}

cleanup()
