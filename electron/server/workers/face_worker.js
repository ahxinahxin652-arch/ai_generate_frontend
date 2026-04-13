// electron/server/workers/face_worker.js
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
            return {status: "failed", error: "任务不存在"};
        }

        // --- 1. 拼接强大的 Prompt 提示词 (Prompt Engineer 优化版) ---
        const genderStr = taskItem.sex === 1 ? "女性" : "男性";
        const ageStr = taskItem.age ? `${taskItem.age}岁` : "年轻的";
        const countryStr = taskItem.country ? `${taskItem.country}` : "亚洲";

        // 基础主体描述 (强化对称和正脸权重)
        const baseSubject = `1个${ageStr}的${countryStr}${genderStr}，极度写实的单人正面半身像，完美对称的正脸，直视镜头`;

        // 脸型与头发 (将下巴单独提取并增强权重)
        const faceTypeStr = taskItem.face_type ? `(脸型轮廓：${taskItem.face_type})` : "面部轮廓完美";
        // 增加下巴的极端权重，并使用更具体的词汇描述
        const chinStr = taskItem.chin ? `((极致清晰的${taskItem.chin}))` : "";
        const hairStr = `(发型：${taskItem.hair_color}的${taskItem.hair})`;
        const eyeColorStr = `(${taskItem.eye_color}的眼睛)`;

        // ==========================================
        // 核心优化：解决“表情”与“局部嘴型”的逻辑冲突
        // ==========================================
        let expressionStr = taskItem.expression ? `${taskItem.expression}的表情` : "自然生动的表情";
        let mouthStr = taskItem.mouth ? `嘴部细节：(( ${taskItem.mouth} ))` : "";

        // 如果嘴部特征包含“微笑”、“上扬”等词，且表情要求是“自然放松”，则进行语义融合
        if (taskItem.mouth && (taskItem.mouth.includes('微笑') || taskItem.mouth.includes('上扬'))) {
            if (taskItem.expression === '自然放松') {
                expressionStr = "带有淡淡笑意的自然放松表情"; // 消解对抗，融为一体
            } else if (taskItem.expression === '严肃') {
                expressionStr = "看似严肃但嘴角微挑的复杂神态";
            }
        }

        // 皮肤质感 (强化材质光泽描述)
        let skinQuality = "极具真实感的肌肤质感，微距级别的高清皮肤纹理";
        if (taskItem.skin > 80) {
            skinQuality = "无瑕疵的光滑白皙肌肤，((如同剥壳鸡蛋般完美细腻，泛着健康的肌肤光泽))";
        } else if (taskItem.skin > 40) {
            skinQuality = "((展现真实呼吸感的皮肤毛孔纹理))，绝佳的真实肌肤细节";
        }

        // 五官特征 (使用“部位：特征”的结构化写法，AI更容易理解)
        const features = [];

        if (taskItem.double_eyelid > 80) features.push("((深邃宽大的欧式双眼皮))");
        else if (taskItem.double_eyelid > 40) features.push("(精致自然的双眼皮)");
        else if (taskItem.double_eyelid > 0) features.push("(若隐若现的内双)");
        else features.push("(极具东方魅力的单眼皮)");

        if (taskItem.nose) features.push(`鼻子：(${taskItem.nose})`);

        if (taskItem.dimple > 70) features.push("((脸颊有深深的迷人酒窝))");
        else if (taskItem.dimple > 30) features.push("(浅浅的自然酒窝)");

        if (taskItem.mole > 70) features.push("(面部散落几颗极具真实感的天然痣)");
        else if (taskItem.mole > 30) features.push("(脸颊带有迷人美人痣)");
        else if (taskItem.mole > 0) features.push("(眼角带有一颗泪痣)");

        const featureStr = features.length > 0 ? `${features.join('，')}。` : "";

        // 光影氛围 (增加面部轮廓光，有助于凸显尖下巴等骨骼特征)
        let lightStr = "电影级布景，专业影棚级人像打光。";
        if (taskItem.light_type || taskItem.light_direction) {
            const lType = taskItem.light_type || "柔和主光";
            const lDir = taskItem.light_direction || "正面";
            lightStr = `光影要求：电影级布景，((由${lDir}照射的${lType}))，顶级的光影氛围，完美的体积光与人物面部轮廓光。`;
        }

        // 英文画质增强词 (加入了 sharp focus on face 强制面部清晰)
        const detailLevel = taskItem.skin_detail > 50
            ? "8k resolution, raw photo, ultra-detailed, hyper-realistic, photorealistic, intricate details, highly textured skin, macro photography, sharp focus on face, masterpiece, best quality"
            : "soft focus, studio portrait, flawless photography, masterpiece, best quality";

        // ==========================================
        // 💡 最终 Prompt 组装：采用“大结构分段”写法
        // ==========================================
        const prompt = `高质量写实肖像摄影。${baseSubject}。
            人物外貌：${faceTypeStr}，${chinStr}，${hairStr}，${eyeColorStr}。
            神态与五官：${expressionStr}，${mouthStr}。${featureStr}五官端正，绝对对称的完美面部比例。
            肤质状态：${taskItem.skin_color}，${skinQuality}。
            ${lightStr}
            画面要求：${detailLevel}`;

        // --- 2. API 配置与 Payload 构建 ---
        const url = "https://dashscope.aliyuncs.com/api/v1/services/aigc/image-generation/generation";

        const payload = {
            model: "wan2.7-image-pro",
            input: {
                messages: [
                    {
                        role: "user",
                        content: [{text: prompt}]
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

        console.log(`捏脸任务派发成功！万相 ID: ${wanxiangTaskId} \n | 提示词: ${prompt}`);


    } catch (error) {
        console.error(`[Critical Error] 任务发生错误 ID: ${taskId}:`, error.response?.data || error.message);
        await Face.update({status: 'FAILED'}, {where: {id: taskId}});
    }
}

module.exports = {createFaceTask};