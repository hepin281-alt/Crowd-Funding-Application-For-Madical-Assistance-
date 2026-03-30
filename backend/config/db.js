import { db } from '../models/index.js'

const connectDB = async () => {
  try {
    await db.authenticate()
    console.log('PostgreSQL connected')
    await db.sync({ alter: true })
    console.log('Database synced')

    // Enforce integrity for future writes while allowing legacy orphan rows to be repaired.
    await db.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'users_hospital_admin_requires_hospital_chk'
        ) THEN
          ALTER TABLE users
          ADD CONSTRAINT users_hospital_admin_requires_hospital_chk
          CHECK (role <> 'hospital_admin' OR hospital_id IS NOT NULL)
          NOT VALID;
        END IF;
      END
      $$;
    `)
    console.log('Database constraint ready: hospital_admin requires hospital_id')
  } catch (err) {
    console.error('Database connection error:', err.message)
    process.exit(1)
  }
}

export default connectDB
