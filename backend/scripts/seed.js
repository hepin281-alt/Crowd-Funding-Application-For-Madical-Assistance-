import { db, User, Hospital, Campaign, Donation } from '../models/index.js'
import dotenv from 'dotenv'

dotenv.config()

async function seed() {
  try {
    await db.authenticate()
    await db.sync({ alter: true })
    console.log('Database connected and synced')

    const ensureUser = async (data) => {
      const existing = await User.findOne({ where: { email: data.email } })
      if (existing) return existing
      return User.create(data)
    }

    const ensureHospital = async (data) => {
      const existing = await Hospital.findOne({ where: { name: data.name } })
      if (existing) return existing
      return Hospital.create(data)
    }

    const donor = await ensureUser({
      name: 'Helper',
      email: 'donor@carefund.test',
      password: 'password123',
      role: 'user',
    })

    const campaigner = await ensureUser({
      name: 'Campaigner',
      email: 'campaigner@carefund.test',
      password: 'password123',
      role: 'user',
    })

    // Create multiple hospitals across different cities
    const hospital1 = await ensureHospital({
      name: 'City General Hospital',
      address: '123 Medical Center Dr, Andheri',
      city: 'Mumbai',
      state: 'Maharashtra',
      license_number: 'MH-HOSP-001',
      admin_email: 'admin@citygeneral.gov.in',
      contact_phone: '+91-22-12345678',
      bank_account_name: 'City General Hospital Trust',
      bank_account_number: '1234567890123456',
      bank_name: 'State Bank of India',
      ifsc_swift_code: 'SBIN0001234',
      status: 'APPROVED',
      is_verified: true,
    })

    const cityGeneralAdmin = await User.findOne({ where: { email: 'admin@citygeneral.gov.in' } })
    if (cityGeneralAdmin) {
      await cityGeneralAdmin.update({
        name: 'City General Hospital Admin',
        password: 'password123',
        role: 'hospital_admin',
        hospital_name: hospital1.name,
        license_number: hospital1.license_number,
        hospital_phone: hospital1.contact_phone,
        hospital_id: hospital1.id,
        is_verified: true,
      })
    } else {
      await User.create({
        name: 'City General Hospital Admin',
        email: 'admin@citygeneral.gov.in',
        password: 'password123',
        role: 'hospital_admin',
        hospital_name: hospital1.name,
        license_number: hospital1.license_number,
        hospital_phone: hospital1.contact_phone,
        hospital_id: hospital1.id,
        is_verified: true,
      })
    }

    const hospital2 = await ensureHospital({
      name: 'Care Medical Institute',
      address: '456 Health Lane, Connaught Place',
      city: 'Delhi',
      state: 'Delhi',
      license_number: 'DL-HOSP-002',
      admin_email: 'billing@caremedical.in',
      contact_phone: '+91-11-87654321',
      bank_account_name: 'Care Medical Institute',
      bank_account_number: '9876543210987654',
      bank_name: 'HDFC Bank',
      ifsc_swift_code: 'HDFC0001234',
      status: 'APPROVED',
      is_verified: true,
    })

    const hospital3 = await ensureHospital({
      name: 'Apollo Hospitals',
      address: '21 Greams Lane, Thousand Lights',
      city: 'Chennai',
      state: 'Tamil Nadu',
      license_number: 'TN-HOSP-003',
      admin_email: 'admin@apollochennai.com',
      contact_phone: '+91-44-28293333',
      bank_account_name: 'Apollo Hospitals Enterprise Ltd',
      bank_account_number: '5678901234567890',
      bank_name: 'ICICI Bank',
      ifsc_swift_code: 'ICIC0001234',
      status: 'APPROVED',
      is_verified: true,
    })

    const hospital4 = await ensureHospital({
      name: 'Fortis Hospital',
      address: '154/9, Bannerghatta Road',
      city: 'Bangalore',
      state: 'Karnataka',
      license_number: 'KA-HOSP-004',
      admin_email: 'admin@fortisbangalore.com',
      contact_phone: '+91-80-66214444',
      bank_account_name: 'Fortis Healthcare Ltd',
      bank_account_number: '3456789012345678',
      bank_name: 'Axis Bank',
      ifsc_swift_code: 'UTIB0001234',
      status: 'APPROVED',
      is_verified: true,
    })

    const hospital5 = await ensureHospital({
      name: 'Manipal Hospital',
      address: '98, HAL Airport Road',
      city: 'Bangalore',
      state: 'Karnataka',
      license_number: 'KA-HOSP-005',
      admin_email: 'admin@manipalbangalore.com',
      contact_phone: '+91-80-25023456',
      bank_account_name: 'Manipal Hospitals India Pvt Ltd',
      bank_account_number: '7890123456789012',
      bank_name: 'Kotak Mahindra Bank',
      ifsc_swift_code: 'KKBK0001234',
      status: 'APPROVED',
      is_verified: true,
    })

    const hospital6 = await ensureHospital({
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

    const hospital7 = await ensureHospital({
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

    const hospital8 = await ensureHospital({
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

    const hospital9 = await ensureHospital({
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

    const hospital10 = await ensureHospital({
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

    const hospital11 = await ensureHospital({
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

    const hospital12 = await ensureHospital({
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

    const hospital13 = await ensureHospital({
      name: 'Jaslok Hospital',
      address: '15, Dr. G Deshmukh Marg, Pedder Road',
      city: 'Mumbai',
      license_number: 'MH-HOSP-013',
      admin_email: 'admin@jaslok.org',
      contact_phone: '+91-22-66573000',
      bank_account_name: 'Jaslok Hospital and Research Centre',
      bank_account_number: '3210987654321098',
      bank_name: 'State Bank of India',
      ifsc_swift_code: 'SBIN0012345',
      is_verified: true,
    })

    const hospital14 = await ensureHospital({
      name: 'Sri Ramachandra Medical Centre',
      address: '1, Ramachandra Nagar, Porur',
      city: 'Chennai',
      license_number: 'TN-HOSP-014',
      admin_email: 'admin@sriramachandra.edu',
      contact_phone: '+91-44-24768000',
      bank_account_name: 'Sri Ramachandra Medical Centre',
      bank_account_number: '4321098765432109',
      bank_name: 'HDFC Bank',
      ifsc_swift_code: 'HDFC0012345',
      is_verified: true,
    })

    const hospital15 = await ensureHospital({
      name: 'Aster CMI Hospital',
      address: '43/2, Bellary Road, Hebbal',
      city: 'Bangalore',
      license_number: 'KA-HOSP-015',
      admin_email: 'admin@asterbangalore.com',
      contact_phone: '+91-80-43420100',
      bank_account_name: 'Aster CMI Hospital',
      bank_account_number: '5432109876543210',
      bank_name: 'Axis Bank',
      ifsc_swift_code: 'UTIB0012345',
      is_verified: true,
    })

    const hospital16 = await ensureHospital({
      name: 'KIMS Hospital',
      address: '1-8-31/1, Minister Road',
      city: 'Hyderabad',
      license_number: 'TS-HOSP-016',
      admin_email: 'admin@kimshospitals.com',
      contact_phone: '+91-40-44885000',
      bank_account_name: 'KIMS Hospitals Pvt Ltd',
      bank_account_number: '6543210987654321',
      bank_name: 'ICICI Bank',
      ifsc_swift_code: 'ICIC0012345',
      is_verified: true,
    })

    const hospital17 = await ensureHospital({
      name: 'Sterling Hospitals',
      address: 'Sterling Hospital Road, Memnagar',
      city: 'Ahmedabad',
      license_number: 'GJ-HOSP-017',
      admin_email: 'admin@sterlinghospitals.com',
      contact_phone: '+91-79-40011111',
      bank_account_name: 'Sterling Hospitals Pvt Ltd',
      bank_account_number: '7654321098765432',
      bank_name: 'Kotak Mahindra Bank',
      ifsc_swift_code: 'KKBK0012345',
      is_verified: true,
    })

    const hospitalAdmin = await ensureUser({
      name: 'Hospital Admin',
      email: 'hospital@carefund.test',
      password: 'password123',
      role: 'hospital_admin',
      hospital_name: hospital1.name,
      license_number: hospital1.license_number,
      hospital_phone: hospital1.contact_phone,
      is_verified: true,
    })

    const demoAdmin = await ensureUser({
      name: 'Super Admin Demo',
      email: 'admin2@carefund.test',
      password: 'password123',
      role: 'super_admin',
      is_verified: true,
    })

    const demoHospitalAdmin = await ensureUser({
      name: 'Hospital Admin Demo',
      email: 'hospital2@carefund.test',
      password: 'password123',
      role: 'hospital_admin',
      hospital_name: hospital2.name,
      license_number: hospital2.license_number,
      hospital_phone: hospital2.contact_phone,
      is_verified: true,
    })

    // Create hospital admin accounts for all remaining hospitals
    const hospitalAdmins = [
      { email: 'hospital3@carefund.test', hospital: hospital3 },
      { email: 'hospital4@carefund.test', hospital: hospital4 },
      { email: 'hospital5@carefund.test', hospital: hospital5 },
      { email: 'hospital6@carefund.test', hospital: hospital6 },
      { email: 'hospital7@carefund.test', hospital: hospital7 },
      { email: 'hospital8@carefund.test', hospital: hospital8 },
      { email: 'hospital9@carefund.test', hospital: hospital9 },
      { email: 'hospital10@carefund.test', hospital: hospital10 },
      { email: 'hospital11@carefund.test', hospital: hospital11 },
      { email: 'hospital12@carefund.test', hospital: hospital12 },
      { email: 'hospital13@carefund.test', hospital: hospital13 },
      { email: 'hospital14@carefund.test', hospital: hospital14 },
      { email: 'hospital15@carefund.test', hospital: hospital15 },
      { email: 'hospital16@carefund.test', hospital: hospital16 },
      { email: 'hospital17@carefund.test', hospital: hospital17 },
    ]

    for (const adminData of hospitalAdmins) {
      await ensureUser({
        name: `Hospital Admin - ${adminData.hospital.name}`,
        email: adminData.email,
        password: 'password123',
        role: 'hospital_admin',
        hospital_name: adminData.hospital.name,
        license_number: adminData.hospital.license_number,
        hospital_phone: adminData.hospital.contact_phone,
        is_verified: true,
      })
    }


    const seededCampaigns = [
      {
        patient_name: 'Raj Kumar',
        campaign_title: 'Emergency Heart Surgery Support',
        description: 'Heart surgery required. Family needs financial support.',
        medical_condition: 'Cardiac bypass surgery',
        treating_doctor_name: 'Dr. Neha Sharma',
        target_amount: 500000,
        raised_amount: 150000,
        user_id: campaigner.id,
        hospital_id: hospital1.id,
        patient_ipd_number: 'IPD-2024-001',
        status: 'hospital_verified',
        verified_by_hospital_at: new Date(),
        verified_by_hospital_admin_id: hospitalAdmin.id,
        payout_mode: 'DIRECT_TO_HOSPITAL',
      },
      {
        patient_name: 'Aisha Khan',
        campaign_title: 'Critical NICU Care for Newborn',
        description: 'Support needed for prolonged NICU care and treatment.',
        medical_condition: 'Premature birth complications',
        treating_doctor_name: 'Dr. Kavita Rao',
        target_amount: 320000,
        raised_amount: 0,
        user_id: campaigner.id,
        hospital_id: hospital1.id,
        status: 'pending_hospital_verification',
        payout_mode: 'DIRECT_TO_HOSPITAL',
      },
      {
        patient_name: 'Rohan Das',
        campaign_title: 'Road Accident Trauma Recovery',
        description: 'Funds required for surgeries and rehabilitation after severe trauma.',
        medical_condition: 'Polytrauma with fractures',
        treating_doctor_name: 'Dr. Arvind Menon',
        target_amount: 450000,
        raised_amount: 275000,
        user_id: campaigner.id,
        hospital_id: hospital1.id,
        patient_ipd_number: 'IPD-2024-021',
        status: 'active',
        verified_by_hospital_at: new Date(),
        verified_by_hospital_admin_id: hospitalAdmin.id,
        payout_mode: 'DIRECT_TO_HOSPITAL',
      },
      {
        patient_name: 'Meera Iyer',
        campaign_title: 'Leukemia Chemotherapy Fund',
        description: 'Ongoing chemotherapy cycles need urgent financial support.',
        medical_condition: 'Acute lymphoblastic leukemia',
        treating_doctor_name: 'Dr. Sameer Patil',
        target_amount: 600000,
        raised_amount: 620000,
        user_id: campaigner.id,
        hospital_id: hospital1.id,
        patient_ipd_number: 'IPD-2024-034',
        status: 'completed',
        verified_by_hospital_at: new Date(),
        verified_by_hospital_admin_id: hospitalAdmin.id,
        payout_mode: 'DIRECT_TO_HOSPITAL',
      },
      {
        patient_name: 'Sanjay Nair',
        campaign_title: 'Kidney Failure Dialysis Support',
        description: 'Need recurring dialysis support and medication assistance.',
        medical_condition: 'Chronic kidney disease - stage 5',
        treating_doctor_name: 'Dr. Priyanka Bose',
        target_amount: 380000,
        raised_amount: 180000,
        user_id: campaigner.id,
        hospital_id: hospital1.id,
        status: 'needs_info',
        hospital_admin_note: 'Please re-upload latest lab report and signed treatment estimate.',
        verified_by_hospital_admin_id: hospitalAdmin.id,
        payout_mode: 'DIRECT_TO_HOSPITAL',
      },
      {
        patient_name: 'Pooja Verma',
        campaign_title: 'Spinal Surgery for Recovery',
        description: 'Campaign rejected due to incomplete and inconsistent records.',
        medical_condition: 'Lumbar disc prolapse',
        treating_doctor_name: 'Dr. Kunal Joshi',
        target_amount: 290000,
        raised_amount: 0,
        user_id: campaigner.id,
        hospital_id: hospital1.id,
        status: 'rejected',
        rejection_reason: 'Submitted documents could not be verified with hospital records.',
        verified_by_hospital_admin_id: hospitalAdmin.id,
        payout_mode: 'DIRECT_TO_HOSPITAL',
      },
      {
        patient_name: 'Imran Ali',
        campaign_title: 'Liver Procedure Assistance',
        description: 'Family seeks support for urgent liver intervention.',
        medical_condition: 'Liver cirrhosis complications',
        treating_doctor_name: 'Dr. Farah Siddiqui',
        target_amount: 420000,
        raised_amount: 0,
        user_id: campaigner.id,
        hospital_id: hospital2.id,
        status: 'pending_hospital_verification',
        payout_mode: 'DIRECT_TO_HOSPITAL',
      },
    ]

    for (const campaignData of seededCampaigns) {
      const existingCampaign = await Campaign.findOne({
        where: { patient_name: campaignData.patient_name, hospital_id: campaignData.hospital_id },
      })
      if (!existingCampaign) {
        await Campaign.create(campaignData)
      }
    }

    console.log('Seed complete.')
    console.log('\n--- Hospitals Created ---')
    console.log('17 verified hospitals across major cities:')
    console.log('- Mumbai: City General, Lilavati, Kokilaben Ambani')
    console.log('- Delhi: Care Medical, Max Saket, AIIMS')
    console.log('- Bangalore: Fortis, Manipal, Narayana Health')
    console.log('- Chennai: Apollo, Sri Ramachandra')
    console.log('- Pune: Ruby Hall')
    console.log('- Gurgaon: Medanta')
    console.log('- Mumbai: Jaslok')
    console.log('- Bangalore: Aster CMI')
    console.log('- Hyderabad: KIMS')
    console.log('- Ahmedabad: Sterling')
    console.log('\n--- Test Accounts ---')
    console.log('Platform Operations: employee@carefund.test / password123')
    console.log('Super Admin (Demo): admin2@carefund.test / password123')
    console.log('\n--- Hospital Admin Accounts (All 17 Hospitals) ---')
    console.log('admin@citygeneral.gov.in / password123 (City General Hospital, Mumbai)')
    console.log('hospital2@carefund.test / password123 (Care Medical Institute, Delhi)')
    console.log('hospital3@carefund.test / password123 (Apollo Hospitals, Chennai)')
    console.log('hospital4@carefund.test / password123 (Fortis Hospital, Bangalore)')
    console.log('hospital5@carefund.test / password123 (Manipal Hospital, Bangalore)')
    console.log('hospital6@carefund.test / password123 (Max Super Speciality Hospital, Delhi)')
    console.log('hospital7@carefund.test / password123 (Lilavati Hospital, Mumbai)')
    console.log('hospital8@carefund.test / password123 (AIIMS Delhi, Delhi)')
    console.log('hospital9@carefund.test / password123 (Narayana Health City, Bangalore)')
    console.log('hospital10@carefund.test / password123 (Ruby Hall Clinic, Pune)')
    console.log('hospital11@carefund.test / password123 (Medanta - The Medicity, Gurgaon)')
    console.log('hospital12@carefund.test / password123 (Kokilaben Dhirubhai Ambani Hospital, Mumbai)')
    console.log('hospital13@carefund.test / password123 (Jaslok Hospital, Mumbai)')
    console.log('hospital14@carefund.test / password123 (Sri Ramachandra Medical Centre, Chennai)')
    console.log('hospital15@carefund.test / password123 (Aster CMI Hospital, Bangalore)')
    console.log('hospital16@carefund.test / password123 (KIMS Hospital, Hyderabad)')
    console.log('hospital17@carefund.test / password123 (Sterling Hospitals, Ahmedabad)')
    console.log('\n--- Other Test Accounts ---')
    console.log('User (Campaigner persona): campaigner@carefund.test / password123')
    console.log('User (Donor persona): donor@carefund.test / password123')
    console.log('\n--- Campaign Seed Summary ---')
    console.log('Added multiple campaigns with mixed statuses: pending, active, verified, completed, needs_info, rejected')
    process.exit(0)
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
}

seed()
