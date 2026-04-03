import { DataTypes } from 'sequelize'
import db from '../config/database.js'
import bcrypt from 'bcryptjs'

const User = db.define(
  'User',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    role: {
      type: DataTypes.ENUM('user', 'hospital_admin', 'super_admin'),
      allowNull: false,
      defaultValue: 'user',
    },
    phone: { type: DataTypes.STRING, allowNull: true },
    hospital_id: { type: DataTypes.INTEGER, allowNull: true },
    hospital_name: { type: DataTypes.STRING, allowNull: true },
    license_number: { type: DataTypes.STRING, allowNull: true },
    hospital_phone: { type: DataTypes.STRING, allowNull: true },
    is_verified: { type: DataTypes.BOOLEAN, defaultValue: false },
    verification_code: { type: DataTypes.STRING, allowNull: true },
    verification_code_expires_at: { type: DataTypes.DATE, allowNull: true },
    reset_token: { type: DataTypes.STRING, allowNull: true },
    reset_token_expires_at: { type: DataTypes.DATE, allowNull: true },
    login_disabled: { type: DataTypes.BOOLEAN, defaultValue: false },
    last_seen_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'users',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeValidate: (user) => {
        const mustHaveHospitalId = user.role === 'hospital_admin' && (user.isNewRecord || user.changed('role') || user.changed('hospital_id'))
        if (mustHaveHospitalId && !user.hospital_id) {
          throw new Error('hospital_id is required for hospital_admin users')
        }
      },
      beforeSave: async (user) => {
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, 12)
        }
      },
    },
  }
)

User.prototype.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password)
}

User.prototype.toJSON = function () {
  const values = { ...this.get() }
  delete values.password
  return values
}

export default User
