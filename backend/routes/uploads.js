import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import { protect } from '../middleware/auth.js'

const router = express.Router()

const uploadDir = path.join(process.cwd(), 'uploads')
fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadDir)
    },
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname)
        const unique = `${Date.now()}-${crypto.randomUUID()}`
        cb(null, `${unique}${ext}`)
    },
})

const allowedTypes = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
])

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (!allowedTypes.has(file.mimetype)) {
            return cb(new Error('Only JPG, PNG, WEBP images or PDF files are allowed'))
        }
        return cb(null, true)
    },
})

router.post('/', protect, upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' })
    }
    const baseUrl = `${req.protocol}://${req.get('host')}`
    return res.json({
        url: `${baseUrl}/uploads/${req.file.filename}`,
        filename: req.file.originalname,
    })
})

export default router
