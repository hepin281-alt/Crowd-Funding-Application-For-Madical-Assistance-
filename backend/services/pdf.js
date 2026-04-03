import PDFDocument from 'pdfkit'

/**
 * Generate a beautifully formatted donation receipt PDF
 */
export function generateReceiptPDF(donationData) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margin: 50,
            })

            const chunks = []
            doc.on('data', chunk => chunks.push(chunk))
            doc.on('end', () => resolve(Buffer.concat(chunks)))
            doc.on('error', reject)

            // Header
            doc.fontSize(24).font('Helvetica-Bold').text('DONATION RECEIPT', { align: 'center' })
            doc.moveDown(0.3)
            doc.fontSize(10).fillColor('#999').text('Contribution to Medical Assistance Program', { align: 'center' })
            doc.moveDown()

            // Organization info
            doc.fontSize(11).fillColor('#000').font('Helvetica-Bold').text(donationData.organizationName || 'CareFund Medical Assistance')
            doc.fontSize(9).font('Helvetica').text('Medical Crowdfunding Platform', { align: 'left' })
            doc.text('Helping patients access medical treatment through community support')
            doc.moveDown()

            // Receipt details box
            const boxY = doc.y
            doc.rect(0, boxY, doc.page.width, 100).stroke('#0d9488')
            doc.fontSize(11).fillColor('#0d9488').font('Helvetica-Bold').text('Receipt Details', 20, boxY + 8)
            doc.fontSize(10).fillColor('#000').font('Helvetica')

            const detailsY = boxY + 28
            doc.text(`Receipt No: ${donationData.receiptNumber}`, 20, detailsY)
            doc.text(`Date: ${new Date(donationData.receiptDate).toLocaleDateString('en-IN')}`, 20, detailsY + 16)
            doc.text(`Amount: ₹${parseFloat(donationData.amount).toLocaleString('en-IN')}`, 20, detailsY + 32)
            doc.text(`Campaign: ${donationData.campaignName}`, 20, detailsY + 48)
            doc.moveDown(7)

            // Donor information
            doc.fontSize(11).font('Helvetica-Bold').text('DONOR INFORMATION', { underline: true })
            doc.fontSize(10).font('Helvetica').moveDown(0.2)
            doc.text(`Name: ${donationData.donorName}`)
            doc.text(`Email: ${donationData.donorEmail}`)
            if (donationData.donorPhone) doc.text(`Phone: ${donationData.donorPhone}`)
            if (donationData.panNumber) doc.text(`PAN: ${donationData.panNumber}`)
            doc.moveDown()

            // Campaign details
            doc.fontSize(11).font('Helvetica-Bold').text('CAMPAIGN DETAILS', { underline: true })
            doc.fontSize(10).font('Helvetica').moveDown(0.2)
            doc.text(`Patient: ${donationData.patientName}`)
            doc.text(`Medical Condition: ${donationData.medicalCondition}`)
            doc.text(`Hospital: ${donationData.hospitalName || 'TBD'}`)
            doc.moveDown()

            // Tax information
            if (donationData.tax80gEligible) {
                doc.fontSize(10).fillColor('#0d9488').font('Helvetica-Bold').text('✓ ELIGIBLE FOR 80G TAX DEDUCTION', { align: 'center' })
                doc.fontSize(8).fillColor('#666').font('Helvetica').text('This donation qualifies for tax deduction under Section 80G of the Indian Income Tax Act', { align: 'center' })
                doc.moveDown()
            }

            // Terms and conditions
            doc.fontSize(9).fillColor('#666').font('Helvetica')
            doc.text('Terms & Conditions:', { underline: true })
            doc.fontSize(8)
            doc.text('• This receipt is valid for tax purposes')
            doc.text('• Funds are held in escrow and released upon invoice verification')
            doc.text('• Donation is non-refundable once utilized in medical treatment')
            doc.text('• Utilization proof will be provided after funds are disbursed')
            doc.moveDown()

            // Footer
            doc.fontSize(8).fillColor('#999').text('Thank you for making a difference in someone\'s medical journey!', { align: 'center' })
            doc.text(`Generated on ${new Date().toLocaleString('en-IN')}`, { align: 'center' })

            doc.end()
        } catch (err) {
            reject(err)
        }
    })
}

/**
 * Generate a certificate of appreciation for donors
 */
export function generateCertificatePDF(certificateData) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                orientation: 'landscape',
                margin: 40,
            })

            const chunks = []
            doc.on('data', chunk => chunks.push(chunk))
            doc.on('end', () => resolve(Buffer.concat(chunks)))
            doc.on('error', reject)

            // Decorative border
            doc.lineWidth(3)
            doc.strokeColor('#0d9488')
            doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60).stroke()

            doc.lineWidth(1)
            doc.rect(35, 35, doc.page.width - 70, doc.page.height - 70).stroke()

            // Title
            doc.fontSize(36).fillColor('#0d9488').font('Helvetica-Bold').text('Certificate of Appreciation', {
                align: 'center',
                y: 100,
            })

            doc.moveDown(1)

            // Body text
            doc.fontSize(14).fillColor('#333').font('Helvetica').text('This certificate is proudly presented to', { align: 'center' })
            doc.moveDown(0.5)

            doc.fontSize(24).font('Helvetica-Bold').fillColor('#0d9488').text(certificateData.donorName, { align: 'center' })
            doc.moveDown(0.8)

            doc.fontSize(12).fillColor('#333').font('Helvetica')
            doc.text('For their generous contribution of', { align: 'center' })
            doc.moveDown(0.3)

            doc.fontSize(18).font('Helvetica-Bold').fillColor('#0d9488')
            doc.text(`₹${parseFloat(certificateData.amount).toLocaleString('en-IN')}`, { align: 'center' })
            doc.moveDown(0.3)

            doc.fontSize(12).fillColor('#333').font('Helvetica')
            doc.text('towards medical assistance for', { align: 'center' })
            doc.moveDown(0.3)

            doc.fontSize(14).font('Helvetica-Bold').text(certificateData.patientName, { align: 'center' })
            doc.moveDown(1)

            doc.fontSize(11).fillColor('#666').font('Helvetica')
            doc.text('Your compassion and generosity have made a meaningful difference in the life of a patient in need. This contribution exemplifies the spirit of community-driven healthcare support and reflects your commitment to helping others.', {
                align: 'center',
                width: 500,
            })

            doc.moveDown(1)

            // Certificate number
            doc.fontSize(10).fillColor('#999').text(`Certificate No: ${certificateData.certificateNumber}`, { align: 'center' })
            doc.text(`Date: ${new Date(certificateData.dateIssued).toLocaleDateString('en-IN')}`, { align: 'center' })

            doc.moveDown(1)

            // Signature line
            doc.lineWidth(1).strokeColor('#999')
            doc.lineTo(doc.page.width / 2 - 100, doc.y).lineTo(doc.page.width / 2 + 100, doc.y).stroke()
            doc.fontSize(10).fillColor('#333').text('Authorized Signatory', { align: 'center', y: doc.y + 5 })

            doc.end()
        } catch (err) {
            reject(err)
        }
    })
}

/**
 * Generate a utilization certificate showing how donation was used
 */
export function generateUtilizationCertificate(utilizationData) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margin: 50,
            })

            const chunks = []
            doc.on('data', chunk => chunks.push(chunk))
            doc.on('end', () => resolve(Buffer.concat(chunks)))
            doc.on('error', reject)

            // Header
            doc.fontSize(20).font('Helvetica-Bold').fillColor('#0d9488').text('UTILIZATION CERTIFICATE', { align: 'center' })
            doc.moveDown(0.5)
            doc.fontSize(10).fillColor('#999').text('Proof of Donation Utilization', { align: 'center' })
            doc.moveDown()

            // Main content
            doc.fontSize(11).fillColor('#000').font('Helvetica')
            doc.text(`This is to certify that the donation of ₹${parseFloat(utilizationData.amount).toLocaleString('en-IN')} received from ${utilizationData.donorName} has been successfully utilized for medical purposes.`)
            doc.moveDown()

            // Details table
            doc.fontSize(10).font('Helvetica-Bold').text('Utilization Details:', { underline: true })
            doc.moveDown(0.3)

            doc.fontSize(10).font('Helvetica')
            doc.text(`Patient Name: ${utilizationData.patientName}`)
            doc.text(`Hospital: ${utilizationData.hospitalName}`)
            doc.text(`Medical Condition: ${utilizationData.medicalCondition}`)
            doc.text(`Amount Utilized: ₹${parseFloat(utilizationData.amount).toLocaleString('en-IN')}`)
            doc.text(`Utilization Date: ${new Date(utilizationData.utilizationDate).toLocaleDateString('en-IN')}`)
            doc.text(`Invoice Reference: ${utilizationData.invoiceReference}`)
            doc.moveDown()

            // Tax information
            doc.fontSize(10).fillColor('#0d9488').font('Helvetica-Bold').text('Tax Benefits:')
            doc.fontSize(9).fillColor('#000').font('Helvetica')
            doc.text('This utilization certificate along with the original donation receipt can be used for tax deduction purposes under Section 80G of the Indian Income Tax Act, 1961.')
            doc.moveDown()

            // Signature line
            doc.moveTo(50, doc.y + 30).lineTo(200, doc.y + 30).stroke()
            doc.fontSize(9).text('Authorized Officer', { y: doc.y + 5 })

            doc.end()
        } catch (err) {
            reject(err)
        }
    })
}
