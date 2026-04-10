<template>
  <div class="video-generator-container">
    <el-card class="box-card" shadow="always">
      <template #header>
        <div class="card-header">
          <div class="header-title">
            <el-icon class="header-icon"><VideoCamera /></el-icon>
            <h2>商品动态展示生成器</h2>
          </div>
          <p class="header-subtitle">让你的静态商品图瞬间“活”起来</p>
        </div>
      </template>

      <transition name="fade" mode="out-in">
        <div v-if="!status.isGenerating && !status.isSuccess && !status.isFailed" class="form-section">
          <el-form label-position="top">
            <el-form-item>
              <template #label>
                <span class="custom-label">商品参考图
                  <el-tag size="small" type="info" effect="plain" class="rule-tag">最短边≥512px, 大小≤5MB</el-tag>
                </span>
              </template>
              <el-upload
                  class="custom-uploader"
                  drag
                  action="#"
                  :auto-upload="false"
                  :show-file-list="false"
                  :on-change="handleFileChange"
              >
                <div v-if="formData.previewUrl" class="preview-wrapper">
                  <img :src="formData.previewUrl" class="preview-image" />
                  <div class="preview-overlay">
                    <el-icon><Refresh /></el-icon>
                    <span>点击更换图片</span>
                  </div>
                </div>
                <div v-else class="upload-placeholder">
                  <el-icon class="upload-icon"><upload-filled /></el-icon>
                  <div class="upload-text">
                    将文件拖到此处，或 <em class="highlight-text">点击上传</em>
                  </div>
                  <div class="upload-hint">支持 JPG / PNG 格式</div>
                </div>
              </el-upload>
            </el-form-item>

            <div class="submit-wrapper">
              <el-button
                  type="primary"
                  size="large"
                  class="submit-btn"
                  @click="submitGenerateTask"
                  :disabled="!formData.compressedFile"
                  round
              >
                <el-icon class="el-icon--left"><MagicStick /></el-icon>
                开始生成动态视频
              </el-button>
            </div>
          </el-form>
        </div>

        <div v-else-if="status.isGenerating" class="processing-section">
          <el-progress
              type="dashboard"
              :percentage="fakeProgress"
              :color="progressColors"
              :width="160"
              :stroke-width="10"
          >
            <template #default="{ percentage }">
              <span class="progress-percentage">{{ Math.round(percentage) }}%</span>
            </template>
          </el-progress>
          <h3 class="status-text">{{ status.message }}</h3>
          <p class="sub-text animate-pulse">预计需要 1~3 分钟，请耐心等待...</p>
        </div>

        <div v-else-if="status.isSuccess" class="result-section">
          <el-result icon="success" title="视频生成成功！">
            <template #extra>
              <div class="video-wrapper">
                <video
                    :src="resultData.videoUrl"
                    controls
                    autoplay
                    loop
                    class="result-video"
                ></video>
              </div>
              <div class="actions">
                <el-button type="primary" size="large" round @click="downloadVideo">
                  <el-icon class="el-icon--left"><Download /></el-icon>下载视频
                </el-button>
                <el-button size="large" round @click="resetForm">
                  <el-icon class="el-icon--left"><RefreshRight /></el-icon>再做一条
                </el-button>
              </div>
            </template>
          </el-result>
        </div>

        <div v-else-if="status.isFailed" class="result-section">
          <el-result icon="warning" title="视频动态化失败" :sub-title="status.message">
            <template #extra>
              <div v-if="resultData.fallbackImageUrl" class="fallback-container">
                <el-alert
                    title="该图片不适合动态化，请换张图片"
                    type="info"
                    show-icon
                    :closable="false"
                    class="fallback-alert"
                />
                <el-image
                    :src="resultData.fallbackImageUrl"
                    class="fallback-image"
                    :preview-src-list="[resultData.fallbackImageUrl]"
                    fit="contain"
                />
              </div>
              <div class="actions">
                <el-button type="primary" size="large" round @click="resetForm">
                  <el-icon class="el-icon--left"><RefreshRight /></el-icon>重新尝试
                </el-button>
              </div>
            </template>
          </el-result>
        </div>
      </transition>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
// 引入了更多图标以丰富界面
import {
  UploadFilled,
  VideoCamera,
  MagicStick,
  Download,
  RefreshRight,
  Refresh
} from '@element-plus/icons-vue'
import Compressor from 'compressorjs'
import axios from 'axios'

// ================= 状态管理 =================
const formData = reactive({
  originalFile: null,
  compressedFile: null,
  previewUrl: '',
  prompt: '一幅都市奇幻艺术的场景。一个充满动感的涂鸦艺术角色。'
})

const status = reactive({
  isGenerating: false,
  isSuccess: false,
  isFailed: false,
  message: '准备就绪'
})

const resultData = reactive({
  taskId: '',
  videoUrl: '',
  fallbackImageUrl: ''
})

const fakeProgress = ref(0)
let progressTimer = null
let pollingTimer = null

const progressColors = [
  { color: '#f56c6c', percentage: 20 },
  { color: '#e6a23c', percentage: 40 },
  { color: '#5cb87a', percentage: 60 },
  { color: '#1989fa', percentage: 80 },
  { color: '#409EFF', percentage: 100 },
]


// ================= 方法逻辑 =================
const handleFileChange = (uploadFile) => {
  const file = uploadFile.raw
  if (!file) return

  const isImage = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/jpg'
  if (!isImage) {
    ElMessage.error('只能上传 JPG/PNG 格式的图片！')
    return
  }

  const isLt5M = file.size / 1024 / 1024 <= 5
  if (!isLt5M) {
    ElMessage.error('上传图片大小不能超过 5MB！')
    return
  }

  const reader = new FileReader()
  reader.readAsDataURL(file)
  reader.onload = (e) => {
    const img = new Image()
    img.src = e.target.result
    img.onload = () => {
      const minEdge = Math.min(img.width, img.height)
      if (minEdge < 512) {
        ElMessage.error(`图片分辨率过低！当前最短边为 ${minEdge}px，要求 ≥ 512px。`)
        return
      }

      formData.originalFile = file
      formData.previewUrl = img.src
      compressImage(file)
    }
  }
}

const compressImage = (file) => {
  new Compressor(file, {
    quality: 0.8,
    maxWidth: 2048,
    maxHeight: 2048,
    success(result) {
      formData.compressedFile = result
      ElMessage.success('图片校验成功，准备就绪。')
    },
    error(err) {
      ElMessage.error('图片压缩失败：' + err.message)
    },
  })
}

const submitGenerateTask = async () => {
  if (!formData.compressedFile) {
    ElMessage.warning('请先上传图片！')
    return
  }

  status.isGenerating = true
  status.message = '正在上传图片...'

  try {
    // 1. 创建 FormData
    const postData = new FormData()
    // 注意：这里的 'file' 必须和后端 request.files['file'] 对应
    postData.append('file', formData.compressedFile, formData.originalFile.name)

    // 2. 发送请求到后端新增的 upload 接口
    // 这里的路径根据你 blueprint 注册的 url_prefix 来定
    const uploadRes = await axios.post(`http://localhost:5000/api/task/upload`, postData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    if (uploadRes.data.success && uploadRes.data.data.task_id != null) {
      const taskId = uploadRes.data.data.task_id
      resultData.taskId = taskId
      status.message = '图片已存入服务器，处理中...'

      // 3. 开始轮询这个新的 taskId
      startPolling()
    }
  } catch (error) {
    status.isGenerating = false
    ElMessage.error('上传失败：' + error.message)
  }
}

const startPolling = () => {
  pollingTimer = setInterval(async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/task/${resultData.taskId}`)
      const taskData = response.data.data
      console.log(taskData)
      if (taskData.status === 'PENDING') {
        fakeProgress.value = 21
        status.message = '任务正在排队中'
      }
      else if (taskData.status === 'RUNNING') {
        fakeProgress.value = 43
        status.message = '任务正在执行中'
      }
      else if (taskData.status === 'SUCCEEDED') {
        clearTimers()
        fakeProgress.value = 100
        resultData.videoUrl = taskData.video_url
        status.isGenerating = false
        status.isSuccess = true
      }
      else if (taskData.status === 'FAILED') {
        clearTimers()
        resultData.fallbackImageUrl = taskData.video_url
        status.message = taskData.message || '生成失败'
        status.isGenerating = false
        status.isFailed = true
      }
      else {
        status.message = taskData.message || '大模型正在绘制中...'
      }
    } catch (error) {
      console.error('轮询请求错误:', error)
    }
  }, 5000)
}

// eslint-disable-next-line no-unused-vars
const startFakeProgress = () => {
  fakeProgress.value = 0
  progressTimer = setInterval(() => {
    if (fakeProgress.value < 95) {
      const step = Math.max(1, (95 - fakeProgress.value) / 10)
      fakeProgress.value += step
    }
  }, 1000)
}

const clearTimers = () => {
  if (pollingTimer) clearInterval(pollingTimer)
  if (progressTimer) clearInterval(progressTimer)
}

const stopFakeProgress = () => {
  if (progressTimer) clearInterval(progressTimer)
  fakeProgress.value = 0
}

const resetForm = () => {
  formData.originalFile = null
  formData.compressedFile = null
  formData.previewUrl = ''
  status.isGenerating = false
  status.isSuccess = false
  status.isFailed = false
  resultData.taskId = ''
  resultData.videoUrl = ''
  resultData.fallbackImageUrl = ''
  stopFakeProgress()
}

const downloadVideo = () => {
  if (!resultData.videoUrl) return
  const a = document.createElement('a')
  a.href = resultData.videoUrl
  a.download = `video_${new Date().getTime()}.mp4`
  a.target = '_blank'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

onBeforeUnmount(() => {
  clearTimers()
})
</script>

<style scoped>
/* =========== 容器与卡片 =========== */
.video-generator-container {
  width: 100%;
  max-width: 760px; /* 修复了原先的 140px 问题 */
  margin: 40px auto;
  padding: 0 15px;
  box-sizing: border-box;
}

.box-card {
  border-radius: 16px; /* 更现代的圆角 */
  border: none;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08) !important;
}

/* =========== 头部 =========== */
.card-header {
  text-align: center;
  padding: 10px 0;
}

.header-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 8px;
}

.header-icon {
  font-size: 28px;
  color: var(--el-color-primary);
}

.header-title h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.header-subtitle {
  margin: 0;
  font-size: 14px;
  color: #909399;
}

/* =========== 表单元素 =========== */
.custom-label {
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 10px;
}

.rule-tag {
  font-weight: normal;
}

.custom-textarea :deep(.el-textarea__inner) {
  border-radius: 8px;
  padding: 12px;
  background-color: #f8f9fa;
  box-shadow: none;
  border: 1px solid #dcdfe6;
  transition: all 0.3s;
}

.custom-textarea :deep(.el-textarea__inner:focus) {
  background-color: #fff;
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 1px var(--el-color-primary);
}

/* =========== 上传区域 =========== */
.custom-uploader :deep(.el-upload-dragger) {
  border-radius: 12px;
  background-color: #f8f9fa;
  border: 2px dashed #dcdfe6;
  padding: 0;
  height: 280px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  overflow: hidden;
}

.custom-uploader :deep(.el-upload-dragger:hover) {
  background-color: #f0f7ff;
  border-color: var(--el-color-primary);
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.upload-icon {
  font-size: 56px;
  color: #a8abb2;
  margin-bottom: 16px;
  transition: color 0.3s;
}

.custom-uploader :deep(.el-upload-dragger:hover) .upload-icon {
  color: var(--el-color-primary);
}

.upload-text {
  font-size: 15px;
  color: #606266;
}

.highlight-text {
  color: var(--el-color-primary);
  font-style: normal;
  font-weight: bold;
}

.upload-hint {
  font-size: 13px;
  color: #909399;
  margin-top: 8px;
}

/* 预览图片区 */
.preview-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  background: repeating-conic-gradient(#f0f0f0 0% 25%, transparent 0% 50%) 50% / 20px 20px;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.preview-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
  font-size: 15px;
  gap: 8px;
}

.preview-wrapper:hover .preview-overlay {
  opacity: 1;
}

/* =========== 按钮 =========== */
.submit-wrapper {
  margin-top: 30px;
  text-align: center;
}

.submit-btn {
  width: 80%;
  max-width: 400px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 1px;
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.3);
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(64, 158, 255, 0.4);
}

/* =========== 进度区域 =========== */
.processing-section {
  text-align: center;
  padding: 60px 0;
}

.progress-percentage {
  font-size: 28px;
  font-weight: bold;
  color: var(--el-color-primary);
}

.status-text {
  margin-top: 30px;
  color: #303133;
  font-size: 20px;
}

.sub-text {
  color: #909399;
  font-size: 14px;
  margin-top: 10px;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* =========== 结果区域 =========== */
.result-section {
  padding: 20px 0;
}

.video-wrapper {
  background: #000;
  border-radius: 12px;
  overflow: hidden;
  margin: 0 auto 30px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  max-width: 500px;
}

.result-video {
  width: 100%;
  display: block;
}

.fallback-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.fallback-alert {
  max-width: 400px;
}

.fallback-image {
  width: 100%;
  max-width: 400px;
  border-radius: 12px;
  border: 1px solid #ebeef5;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.actions {
  display: flex;
  gap: 20px;
  justify-content: center;
  margin-top: 10px;
}

/* 动画效果 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>