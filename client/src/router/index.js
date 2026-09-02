import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import ReadView from '@/views/ReadView.vue'
import SavedTextsView from '@/views/SavedTextsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/read',
      name: 'read',
      component: ReadView,
    },
    {
      path: '/saved',
      name: 'saved',
      component: SavedTextsView,
    },
  ],
})

export default router
