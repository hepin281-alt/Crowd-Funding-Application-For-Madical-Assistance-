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
    bank_account_number: { type: DataTypes.STRING, allowNull: false },
    ifsc_swift_code: { type: DataTypes.STRING, allowNull: true },
    admin_email: { type: DataTypes.STRING, allowNull: false },
    address: { type: DataTypes.TEXT, allowNull: true },
    city: { type: DataTypes.STRING, allowNull: true },
    contact_phone: { type: DataTypes.STRING, allowNull: true },
    bank_account_name: { type: DataTypes.STRING, allowNull: true },
    bank_name: { type: DataTypes.STRING, allowNull: true },
    is_verified: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    tableName: 'hospitals',
    timestamps: true,
    underscored: true,
  }
)

export default Hospital
