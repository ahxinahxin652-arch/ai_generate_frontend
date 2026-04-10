// server/models/face.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const Face = sequelize.define('Face', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    age: { type: DataTypes.STRING, allowNull: true },
    country: { type: DataTypes.STRING, allowNull: true },
    hair: { type: DataTypes.STRING, allowNull: true },
    hair_color: { type: DataTypes.STRING, allowNull: true },
    face_type: { type: DataTypes.STRING, allowNull: true },
    expression: { type: DataTypes.STRING, allowNull: true },
    dimple: { type: DataTypes.INTEGER, defaultValue: 0 },
    sex: { type: DataTypes.INTEGER, defaultValue: 1 },
    eye_color: { type: DataTypes.STRING, allowNull: true },
    skin: { type: DataTypes.INTEGER, defaultValue: 50 },
    skin_color: { type: DataTypes.STRING, allowNull: true },
    skin_detail: { type: DataTypes.INTEGER, defaultValue: 50 },
    mole: { type: DataTypes.INTEGER, defaultValue: 0 },
    light_type: { type: DataTypes.STRING, allowNull: true },
    light_direction: { type: DataTypes.STRING, allowNull: true },
    status: { type: DataTypes.STRING, defaultValue: 'PENDING' },
    wanxiang_task_id: { type: DataTypes.STRING, allowNull: true },
    result_url: { type: DataTypes.STRING, allowNull: true }
}, {
    tableName: 'faces',
    timestamps: true // 自动添加 createdAt 和 updatedAt
});

module.exports = Face;