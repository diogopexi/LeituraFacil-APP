import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import ReadView from '@/views/ReadView.vue'
import SavedTextsView from '@/views/SavedTextsView.vue'
import HowItWorksView from '@/views/HowItWorksView.vue'
import ResourcesView from '@/views/ResourcesView.vue'
import AboutView from '@/views/AboutView.vue'
import SettingsView from '@/views/SettingsView.vue'
import VerifyEmailView from '@/views/VerifyEmailView.vue'
import SavedFontsView from '@/views/SavedFontsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    { path: '/como-funciona', name: 'how-it-works', component: HowItWorksView },
    { path: '/recursos', name: 'resources', component: ResourcesView },
    { path: '/sobre', name: 'about', component: AboutView },
    { path: '/configuracoes', name: 'settings', component: SettingsView },
    { path: '/verificar-email', name: 'verify-email', component: VerifyEmailView },
    { path: '/fontes-salvas', name: 'saved-fonts', component: SavedFontsView },
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
