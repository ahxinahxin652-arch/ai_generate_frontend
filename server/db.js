// server/db.js
const { Sequelize } = require('sequelize');
const path = require('path');

// 桌面端推荐使用 SQLite 存储在本地，替代原 Flask 的配置
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '../database.sqlite'),
    logging: false
});

module.exports = { sequelize };