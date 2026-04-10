<template>
  <div class="face-generator-container">
    <el-card class="box-card" shadow="always">
      <div class="split-layout">

        <div class="control-panel">
          <div class="panel-header">
            <h3>肖像大师参数设定</h3>
            <el-button type="success" plain size="small" icon="Refresh" @click="randomizeParams">一键随机</el-button>
          </div>

          <div class="form-scroll-area">
            <el-form label-width="90px" size="small" class="custom-form" label-position="left">

              <el-divider content-position="left">基本信息</el-divider>
              <el-form-item label="性别">
                <el-radio-group v-model="formData.sex">
                  <el-radio-button :label="1">女性</el-radio-button>
                  <el-radio-button :label="0">男性</el-radio-button>
                </el-radio-group>
              </el-form-item>

              <el-form-item label="年龄">
                <el-input-number v-model="formData.age" :min="1" :max="100" />
              </el-form-item>

              <el-form-item label="国籍">
                <el-select v-model="formData.country" placeholder="请选择国籍" filterable allow-create>
                  <el-option label="中国" value="中国" />
                  <el-option label="韩国" value="韩国" />
                  <el-option label="日本" value="日本" />
                  <el-option label="欧美" value="欧美" />
                  <el-option label="混血" value="混血" />
                </el-select>
              </el-form-item>

              <el-divider content-position="left">面部与五官</el-divider>
              <el-form-item label="脸型">
                <el-select v-model="formData.face_type" placeholder="请选择脸型" allow-create filterable>
                  <el-option label="瓜子脸" value="瓜子脸" />
                  <el-option label="鹅蛋脸" value="鹅蛋脸" />
                  <el-option label="圆脸" value="圆脸" />
                  <el-option label="方脸" value="方脸" />
                  <el-option label="心形脸" value="心形脸" />
                </el-select>
              </el-form-item>

              <el-form-item label="表情">
                <el-select v-model="formData.expression" placeholder="请选择表情" allow-create filterable>
                  <el-option label="微笑" value="微笑" />
                  <el-option label="自然放松" value="自然放松" />
                  <el-option label="忧郁" value="忧郁" />
                  <el-option label="大笑" value="大笑" />
                  <el-option label="冷酷" value="冷酷" />
                </el-select>
              </el-form-item>

              <el-form-item label="眼睛颜色">
                <el-select v-model="formData.eye_color" placeholder="请选择眼瞳颜色" allow-create>
                  <el-option label="深棕色" value="深棕色" />
                  <el-option label="黑色" value="黑色" />
                  <el-option label="灰色" value="灰色" />
                  <el-option label="蓝色" value="蓝色" />
                  <el-option label="绿色" value="绿色" />
                </el-select>
              </el-form-item>

              <el-form-item label="发型">
                <el-input v-model="formData.hair" placeholder="如：法式波波头 / 齐肩直发 / 寸头" />
              </el-form-item>

              <el-form-item label="头发颜色">
                <el-select v-model="formData.hair_color" placeholder="请选择头发颜色" allow-create>
                  <el-option label="黑色" value="黑色" />
                  <el-option label="深棕色" value="深棕色" />
                  <el-option label="浅金色" value="浅金色" />
                  <el-option label="银灰色" value="银灰色" />
                  <el-option label="酒红色" value="酒红色" />
                </el-select>
              </el-form-item>

              <el-divider content-position="left">皮肤与特征</el-divider>
              <el-form-item label="肤色">
                <el-input v-model="formData.skin_color" placeholder="如：冷白皮 / 黄黑皮 / 小麦色" />
              </el-form-item>

              <el-form-item label="酒窝明显度" class="slider-item">
                <el-slider v-model="formData.dimple" :min="0" :max="100" show-input />
              </el-form-item>

              <el-form-item label="特征痣" class="slider-item">
                <el-slider v-model="formData.mole" :min="0" :max="100" show-input />
                <div class="slider-hint">0为无痣，数值变大逐渐出现泪痣、美人痣或多颗痣</div>
              </el-form-item>

              <el-form-item label="皮肤光洁度" class="slider-item">
                <el-slider v-model="formData.skin" :min="1" :max="100" show-input />
                <div class="slider-hint">数值越小保留雀斑纹理，越大越像磨皮滤镜</div>
              </el-form-item>

              <el-form-item label="皮肤细节" class="slider-item">
                <el-slider v-model="formData.skin_detail" :min="1" :max="100" show-input />
                <div class="slider-hint">影响毛孔、毛发等高清细节生成</div>
              </el-form-item>

              <el-divider content-position="left">摄影光影</el-divider>
              <el-form-item label="灯光类型">
                <el-select v-model="formData.light_type" placeholder="请选择灯光类型" allow-create>
                  <el-option label="柔和主光" value="柔和主光" />
                  <el-option label="轮廓边缘光" value="轮廓边缘光" />
                  <el-option label="电影质感光" value="电影质感光" />
                  <el-option label="赛博朋克霓虹光" value="赛博朋克霓虹光" />
                </el-select>
              </el-form-item>

              <el-form-item label="光源方向">
                <el-select v-model="formData.light_direction" placeholder="请选择光照方向" allow-create>
                  <el-option label="从左侧" value="从左侧" />
                  <el-option label="从右侧" value="从右侧" />
                  <el-option label="从正前方" value="从正前方" />
                  <el-option label="从顶上" value="从顶上" />
                  <el-option label="逆光" value="逆光" />
                </el-select>
              </el-form-item>

            </el-form>
          </div>

          <div class="submit-wrapper">
            <el-button type="primary" class="generate-btn" @click="submitTask" :loading="status.isGenerating">
              {{ status.isGenerating ? status.message : '生成预览图像' }}
            </el-button>
          </div>
        </div>

        <div class="preview-panel">
          <div v-if="!status.isGenerating && !resultData.resultUrl" class="empty-state">
            <el-icon class="empty-icon"><Picture /></el-icon>
            <p>调整左侧参数并点击生成</p>
          </div>

          <div v-else-if="status.isGenerating" class="generating-state">
            <el-progress type="circle" :percentage="fakeProgress" />
            <p class="status-text">{{ status.message }}</p>
          </div>

          <div v-else-if="resultData.resultUrl" class="result-state">
            <el-image
                :src="resultData.resultUrl"
                :preview-src-list="[resultData.resultUrl]"
                fit="contain"
                class="final-image"
            />
            <el-button class="download-btn" size="small" icon="Download" @click="downloadImage">下载图像</el-button>
          </div>
        </div>

      </div>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { Picture } from '@element-plus/icons-vue'
import axios from 'axios'

// 完整的表单数据
const formData = reactive({
  sex: 1,
  age: 22,
  country: '中国',
  face_type: '鹅蛋脸',
  expression: '微笑',
  eye_color: '深棕色',
  hair: '法式波波头',
  hair_color: '黑色',
  skin_color: '冷白皮',
  skin: 50,
  skin_detail: 80,
  dimple: 0,
  mole: 0,
  light_type: '柔和主光',
  light_direction: '从左侧'
})

const status = reactive({
  isGenerating: false,
  message: ''
})

const resultData = reactive({
  taskId: '',
  resultUrl: ''
})

const fakeProgress = ref(0)
let progressTimer = null
let pollingTimer = null

// 随机数助手函数
const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)]
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

// 一键随机生成参数逻辑
const randomizeParams = () => {
  formData.sex = getRandomInt(0, 1)
  formData.age = getRandomInt(16, 45)
  formData.country = getRandomItem(['中国', '韩国', '日本', '欧美', '混血'])
  formData.face_type = getRandomItem(['瓜子脸', '鹅蛋脸', '圆脸', '方脸', '心形脸'])
  formData.expression = getRandomItem(['微笑', '自然放松', '冷酷', '忧郁', '大笑'])
  formData.eye_color = getRandomItem(['深棕色', '黑色', '灰色', '蓝色', '绿色'])

  // 根据性别随机发型
  if (formData.sex === 1) {
    formData.hair = getRandomItem(['法式波波头', '大波浪长卷发', '黑长直', '高马尾', '双马尾', '精灵短发'])
  } else {
    formData.hair = getRandomItem(['韩式中分', '利落寸头', '背头', '微卷碎发', '三七分侧边带纹理'])
  }

  formData.hair_color = getRandomItem(['黑色', '深棕色', '浅金色', '银灰色', '酒红色', '粉紫色'])
  formData.skin_color = getRandomItem(['冷白皮', '暖黄皮', '小麦色', '健康深色皮肤'])
  formData.skin = getRandomInt(20, 100)
  formData.skin_detail = getRandomInt(40, 100)
  formData.dimple = getRandomItem([0, 0, 0, 40, 80]) // 增加无酒窝的概率
  formData.mole = getRandomItem([0, 0, 30, 80])      // 增加无痣的概率
  formData.light_type = getRandomItem(['柔和主光', '轮廓边缘光', '电影质感光', '赛博朋克霓虹光'])
  formData.light_direction = getRandomItem(['从左侧', '从右侧', '从正前方', '从顶上', '逆光'])

  ElMessage.success('参数已重新随机生成！')
}

// 提交任务逻辑
const submitTask = async () => {
  status.isGenerating = true
  status.message = '正在派发任务...'
  resultData.resultUrl = ''

  try {
    const res = await axios.post('http://localhost:5000/api/face/generate', formData)

    if (res.data.success) {
      resultData.taskId = res.data.data.task_id
      status.message = '模型正在作画...'
      startFakeProgress()
      startPolling()
    }
  } catch (error) {
    status.isGenerating = false
    ElMessage.error('请求失败：' + error.message)
  }
}

// 轮询查询
const startPolling = () => {
  pollingTimer = setInterval(async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/face/${resultData.taskId}`)
      const taskData = res.data.data

      if (taskData.status === 'SUCCEEDED') {
        clearTimers()
        fakeProgress.value = 100
        resultData.resultUrl = taskData.result_url
        status.isGenerating = false
        ElMessage.success('生成成功！')
      } else if (taskData.status === 'FAILED') {
        clearTimers()
        status.isGenerating = false
        ElMessage.error('生成失败，请重试')
      }
    } catch (error) {
      console.error('轮询异常', error)
    }
  }, 3000)
}

// 伪进度条
const startFakeProgress = () => {
  fakeProgress.value = 0
  progressTimer = setInterval(() => {
    if (fakeProgress.value < 95) {
      fakeProgress.value += Math.max(1, (95 - fakeProgress.value) / 15)
    }
  }, 1000)
}

const clearTimers = () => {
  if (pollingTimer) clearInterval(pollingTimer)
  if (progressTimer) clearInterval(progressTimer)
}

const downloadImage = () => {
  if (!resultData.resultUrl) return
  window.open(resultData.resultUrl, '_blank')
}

onBeforeUnmount(() => {
  clearTimers()
})
</script>

<style scoped>
.face-generator-container {
  max-width: 1100px;
  margin: 40px auto;
}

.split-layout {
  display: flex;
  min-height: 650px;
}

/* 左侧控制面板 */
.control-panel {
  width: 45%;
  padding-right: 20px;
  border-right: 1px solid #ebeef5;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.panel-header h3 {
  margin: 0;
  color: #303133;
}

/* 增加滚动条样式以应对变长的表单 */
.form-scroll-area {
  flex: 1;
  overflow-y: auto;
  padding-right: 15px;
  margin-bottom: 20px;
}
.form-scroll-area::-webkit-scrollbar {
  width: 6px;
}
.form-scroll-area::-webkit-scrollbar-thumb {
  background: #dcdfe6;
  border-radius: 3px;
}

.slider-hint {
  font-size: 12px;
  color: #909399;
  line-height: 1.2;
  margin-top: -5px;
}

.submit-wrapper {
  margin-top: 10px;
  text-align: center;
}

.generate-btn {
  width: 100%;
  height: 45px;
  font-size: 16px;
  letter-spacing: 1px;
}

/* 右侧预览区 */
.preview-panel {
  width: 55%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8f9fa;
  border-radius: 0 8px 8px 0;
  padding: 20px;
  position: relative;
}

.empty-state, .generating-state {
  text-align: center;
  color: #909399;
}

.empty-icon {
  font-size: 60px;
  margin-bottom: 15px;
  color: #dcdfe6;
}

.status-text {
  margin-top: 20px;
  font-size: 15px;
}

.result-state {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.final-image {
  width: 100%;
  max-height: 550px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.download-btn {
  margin-top: 15px;
}
</style>