// electron/server/routes/face.js
const express = require('express');
const axios = require('axios');
const router = express.Router();
const Face = require('../models/face');
const { createFaceTask } = require('../workers/face_worker');
const config = require('../config');
const aliOss = require('../utils/alioss_utils'); // 引入 OSS 工具

const DASHSCOPE_API_KEY = config.apiKeys.dashscope;

// 接收捏脸参数并派发任务
router.post('/generate', async (req, res) => {
    try {
        const data = req.body;
        if (!data || Object.keys(data).length === 0) {
            return res.status(400).json({ success: false, message: '未提供参数' });
        }

        // 创建任务记录
        const newTask = await Face.create({
            age: data.age,
            country: data.country,
            hair: data.hair,
            hair_color: data.hair_color,
            face_type: data.face_type,
            expression: data.expression,
            dimple: data.dimple !== undefined ? parseInt(data.dimple) : 0,
            sex: data.sex !== undefined ? parseInt(data.sex) : 1,
            eye_color: data.eye_color,
            skin: data.skin !== undefined ? parseInt(data.skin) : 50,
            skin_color: data.skin_color,
            skin_detail: data.skin_detail !== undefined ? parseInt(data.skin_detail) : 50,
            mole: data.mole !== undefined ? parseInt(data.mole) : 0,

            // 新增的4个参数
            nose: data.nose,
            double_eyelid: data.double_eyelid !== undefined ? parseInt(data.double_eyelid) : 50,
            mouth: data.mouth,
            chin: data.chin,

            light_type: data.light_type,
            light_direction: data.light_direction,
            status: 'PENDING'
        });

        // 异步执行任务
        createFaceTask(newTask.id).catch(console.error);

        return res.status(200).json({
            success: true,
            data: { task_id: newTask.id }
        });

    } catch (error) {
        console.error("Generate error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
});

// 查询任务状态并解析生成的图片
router.get('/:task_id', async (req, res) => {
    try {
        const taskId = req.params.task_id;
        const taskItem = await Face.findByPk(taskId);

        if (!taskItem) {
            return res.status(404).json({ success: false, message: '任务不存在' });
        }

        if (['FAILED', 'SUCCEEDED'].includes(taskItem.status)) {
            return res.status(200).json({ success: true, data: taskItem.toJSON() });
        }

        const wanxiangTaskId = taskItem.wanxiang_task_id;
        if (!wanxiangTaskId) {
            return res.status(200).json({ success: true, data: taskItem.toJSON() });
        }

        // 请求阿里大模型接口查询状态
        const apiUrl = `https://dashscope.aliyuncs.com/api/v1/tasks/${wanxiangTaskId}`;
        const response = await axios.get(apiUrl, {
            headers: {
                "Authorization": `Bearer ${DASHSCOPE_API_KEY}`,
                "Content-Type": "application/json"
            },
            timeout: 10000
        });

        const resData = response.data;
        const output = resData.output || {};
        const wxStatus = output.task_status;

        if (wxStatus === 'RUNNING') {
            taskItem.status = 'RUNNING';
            await taskItem.save();
        } else if (wxStatus === 'SUCCEEDED') {
            const choices = output.choices || [];
            let imgUrl = null;

            if (choices.length > 0) {
                const content = choices[0].message?.content || [];
                const imageItem = content.find(item => item.type === 'image');
                if (imageItem) {
                    imgUrl = imageItem.image;
                }
            }

            if (imgUrl) {
                // 将万相生成的图片转存到自己的 OSS 中
                const myUrl = await aliOss.uploadFromUrl(imgUrl, 'images/faces');
                taskItem.result_url = myUrl ? myUrl : imgUrl;
            }

            taskItem.status = 'SUCCEEDED';
            await taskItem.save();
        } else if (wxStatus === 'FAILED') {
            taskItem.status = 'FAILED';
            await taskItem.save();
        }

        return res.status(200).json({ success: true, data: taskItem.toJSON() });

    } catch (error) {
        console.error("Status check error:", error);
        return res.status(500).json({ success: false, message: `查询异常: ${error.message}` });
    }
});

module.exports = router;