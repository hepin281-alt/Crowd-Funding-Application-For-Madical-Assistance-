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

    // Create multiple hospitals across different cities
    const hospital1 = await Hospital.create({
      name: 'City General Hospital',
      address: '123 Medical Center Dr, Andheri',
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
      address: '456 Health Lane, Connaught Place',
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

    const hospital3 = await Hospital.create({
      name: 'Apollo Hospitals',
      address: '21 Greams Lane, Thousand Lights',
      city: 'Chennai',
      license_number: 'TN-HOSP-003',
      admin_email: 'admin@apollochennai.com',
      contact_phone: '+91-44-28293333',
      bank_account_name: 'Apollo Hospitals Enterprise Ltd',
      bank_account_number: '5678901234567890',
      bank_name: 'ICICI Bank',
      ifsc_swift_code: 'ICIC0001234',
      is_verified: true,
    })

    const hospital4 = await Hospital.create({
      name: 'Fortis Hospital',
      address: '154/9, Bannerghatta Road',
      city: 'Bangalore',
      license_number: 'KA-HOSP-004',
      admin_email: 'admin@fortisbangalore.com',
      contact_phone: '+91-80-66214444',
      bank_account_name: 'Fortis Healthcare Ltd',
      bank_account_number: '3456789012345678',
      bank_name: 'Axis Bank',
      ifsc_swift_code: 'UTIB0001234',
      is_verified: true,
    })

    const hospital5 = await Hospital.create({
      name: 'Manipal Hospital',
      address: '98, HAL Airport Road',
      city: 'Bangalore',
      license_number: 'KA-HOSP-005',
      admin_email: 'admin@manipalbangalore.com',
      contact_phone: '+91-80-25023456',
      bank_account_name: 'Manipal Hospitals India Pvt Ltd',
      bank_account_number: '7890123456789012',
      bank_name: 'Kotak Mahindra Bank',
      ifsc_swift_code: 'KKBK0001234',
      is_verified: true,
    })

    const hospital6 = await Hospital.create({
      name: 'Max Super Speciality Hospital',
      address: '1, Press Enclave Road, Saket',
      city: 'Delhi',
      license_number: 'DL-HOSP-006',
      admin_email: 'admin@maxsaket.com',
      contact_phone: '+91-11-26515050',
      bank_account_name: 'Max Healthcare Institute Ltd',
      bank_account_number: '2345678901234567',
      bank_name: 'HDFC Bank',
      ifsc_swift_code: 'HDFC0005678',
      is_verified: true,
    })

    const hospital7 = await Hospital.create({
      name: 'Lilavati Hospital',
      address: 'A-791, Bandra Reclamation',
      city: 'Mumbai',
      license_number: 'MH-HOSP-007',
      admin_email: 'admin@lilavatihospital.com',
      contact_phone: '+91-22-26567891',
      bank_account_name: 'Lilavati Hospital and Research Centre',
      bank_account_number: '6789012345678901',
      bank_name: 'State Bank of India',
      ifsc_swift_code: 'SBIN0005678',
      is_verified: true,
    })

    const hospital8 = await Hospital.create({
      name: 'AIIMS Delhi',
      address: 'Ansari Nagar, Sri Aurobindo Marg',
      city: 'Delhi',
      license_number: 'DL-HOSP-008',
      admin_email: 'admin@aiims.edu',
      contact_phone: '+91-11-26588500',
      bank_account_name: 'All India Institute of Medical Sciences',
      bank_account_number: '8901234567890123',
      bank_name: 'State Bank of India',
      ifsc_swift_code: 'SBIN0009876',
      is_verified: true,
    })

    const hospital9 = await Hospital.create({
      name: 'Narayana Health City',
      address: '258/A, Bommasandra Industrial Area',
      city: 'Bangalore',
      license_number: 'KA-HOSP-009',
      admin_email: 'admin@narayanahealthcity.com',
      contact_phone: '+91-80-71222222',
      bank_account_name: 'Narayana Hrudayalaya Ltd',
      bank_account_number: '4567890123456789',
      bank_name: 'ICICI Bank',
      ifsc_swift_code: 'ICIC0005678',
      is_verified: true,
    })

    const hospital10 = await Hospital.create({
      name: 'Ruby Hall Clinic',
      address: '40, Sassoon Road, Pune',
      city: 'Pune',
      license_number: 'MH-HOSP-010',
      admin_email: 'admin@rubyhall.com',
      contact_phone: '+91-20-26163000',
      bank_account_name: 'Ruby Hall Clinic',
      bank_account_number: '1357924680135792',
      bank_name: 'HDFC Bank',
      ifsc_swift_code: 'HDFC0009876',
      is_verified: true,
    })

    const hospital11 = await Hospital.create({
      name: 'Medanta - The Medicity',
      address: 'Sector 38, Gurgaon',
      city: 'Gurgaon',
      license_number: 'HR-HOSP-011',
      admin_email: 'admin@medanta.org',
      contact_phone: '+91-124-4141414',
      bank_account_name: 'Global Health Pvt Ltd',
      bank_account_number: '2468013579246801',
      bank_name: 'Axis Bank',
      ifsc_swift_code: 'UTIB0009876',
      is_verified: true,
    })

    const hospital12 = await Hospital.create({
      name: 'Kokilaben Dhirubhai Ambani Hospital',
      address: 'Rao Saheb Achutrao Patwardhan Marg, Four Bungalows',
      city: 'Mumbai',
      license_number: 'MH-HOSP-012',
      admin_email: 'admin@kokilabenhospital.com',
      contact_phone: '+91-22-30999999',
      bank_account_name: 'Kokilaben Dhirubhai Ambani Hospital',
      bank_account_number: '9876543210987654',
      bank_name: 'ICICI Bank',
      ifsc_swift_code: 'ICIC0009876',
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
    console.log('\n--- Hospitals Created ---')
    console.log('12 verified hospitals across major cities:')
    console.log('- Mumbai: City General, Lilavati, Kokilaben Ambani')
    console.log('- Delhi: Care Medical, Max Saket, AIIMS')
    console.log('- Bangalore: Fortis, Manipal, Narayana Health')
    console.log('- Chennai: Apollo')
    console.log('- Pune: Ruby Hall')
    console.log('- Gurgaon: Medanta')
    console.log('\n--- Test Accounts ---')
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
