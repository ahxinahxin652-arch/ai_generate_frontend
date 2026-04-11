import { createRouter, createWebHashHistory } from 'vue-router'
// import HomeView from '../views/HomeView.vue'
import GenerateImage from "@/views/GenerateImage.vue";
import GenerateImage_3d from "@/views/GenerateImage_3d.vue";
import GenerateFace from "@/views/GenerateFace.vue";

const routes = [
  {
    path: '/',
    name: 'home',
    component: GenerateFace
  },
  {
    path: '/gi',
    name: 'gi',
    component: GenerateImage
  },
  {
    path: '/gi3d',
    name: 'gi3d',
    component: GenerateImage_3d
  },
  {
    path: '/face',
    name: 'face',
    component: GenerateFace
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
