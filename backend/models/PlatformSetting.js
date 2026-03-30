import { DataTypes } from 'sequelize'
import db from '../config/database.js'

const PlatformSetting = db.define(
    'PlatformSetting',
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        key: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        value: {
            type: DataTypes.JSONB,
            allowNull: false,
            defaultValue: {},
        },
    },
    {
        tableName: 'platform_settings',
        timestamps: true,
        underscored: true,
    }
)

export default PlatformSetting
