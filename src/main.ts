import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

const app = createApp(App)

// 1. 注册插件 (Vue 官方插件或第三方 UI 库插件)
app.use(router)
app.use(ElementPlus)

// 2. 挂载应用
app.mount('#app')
