// server/workers/face_worker.js
const Face = require('../models/face');
const axios = require('axios');
const config = require('../config');

const DASHSCOPE_API_KEY = config.apiKeys.dashscope;

async function createFaceTask(taskId) {
    console.log(`开始消费捏脸生成任务，ID: ${taskId}`);

    try {
        const taskItem = await Face.findByPk(taskId);
        if (!taskItem) {
            console.error(`[Worker] 任务 ${taskId} 不存在`);
            return { status: "failed", error: "任务不存在" };
        }

        // --- 1. 拼接强大的 Prompt 提示词 (翻译自 Python 逻辑) ---
        const genderStr = taskItem.sex === 1 ? "女性" : "男性";
        const ageStr = taskItem.age ? `${taskItem.age}岁的` : "";
        const countryStr = taskItem.country ? `${taskItem.country}` : "";

        const faceTypeStr = taskItem.face_type ? `脸型为${taskItem.face_type}，` : "";
        const expressionStr = taskItem.expression ? `表情${taskItem.expression}，` : "面部自然放松，";

        let skinQuality = "充满真实质感带有些许雀斑的皮肤";
        if (taskItem.skin > 80) {
            skinQuality = "无瑕疵的完美肌肤";
        } else if (taskItem.skin > 40) {
            skinQuality = "带有轻微真实毛孔纹理的皮肤";
        }

        const detailLevel = taskItem.skin_detail > 50
            ? "8k resolution, raw photo, ultra-detailed, highly realistic"
            : "soft focus, studio portrait";

        let dimpleStr = "";
        if (taskItem.dimple > 70) {
            dimpleStr = "脸颊带有非常明显迷人的深酒窝，";
        } else if (taskItem.dimple > 30) {
            dimpleStr = "笑起来带有浅浅的酒窝，";
        }

        let moleStr = "";
        if (taskItem.mole > 70) {
            moleStr = "脸部有较多真实自然的痣，增强真实感，";
        } else if (taskItem.mole > 30) {
            moleStr = "脸颊带有一颗精致的美人痣，";
        } else if (taskItem.mole > 0) {
            moleStr = "眼角带有一颗泪痣，";
        }

        let lightStr = "";
        if (taskItem.light_type || taskItem.light_direction) {
            const lType = taskItem.light_type || "摄影棚主光";
            const lDir = taskItem.light_direction || "从正面";
            lightStr = `灯光布置：${lType}，${lDir}打光，营造出绝佳的立体感和光影氛围。`;
        }

        const prompt = `高质量逼真肖像摄影，半身像，单人，正面看向镜头。 人物特征：一个${ageStr}${countryStr}${genderStr}，${faceTypeStr}发型为${taskItem.hair_color}的${taskItem.hair}，眼睛颜色为${taskItem.eye_color}，皮肤颜色为${taskItem.skin_color}，皮肤状态为${skinQuality}。 面部细节：${expressionStr}${dimpleStr}${moleStr}五官端正对称。 画面要求：极高真实感，人物面部清晰，电影级布景。 ${lightStr} 画面画质：${detailLevel}, masterpiece, best quality, photorealistic.`;

        // --- 2. API 配置与 Payload 构建 ---
        const url = "https://dashscope.aliyuncs.com/api/v1/services/aigc/image-generation/generation";

        const payload = {
            model: "wan2.7-image-pro",
            input: {
                messages: [
                    {
                        role: "user",
                        content: [{ text: prompt }]
                    }
                ]
            },
            parameters: {
                size: "2K",
                n: 1,
                watermark: false,
            }
        };

        // --- 3. 发起请求 ---
        const response = await axios.post(url, payload, {
            headers: {
                "X-DashScope-Async": "enable",
                "Authorization": `Bearer ${DASHSCOPE_API_KEY}`,
                "Content-Type": "application/json"
            },
            timeout: 15000
        });

        const output = response.data.output || {};
        const wanxiangTaskId = output.task_id;

        if (!wanxiangTaskId) {
            throw new Error(`万相接口未返回 task_id: ${JSON.stringify(response.data)}`);
        }

        // 保存返回的万相 ID
        taskItem.wanxiang_task_id = wanxiangTaskId;
        taskItem.status = 'RUNNING';
        await taskItem.save();

        console.log(`捏脸任务派发成功！万相 ID: ${wanxiangTaskId} | 提示词: ${prompt}`);

    } catch (error) {
        console.error(`[Critical Error] 任务发生错误 ID: ${taskId}:`, error.response?.data || error.message);
        await Face.update({ status: 'FAILED' }, { where: { id: taskId } });
    }
}

module.exports = { createFaceTask };