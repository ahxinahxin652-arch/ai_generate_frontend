// server/app.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
// 引入统一配置
const config = require('./config');

const app = express();

// 配置 CORS
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

// 注册路由蓝图
const faceRoutes = require('./routes/face');
app.use('/api/face', faceRoutes);
// TODO: 按照同样的模式注册其他模块路由，如 /api/task, /api/img 等

module.exports = app;