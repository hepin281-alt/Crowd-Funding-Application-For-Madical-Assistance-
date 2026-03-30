import { DataTypes } from 'sequelize'
import db from '../config/database.js'

const Hospital = db.define(
  'Hospital',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: { type: DataTypes.STRING, allowNull: false },
    license_number: { type: DataTypes.STRING, allowNull: true },
    status: {
      type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'),
      allowNull: false,
      defaultValue: 'PENDING',
    },
    bank_account_number: { type: DataTypes.STRING, allowNull: false },
    bank_details: { type: DataTypes.JSONB, allowNull: true },
    ifsc_swift_code: { type: DataTypes.STRING, allowNull: true },
    admin_email: { type: DataTypes.STRING, allowNull: false },
    address: { type: DataTypes.TEXT, allowNull: true },
    city: { type: DataTypes.STRING, allowNull: true },
    document_url: { type: DataTypes.STRING, allowNull: true },
    contact_phone: { type: DataTypes.STRING, allowNull: true },
    bank_account_name: { type: DataTypes.STRING, allowNull: true },
    bank_name: { type: DataTypes.STRING, allowNull: true },
    is_verified: { type: DataTypes.BOOLEAN, defaultValue: true },
    verified_at: { type: DataTypes.DATE, allowNull: true },
    verified_by_admin_id: { type: DataTypes.INTEGER, allowNull: true },
    rejection_reason: { type: DataTypes.TEXT, allowNull: true },
    suspended: { type: DataTypes.BOOLEAN, defaultValue: false },
    suspended_at: { type: DataTypes.DATE, allowNull: true },
    suspension_reason: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: 'hospitals',
    timestamps: true,
    underscored: true,
  }
)

export default Hospital
