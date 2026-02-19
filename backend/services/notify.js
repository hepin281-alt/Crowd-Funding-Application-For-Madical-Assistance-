/**
 * Notification service - sends emails/notifications
 * In production: integrate nodemailer, SendGrid, etc.
 */

export async function sendHospitalHandshake(hospitalEmail, campaignId, patientName) {
  const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/hospital/verify/${campaignId}`
  // In production: send actual email via nodemailer/SendGrid
  console.log(`[CareFund] Hospital Handshake - To: ${hospitalEmail}`)
  console.log(`  Campaign for Patient "${patientName}" - Verify at: ${verifyUrl}`)
  return true
}

export async function sendReceiptToDonor(donorEmail, campaignId, amount, proofUrl) {
  console.log(`[CareFund] Receipt to donor ${donorEmail}: $${amount} utilized for campaign ${campaignId}`)
  return true
}
