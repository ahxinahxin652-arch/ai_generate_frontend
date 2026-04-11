// server/utils/alioss_utils.js
require('dotenv').config();
const OSS = require('ali-oss');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const os = require('os');
const axios = require('axios');

class AliOSSUtil {
    constructor() {
        // 初始化 OSS Client
        this.client = new OSS({
            accessKeyId: process.env.ALI_ACCESS_KEY_ID,
            accessKeySecret: process.env.ALI_ACCESS_KEY_SECRET,
            endpoint: process.env.ALI_OSS_ENDPOINT,
            bucket: process.env.ALI_OSS_BUCKET_NAME,
        });

        this.bucketName = process.env.ALI_OSS_BUCKET_NAME;
        // 处理可能带有 https:// 的 endpoint 前缀，确保拼接的 URL 格式正确
        this.endpoint = process.env.ALI_OSS_ENDPOINT.replace(/^https?:\/\//, '');
    }

    /**
     * 上传图片/文件到 OSS
     * @param {Buffer|Stream} fileData - 文件流或 Buffer 数据
     * @param {string} originalFilename - 原始文件名
     * @param {string} folder - OSS 中的文件夹名称
     * @returns {Promise<string|null>} - 返回上传后的 URL
     */
    async uploadImage(fileData, originalFilename, folder = 'uploads') {
        try {
            // 1. 生成唯一文件名
            const ext = path.extname(originalFilename);
            const uniqueFilename = `${uuidv4().replace(/-/g, '')}${ext}`;

            // 2. 构造 OSS 存储路径 (例如: uploads/2026-04-10/xxxx.jpg)
            const dateStr = new Date().toISOString().split('T')[0];
            const ossPath = `${folder}/${dateStr}/${uniqueFilename}`;

            // 3. 执行上传
            // ali-oss 的 put 方法支持直接传入 Buffer 或 Stream
            await this.client.put(ossPath, fileData);

            // 4. 构造访问 URL
            return `https://${this.bucketName}.${this.endpoint}/${ossPath}`;

        } catch (error) {
            console.error(`OSS 上传异常: ${error.message}`);
            return null;
        }
    }

    /**
     * 从网络 URL 下载文件到本地临时文件，再上传到 OSS (防内存溢出)
     * @param {string} sourceUrl - 目标网络资源 URL
     * @param {string} folder - OSS 存放目录
     * @returns {Promise<string|null>}
     */
    async uploadFromUrl(sourceUrl, folder = 'videos') {
        let tempFilePath = null;
        try {
            // 1. 提取后缀名
            const baseUrl = sourceUrl.split('?')[0];
            let ext = path.extname(baseUrl);
            if (!ext) {
                ext = ".mp4";
            }

            // 2. 生成 OSS 存储路径
            const uniqueFilename = `${uuidv4().replace(/-/g, '')}${ext}`;
            const dateStr = new Date().toISOString().split('T')[0];
            const ossPath = `${folder}/${dateStr}/${uniqueFilename}`;

            // 3. 发起流式请求 (防止大文件撑爆内存)
            const response = await axios({
                method: 'GET',
                url: sourceUrl,
                responseType: 'stream',
                timeout: 15000
            });

            // 4. 核心修改：将文件流分块写入操作系统的本地临时目录
            tempFilePath = path.join(os.tmpdir(), `${uuidv4()}${ext}`);
            const writer = fs.createWriteStream(tempFilePath);

            // 使用 pipe 管道将下载流导向本地文件
            response.data.pipe(writer);

            // 等待文件完全写入磁盘
            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            // 5. 将本地临时文件上传到 OSS (ali-oss 支持直接传本地文件路径)
            await this.client.put(ossPath, tempFilePath);

            // 6. 构造并返回访问 URL
            return `https://${this.bucketName}.${this.endpoint}/${ossPath}`;

        } catch (error) {
            console.error(`OSS 转存视频/文件异常: ${error.message}`);
            return null;
        } finally {
            // 🌟 7. 兜底清理：无论成功还是异常，删除操作系统的临时文件
            if (tempFilePath && fs.existsSync(tempFilePath)) {
                try {
                    fs.unlinkSync(tempFilePath);
                } catch (e) {
                    console.error(`清理临时文件失败: ${e.message}`);
                }
            }
        }
    }
}

// 实例化，方便其他模块直接 require 导入使用
const aliOss = new AliOSSUtil();
module.exports = aliOss;