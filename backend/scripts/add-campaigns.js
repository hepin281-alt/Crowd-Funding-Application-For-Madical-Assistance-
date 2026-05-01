import dotenv from 'dotenv'
import db from '../config/database.js'
import { User, Campaign, Hospital } from '../models/index.js'

dotenv.config()

async function addDummyCampaigns() {
    try {
        await db.authenticate()
        console.log('✓ Database connected')
        console.log('')

        // Get or create campaigner user
        let campaigner = await User.findOne({
            where: { email: 'campaigner@carefund.test' }
        })

        if (!campaigner) {
            console.log('Creating campaigner user...')
            campaigner = await User.create({
                name: 'Test Campaigner',
                email: 'campaigner@carefund.test',
                password: 'password123',
                role: 'user',
                is_verified: true,
            })
        }

        // Get or create a hospital
        let hospital = await Hospital.findOne({
            where: { status: 'APPROVED' }
        })

        if (!hospital) {
            console.log('Creating test hospital...')
            hospital = await Hospital.create({
                name: 'Test General Hospital',
                address: '123 Medical Center Dr',
                city: 'Mumbai',
                state: 'Maharashtra',
                license_number: 'TEST-HOSP-001',
                admin_email: 'admin@testhospital.com',
                contact_phone: '+91-22-12345678',
                bank_account_name: 'Test Hospital Trust',
                bank_account_number: '1234567890123456',
                bank_name: 'State Bank of India',
                ifsc_swift_code: 'SBIN0001234',
                status: 'APPROVED',
                is_verified: true,
            })
        }

        // Get hospital admin if available
        const hospitalAdmin = await User.findOne({
            where: {
                role: 'hospital_admin',
                hospital_id: hospital.id
            }
        })

        const dummyCampaigns = [
            {
                patient_name: 'Vikas Sharma',
                campaign_title: 'Brain Tumor Surgery Fund',
                description: 'Urgent brain tumor surgery required for complete recovery and normal life.',
                medical_condition: 'Brain tumor - glioblastoma',
                treating_doctor_name: 'Dr. Vikram Sharma',
                target_amount: 750000,
                raised_amount: 0,
                user_id: campaigner.id,
                hospital_id: hospital.id,
                status: 'active',
                verified_by_hospital_at: new Date(),
                verified_by_hospital_admin_id: hospitalAdmin?.id,
                payout_mode: 'DIRECT_TO_HOSPITAL',
            },
            {
                patient_name: 'Deepika Patel',
                campaign_title: 'Joint Replacement Surgery',
                description: 'Both knee replacement needed for mobility restoration and pain relief.',
                medical_condition: 'Bilateral knee osteoarthritis',
                treating_doctor_name: 'Dr. Amitesh Kumar',
                target_amount: 550000,
                raised_amount: 0,
                user_id: campaigner.id,
                hospital_id: hospital.id,
                status: 'active',
                verified_by_hospital_at: new Date(),
                verified_by_hospital_admin_id: hospitalAdmin?.id,
                payout_mode: 'DIRECT_TO_HOSPITAL',
            },
            {
                patient_name: 'Rahul Gupta',
                campaign_title: 'Cancer Immunotherapy Treatment',
                description: 'Advanced immunotherapy treatment for stage 3 cancer to improve survival chances.',
                medical_condition: 'Metastatic cancer - stage 3',
                treating_doctor_name: 'Dr. Ravi Malhotra',
                target_amount: 850000,
                raised_amount: 0,
                user_id: campaigner.id,
                hospital_id: hospital.id,
                status: 'active',
                verified_by_hospital_at: new Date(),
                verified_by_hospital_admin_id: hospitalAdmin?.id,
                payout_mode: 'DIRECT_TO_HOSPITAL',
            },
            {
                patient_name: 'Neha Singh',
                campaign_title: 'Cardiac Transplant Preparation',
                description: 'Heart transplant arranged. Need support for pre-operative tests and medications.',
                medical_condition: 'End-stage heart failure - awaiting transplant',
                treating_doctor_name: 'Dr. Sampath Menon',
                target_amount: 950000,
                raised_amount: 0,
                user_id: campaigner.id,
                hospital_id: hospital.id,
                status: 'active',
                verified_by_hospital_at: new Date(),
                verified_by_hospital_admin_id: hospitalAdmin?.id,
                payout_mode: 'DIRECT_TO_HOSPITAL',
            },
            {
                patient_name: 'Arjun Reddy',
                campaign_title: 'Gastric Bypass Surgery',
                description: 'Weight loss surgery to manage severe obesity and related health complications.',
                medical_condition: 'Severe obesity with diabetes',
                treating_doctor_name: 'Dr. Suresh Verma',
                target_amount: 450000,
                raised_amount: 0,
                user_id: campaigner.id,
                hospital_id: hospital.id,
                status: 'active',
                verified_by_hospital_at: new Date(),
                verified_by_hospital_admin_id: hospitalAdmin?.id,
                payout_mode: 'DIRECT_TO_HOSPITAL',
            },
        ]

        console.log('🚀 Adding 5 dummy campaigns...')
        console.log('')

        let created = 0
        for (const campaignData of dummyCampaigns) {
            const existing = await Campaign.findOne({
                where: {
                    patient_name: campaignData.patient_name,
                    hospital_id: campaignData.hospital_id
                }
            })

            if (!existing) {
                await Campaign.create(campaignData)
                console.log(`✓ Created campaign: ${campaignData.campaign_title}`)
                created++
            } else {
                console.log(`⊘ Skipped (already exists): ${campaignData.campaign_title}`)
            }
        }

        console.log('')
        console.log(`✅ COMPLETE! Added ${created} new campaigns`)
        console.log('')
        console.log(`Hospital: ${hospital.name}`)
        console.log(`Campaigner: ${campaigner.email}`)
        console.log('')

        process.exit(0)
    } catch (error) {
        console.error('❌ Error:', error.message)
        process.exit(1)
    }
}

addDummyCampaigns()
