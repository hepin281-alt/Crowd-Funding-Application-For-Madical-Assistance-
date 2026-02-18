import { db, User, Hospital, Campaign, Donation } from '../models/index.js'
import dotenv from 'dotenv'

dotenv.config()

async function seed() {
  try {
    await db.authenticate()
    await db.sync({ alter: true })
    console.log('Database connected and synced')

    const existing = await User.findOne({ where: { email: 'employee@carefund.test' } })
    if (existing) {
      console.log('Seed data exists. Skipping.')
      process.exit(0)
    }

    const employee = await User.create({
      name: 'Platform Admin',
      email: 'employee@carefund.test',
      password: 'password123',
      role: 'employee',
      is_verified: true,
    })

    const donor = await User.create({
      name: 'Helper',
      email: 'donor@carefund.test',
      password: 'password123',
      role: 'donor',
    })

    const hospital1 = await Hospital.create({
      name: 'City General Hospital',
      address: '123 Medical Center Dr',
      city: 'Mumbai',
      license_number: 'MH-HOSP-001',
      admin_email: 'admin@citygeneral.gov.in',
      contact_phone: '+91-22-12345678',
      bank_account_name: 'City General Hospital Trust',
      bank_account_number: '1234567890123456',
      bank_name: 'State Bank of India',
      ifsc_swift_code: 'SBIN0001234',
      is_verified: true,
    })

    const hospital2 = await Hospital.create({
      name: 'Care Medical Institute',
      address: '456 Health Lane',
      city: 'Delhi',
      license_number: 'DL-HOSP-002',
      admin_email: 'billing@caremedical.in',
      contact_phone: '+91-11-87654321',
      bank_account_name: 'Care Medical Institute',
      bank_account_number: '9876543210987654',
      bank_name: 'HDFC Bank',
      ifsc_swift_code: 'HDFC0001234',
      is_verified: true,
    })

    const hospitalAdmin = await User.create({
      name: 'Hospital Admin',
      email: 'hospital@carefund.test',
      password: 'password123',
      role: 'hospital_admin',
      hospital_id: hospital1.id,
      is_verified: true,
    })

    const campaigner = await User.create({
      name: 'Patient Family',
      email: 'campaigner@carefund.test',
      password: 'password123',
      role: 'campaigner',
    })

    const campaign = await Campaign.create({
      patient_name: 'Raj Kumar',
      description: 'Heart surgery required. Family needs financial support.',
      target_amount: 500000,
      raised_amount: 150000,
      user_id: campaigner.id,
      hospital_id: hospital1.id,
      patient_ipd_number: 'IPD-2024-001',
      status: 'hospital_verified',
      verified_by_hospital_at: new Date(),
      verified_by_hospital_admin_id: hospitalAdmin.id,
      payout_mode: 'DIRECT_TO_HOSPITAL',
    })

    console.log('Seed complete.')
    console.log('--- Test Accounts ---')
    console.log('Platform Admin: employee@carefund.test / password123')
    console.log('Hospital Admin: hospital@carefund.test / password123')
    console.log('Campaigner: campaigner@carefund.test / password123')
    console.log('Donor: donor@carefund.test / password123')
    process.exit(0)
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
}

seed()
