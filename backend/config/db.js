import { db } from '../models/index.js'

const connectDB = async () => {
  try {
    await db.authenticate()
    console.log('PostgreSQL connected')
    await db.sync({ alter: true })
    console.log('Database synced')
  } catch (err) {
    console.error('Database connection error:', err.message)
    process.exit(1)
  }
}

export default connectDB
