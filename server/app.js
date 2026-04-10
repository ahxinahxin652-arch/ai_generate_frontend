// server/app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { sequelize } = require('./db');
const fs = require('fs');
const path = require('path');

const app = express();

// 配置 CORS (替代 flask_cors)
app.use(cors({
    origin: '*',
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}));

// 配置 JSON 解析
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 注册路由蓝图 (替代 app.register_blueprint)
const faceRoutes = require('./routes/face');
app.use('/api/face', faceRoutes);
// TODO: 注册其他模块路由，如 /api/task, /api/img 等

// 初始化数据库
sequelize.sync().then(() => {
    console.log('Database synced successfully.');
}).catch(err => {
    console.error('Failed to sync database:', err);
});

module.exports = app;