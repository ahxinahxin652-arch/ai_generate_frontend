// electron/server/config.js
// 这一句非常关键，它会读取根目录下的 .env 文件并将变量挂载到 process.env 上
// __dirname 是 electron/server/，跳两层 ../../ 即可到达项目根目录
const {join} = require("node:path");
require('dotenv').config({ path: join(__dirname, '../../.env') });

module.exports = {
    // 阿里云 OSS 配置
    aliOss: {
        accessKeyId: process.env.ALI_ACCESS_KEY_ID,
        accessKeySecret: process.env.ALI_ACCESS_KEY_SECRET,
        endpoint: process.env.ALI_OSS_ENDPOINT,
        bucketName: process.env.ALI_OSS_BUCKET_NAME,
    },

    // 第三方 API Keys
    apiKeys: {
        // 注意对应 .env 中的 API_Key
        dashscope: process.env.API_Key || 'default_key_if_missing',
    },

    // 其他通用配置可以在这里加
    port: process.env.PORT || 5000,
};