<template>
  <div class="image-generator-container">
    <el-card class="box-card" shadow="always">
      <template #header>
        <div class="card-header">
          <h2>全自动影视资产生成引擎</h2>
          <p class="header-subtitle">输入原始剧本 ➔ AI拆解角色/场景 ➔ 补充参考图 ➔ 渲染生成</p>
        </div>
      </template>

      <el-form label-position="top">

        <div class="step-section">
          <div class="step-title">
            <el-tag type="primary" effect="dark" round>Step 1</el-tag>
            <span class="step-text">剧本智能解析</span>
          </div>
          <el-form-item>
            <el-input
                v-model="rawScript"
                type="textarea"
                :rows="4"
                placeholder="在这里粘贴小说或剧本片段，AI 将自动拆解需要的场景和角色参考图..."
                class="custom-textarea"
            />
            <div style="margin-top: 15px; text-align: right;">
              <el-button
                  type="success"
                  @click="parseScript"
                  :loading="isParsing"
                  round>
                <el-icon class="el-icon--left">
                  <MagicStick/>
                </el-icon>
                AI 智能拆解剧本
              </el-button>
            </div>
          </el-form-item>
        </div>

        <el-divider border-style="dashed"/>

        <div class="step-section">
          <div class="step-title">
            <el-tag type="warning" effect="dark" round>Step 2</el-tag>
            <span class="step-text">画面描述与图文配置</span>
          </div>
          <el-form-item>
            <template #label>
              <span style="color: #909399; font-size: 12px;">你可以直接使用 AI 生成的 Prompt，也可以手动修改。在提示词中使用 [参考图名称] (不带@) 可自动唤起图片上传。带有 @ 的标签将被自动忽略。</span>
            </template>
            <el-input
                v-model="promptText"
                type="textarea"
                :rows="5"
                placeholder="例如：全景，水平视角。场景[日内花月书斋反打]，角色[李青]位于画面左侧..."
                class="custom-textarea prompt-box"
            />
          </el-form-item>

          <transition-group name="list" tag="div" class="dynamic-upload-grid">
            <div v-for="(item, index) in referenceImages" :key="item.id" class="upload-box-wrapper">
              <p class="tag-title">{{ item.tag }}</p>
              <el-upload
                  class="custom-uploader"
                  drag
                  action="#"
                  :auto-upload="false"
                  :show-file-list="false"
                  :on-change="(file) => handleFileChange(file, index)"
              >
                <div v-if="item.previewUrl" class="preview-wrapper">
                  <img :src="item.previewUrl" class="preview-image"/>
                  <div class="preview-overlay">点击更换</div>
                </div>
                <div v-else class="upload-placeholder">
                  <el-icon class="upload-icon">
                    <Plus/>
                  </el-icon>
                  <div class="upload-text">上传参考图</div>
                </div>
              </el-upload>
            </div>
          </transition-group>

          <div class="submit-wrapper">
            <el-button
                type="primary"
                size="large"
                @click="submitGenerateTask"
                :disabled="!isReadyToSubmit || isGenerating || !promptText"
                :loading="isGenerating"
                round
            >
              {{ submitButtonText }}
            </el-button>
          </div>
        </div>
      </el-form>

      <div v-if="resultImageUrl" class="result-section">
        <el-divider>生成结果</el-divider>
        <el-image :src="resultImageUrl" :preview-src-list="[resultImageUrl]" fit="contain"/>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import {ref, watch, computed} from 'vue'
import {Plus, MagicStick} from '@element-plus/icons-vue' // 引入了魔法棒图标
import {ElMessage} from 'element-plus'
import axios from 'axios'

// --- 状态数据 ---
const rawScript = ref('') // 新增：保存原始剧本
const isParsing = ref(false) // 新增：解析 loading 状态

const promptText = ref('')
const referenceImages = ref([])
const isGenerating = ref(false)
const resultImageUrl = ref('')
const pollingTimer = ref(null)

// --- 新增：调用剧本解析 API ---
const parseScript = async () => {
  if (!rawScript.value.trim()) {
    ElMessage.warning('请先输入剧本内容！')
    return
  }

  isParsing.value = true
  try {
    const res = await axios.post('http://localhost:5000/api/script/parse', {
      script: rawScript.value
    })

    if (res.data.success) {
      // 核心：把大模型的返回结果直接赋值给 promptText
      // 此时下面的 watch 会自动触发，提取出所有的 [@xxx] 并生成图片上传框！
      promptText.value = res.data.data.parsed_result
      ElMessage.success('剧本拆解成功，请补充对应的参考图！')
    } else {
      ElMessage.error(res.data.message || '剧本解析失败')
    }
  } catch (error) {
    ElMessage.error('请求解析接口异常：' + error.message)
  } finally {
    isParsing.value = false
  }
}

// --- 现有的监听和生成逻辑（无需改动逻辑核心） ---
// --- 修改后的监听和生成逻辑 ---
watch(promptText, (newVal) => {
  // 1. 正则依然只负责最基础的过滤：提取所有不含 @ 符号的括号内容
  const regex = /\[[^\]@]+\]/g
  let matches = newVal.match(regex) || []

  // 2. 新增业务逻辑过滤：剔除包含“输出”、“时长建议”等不需要生成图片框的标签
  matches = matches.filter(tag => {
    // 如果标签内包含 "输出" 或 "时长" 等字眼，则剔除 (返回 false)
    return !tag.includes('输出') && !tag.includes('时长')
    // 你可以在这里随时加上： && !tag.includes('其他过滤词')
  })

  // 3. 对 matches 进行去重，防止同一个标签生成多个上传框
  const uniqueMatches = [...new Set(matches)]

  const newRefImages = uniqueMatches.map((tag, index) => {
    const existing = referenceImages.value.find(item => item.tag === tag && !item._used)
    if (existing) {
      existing._used = true
      return existing
    }
    return {id: Date.now() + index, tag, file: null, previewUrl: ''}
  })

  // 清除内部状态标记
  newRefImages.forEach(item => delete item._used)
  referenceImages.value = newRefImages
})

const isReadyToSubmit = computed(() => {
  if (!promptText.value.trim()) return false
  if (referenceImages.value.length === 0) return true
  return referenceImages.value.every(item => item.file !== null)
})

const submitButtonText = computed(() => {
  if (isGenerating.value) return '图片渲染中...'
  if (referenceImages.value.length > 0 && !isReadyToSubmit.value) return '请补全所有资产参考图'
  return '开始渲染生成图片'
})

const handleFileChange = (uploadFile, index) => {
  const file = uploadFile.raw
  if (!file.type.startsWith('image/')) {
    ElMessage.error('请上传图片文件！')
    return
  }

  referenceImages.value[index].file = file
  const reader = new FileReader()
  reader.readAsDataURL(file)
  reader.onload = (e) => {
    referenceImages.value[index].previewUrl = e.target.result
  }
}

const submitGenerateTask = async () => {
  isGenerating.value = true
  try {
    const postData = new FormData()
    postData.append('prompt', promptText.value)

    referenceImages.value.forEach((item) => {
      if (item.file) {
        postData.append(`files`, item.file)
        postData.append(`tags`, item.tag)
      }
    })

    const res = await axios.post('http://localhost:5000/api/img/upload', postData, {
      headers: {'Content-Type': 'multipart/form-data'}
    })

    if (res.data.success) {
      ElMessage.success('渲染任务已提交，开始排队...')
      startPolling(res.data.data.task_id)
    }
  } catch (err) {
    ElMessage.error('渲染任务提交失败')
    isGenerating.value = false
  }
}

const startPolling = (taskId) => {
  if (pollingTimer.value) clearInterval(pollingTimer.value)

  pollingTimer.value = setInterval(async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/img/${taskId}`)
      const taskData = res.data.data

      if (taskData.status === 'SUCCEEDED') {
        clearInterval(pollingTimer.value)
        resultImageUrl.value = taskData.result_url
        isGenerating.value = false
        ElMessage.success('资产图片生成成功！')
      } else if (taskData.status === 'FAILED') {
        clearInterval(pollingTimer.value)
        isGenerating.value = false
        ElMessage.error('生成失败，请重试。')
      }
    } catch (error) {
      console.error(error)
    }
  }, 3000)
}
</script>

<style scoped>
/* =========== 新增 UI 模块样式 =========== */
.step-section {
  padding: 10px 0;
}

.step-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}

.step-text {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

.prompt-box {
  background-color: #f4f4f5; /* 让提示词框有一点只读/生成的视觉感 */
}

/* 略去基础样式，保持你原本的核心动态网格样式 */
.dynamic-upload-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 20px;
  margin: 20px 0;
}

.upload-box-wrapper {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 10px;
  text-align: center;
  border: 1px solid #ebeef5; /* 增加了一点边框让视觉更清晰 */
}

.tag-title {
  font-weight: bold;
  color: #409EFF;
  margin: 0 0 10px 0;
  font-size: 14px;
}

.custom-uploader :deep(.el-upload-dragger) {
  height: 120px;
  padding: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.preview-image {
  width: 100%;
  height: 120px;
  object-fit: cover;
}

.list-enter-active, .list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from, .list-leave-to {
  opacity: 0;
  transform: translateY(15px) scale(0.9);
}
</style>