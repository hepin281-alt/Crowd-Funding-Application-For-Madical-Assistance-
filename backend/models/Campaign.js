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
    hospital_id: { type: DataTypes.INTEGER, allowNull: true },
    custom_hospital_name: { type: DataTypes.STRING, allowNull: true },
    campaign_title: { type: DataTypes.STRING, allowNull: true },
    patient_name: { type: DataTypes.STRING, allowNull: false },
    patient_relationship: { type: DataTypes.STRING, allowNull: true },
    medical_condition: { type: DataTypes.STRING, allowNull: true },
    treating_doctor_name: { type: DataTypes.STRING, allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: false },
    patient_ipd_number: { type: DataTypes.STRING, allowNull: true },
    target_amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    raised_amount: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
    deadline: { type: DataTypes.DATE, allowNull: true },
    cover_image_url: { type: DataTypes.STRING, allowNull: true },
    medical_bill_url: { type: DataTypes.STRING, allowNull: true },
    patient_identity_proof_url: { type: DataTypes.STRING, allowNull: true },
    bank_account_holder_name: { type: DataTypes.STRING, allowNull: true },
    bank_account_number: { type: DataTypes.STRING, allowNull: true },
    bank_ifsc_code: { type: DataTypes.STRING, allowNull: true },
    payout_mode: {
      type: DataTypes.ENUM('DIRECT_TO_HOSPITAL', 'PERSONAL_ACCOUNT'),
      defaultValue: 'DIRECT_TO_HOSPITAL',
    },
    status: {
      type: DataTypes.ENUM(
        'draft',
        'pending_hospital_verification',
        'hospital_verified',
        'rejected',
        'active',
        'completed'
      ),
      defaultValue: 'draft',
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
