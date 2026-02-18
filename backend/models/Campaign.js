import { DataTypes } from 'sequelize'
import db from '../config/database.js'

const Campaign = db.define(
  'Campaign',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    hospital_id: { type: DataTypes.INTEGER, allowNull: false },
    patient_name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    patient_ipd_number: { type: DataTypes.STRING, allowNull: true },
    target_amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    raised_amount: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
    payout_mode: {
      type: DataTypes.ENUM('DIRECT_TO_HOSPITAL', 'PERSONAL_ACCOUNT'),
      defaultValue: 'DIRECT_TO_HOSPITAL',
    },
    status: {
      type: DataTypes.ENUM(
        'pending_hospital_verification',
        'hospital_verified',
        'rejected',
        'active',
        'completed'
      ),
      defaultValue: 'pending_hospital_verification',
    },
    hospital_handshake_sent_at: { type: DataTypes.DATE, allowNull: true },
    verified_by_hospital_at: { type: DataTypes.DATE, allowNull: true },
    verified_by_hospital_admin_id: { type: DataTypes.INTEGER, allowNull: true },
    rejection_reason: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: 'campaigns',
    timestamps: true,
    underscored: true,
  }
)

export default Campaign
