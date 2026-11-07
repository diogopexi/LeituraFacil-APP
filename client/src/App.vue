<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import LoginModal from '@/components/LoginModal.vue'
import RegisterModal from '@/components/RegisterModal.vue'
import { useUserStore } from '@/stores/user'
import { usePreferencesStore } from '@/stores/preferences'

const userStore = useUserStore()
const preferencesStore = usePreferencesStore()
const route = useRoute()
const showLoginModal = ref(false)
const showRegisterModal = ref(false)
const mobileMenuOpen = ref(false)
const profileOpen = ref(false)

const openLogin = () => {
  mobileMenuOpen.value = false
  showRegisterModal.value = false
  showLoginModal.value = true
}
const openRegister = () => {
  mobileMenuOpen.value = false
  showLoginModal.value = false
  showRegisterModal.value = true
}
const closeModals = () => {
  showLoginModal.value = false
  showRegisterModal.value = false
}
const toggleProfile = () => { profileOpen.value = !profileOpen.value }
const closeProfile = () => { profileOpen.value = false }
const handleLogout = () => {
  userStore.logout()
  preferencesStore.resetToDefaults()
  mobileMenuOpen.value = false
  profileOpen.value = false
}
const applyTheme = (dark) => document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
const syncSystemTheme = () => { if (preferencesStore.themeMode === 'system') preferencesStore.setThemeMode('system') }
watch(() => preferencesStore.darkMode, applyTheme)
watch(() => preferencesStore.themeMode, syncSystemTheme)
let mediaQuery
onMounted(() => {
  userStore.initializeUser()
  applyTheme(preferencesStore.darkMode)
  document.addEventListener('click', closeProfile)
  mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)')
  mediaQuery?.addEventListener?.('change', syncSystemTheme)
})
onBeforeUnmount(() => { document.removeEventListener('click', closeProfile); mediaQuery?.removeEventListener?.('change', syncSystemTheme) })
</script>

<template>
  <header class="site-header">
    <div class="header-inner">
      <RouterLink to="/" class="brand" @click="mobileMenuOpen = false">
        <img class="brand-logo" :src="preferencesStore.darkMode ? '/logo-leitura-facil-horizontal-dark.svg' : '/logo-leitura-facil-horizontal.svg'" alt="Leitura Fácil" />
      </RouterLink>

      <nav class="desktop-nav" aria-label="Navegação principal">
        <RouterLink to="/" :class="{ active: route.path === '/' }">Início</RouterLink>
        <RouterLink to="/como-funciona" :class="{ active: route.path === '/como-funciona' }">Como funciona</RouterLink>
        <RouterLink to="/recursos" :class="{ active: route.path === '/recursos' }">Recursos</RouterLink>
        <RouterLink to="/sobre" :class="{ active: route.path === '/sobre' }">Sobre nós</RouterLink>
      </nav>

      <div class="header-right">
        <button class="icon-button theme-button" @click="preferencesStore.toggleDarkMode()" :aria-label="preferencesStore.darkMode ? 'Modo claro' : 'Modo escuro'">
          {{ preferencesStore.darkMode ? '☀' : '☾' }}
        </button>
        <div v-if="userStore.isLoggedIn()" class="profile-wrap" @click.stop>
          <button class="user-avatar" @click="toggleProfile" aria-label="Abrir menu do perfil"><img v-if="userStore.user?.foto" :src="userStore.user.foto" alt=""><span v-else>{{ (userStore.user?.nome || 'U').slice(0,2).toUpperCase() }}</span></button><span v-if="userStore.user?.emailVerificado === false" class="profile-warning-dot" aria-label="E-mail não verificado"></span>
          <div v-if="profileOpen" class="profile-menu">
            <div class="profile-menu-head"><div class="mini-avatar"><img v-if="userStore.user?.foto" :src="userStore.user.foto" alt=""><span v-else>{{ (userStore.user?.nome || 'U').slice(0,1).toUpperCase() }}</span></div><div><b>{{ userStore.user?.nome }}</b><small>{{ userStore.user?.email }}</small></div></div>
            <RouterLink to="/saved" @click="closeProfile">▱ Meus textos</RouterLink>
            <RouterLink to="/fontes-salvas" @click="closeProfile">Aa Fontes salvas</RouterLink>
            <RouterLink to="/configuracoes" @click="closeProfile">⚙ Configurações</RouterLink>
            <button class="profile-logout" @click="handleLogout">↪ Sair da conta</button>
          </div>
        </div>
        <template v-else>
          <button class="outline-button" @click="openLogin">Entrar</button>
          <button class="primary-button small" @click="openRegister">Registrar</button>
        </template>
        <button class="mobile-menu-button" @click="mobileMenuOpen = !mobileMenuOpen" aria-label="Abrir menu">☰</button>
      </div>
    </div>

    <div v-if="mobileMenuOpen" class="mobile-menu">
      <RouterLink to="/como-funciona" @click="mobileMenuOpen = false">Como funciona</RouterLink>
      <RouterLink to="/recursos" @click="mobileMenuOpen = false">Recursos</RouterLink>
      <RouterLink to="/sobre" @click="mobileMenuOpen = false">Sobre nós</RouterLink>
      <RouterLink v-if="userStore.isLoggedIn()" to="/saved" @click="mobileMenuOpen = false">Meus textos</RouterLink>
      <RouterLink v-if="userStore.isLoggedIn()" to="/fontes-salvas" @click="mobileMenuOpen = false">Fontes salvas</RouterLink><RouterLink v-if="userStore.isLoggedIn()" to="/configuracoes" @click="mobileMenuOpen = false">Configurações</RouterLink>
      <button v-if="userStore.isLoggedIn()" class="mobile-logout" @click="handleLogout">Sair</button>
      <template v-else>
        <button @click="openLogin">Entrar</button>
        <button class="mobile-register" @click="openRegister">Registrar</button>
      </template>
    </div>
  </header>

  <LoginModal :show="showLoginModal" @close="closeModals" @switch-to-register="openRegister" />
  <RegisterModal :show="showRegisterModal" @close="closeModals" @switch-to-login="openLogin" />
  <RouterView />
</template>

<style scoped>
.profile-wrap{position:relative}.user-avatar{position:relative;width:39px;height:39px;border-radius:50%;padding:0;border:2px solid var(--line);background:var(--green-soft);color:var(--green-dark);display:grid;place-items:center;font-size:11px;font-weight:900;overflow:hidden}.profile-wrap{display:block}.user-avatar img,.mini-avatar img{width:100%;height:100%;object-fit:cover}.profile-menu{position:absolute;right:0;top:49px;width:255px;padding:9px;background:var(--white);border:1px solid var(--line);border-radius:14px;overflow:hidden;box-shadow:0 16px 35px rgba(20,35,55,.16);z-index:300}.profile-menu-head{display:flex;gap:10px;align-items:center;padding:10px;border-bottom:1px solid var(--line);margin-bottom:5px}.mini-avatar{width:38px;height:38px;border-radius:50%;overflow:hidden;display:grid;place-items:center;background:var(--green-soft);color:var(--green-dark);font-weight:900;font-size:11px;flex:none}.profile-menu-head b,.profile-menu-head small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.profile-menu-head b{font-size:12px;color:var(--text)}.profile-menu-head small{font-size:9px;color:var(--muted);max-width:170px}.profile-menu a,.profile-logout{display:block;width:100%;padding:10px 11px;border:0;background:transparent;color:var(--text);text-align:left;text-decoration:none;border-radius:8px;font-size:11px;font-weight:750}.profile-menu a:hover,.profile-logout:hover{background:var(--cream-2)}.profile-logout{color:var(--danger);border-top:1px solid var(--line);margin-top:4px;border-radius:0 0 8px 8px}.profile-warning-dot{position:absolute;right:-2px;top:-2px;width:11px;height:11px;border-radius:50%;background:#F4A340;border:2px solid var(--white);pointer-events:none}.profile-menu-head{min-width:0}.profile-menu-head>div:last-child{min-width:0;max-width:175px}@media(max-width:700px){.profile-menu{right:-10px}}
</style>
