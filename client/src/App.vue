<script setup>
import { ref, watch, onMounted } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import LoginModal from '@/components/LoginModal.vue'
import RegisterModal from '@/components/RegisterModal.vue'
import { useUserStore } from '@/stores/user'
import { usePreferencesStore } from '@/stores/preferences'

const userStore = useUserStore()
const preferencesStore = usePreferencesStore()
const showLoginModal = ref(false)
const showRegisterModal = ref(false)

const openLogin = () => {
  showRegisterModal.value = false
  showLoginModal.value = true
}

const openRegister = () => {
  showLoginModal.value = false
  showRegisterModal.value = true
}

const closeModals = () => {
  showLoginModal.value = false
  showRegisterModal.value = false
}

const handleLogout = () => {
  userStore.logout()
  usePreferencesStore().resetToDefaults()
}

const applyTheme = (dark) => {
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
}

watch(() => preferencesStore.darkMode, (val) => {
  applyTheme(val)
})

onMounted(() => {
  userStore.initializeUser()
  applyTheme(preferencesStore.darkMode)
})
</script>

<template>
  <header>
    <div class="header-content">
      <RouterLink to="/" style="text-decoration: none; color: inherit;">Leitura Fácil 💚</RouterLink>
      <div class="header-actions">
        <button @click="preferencesStore.toggleDarkMode()" class="theme-toggle" :title="preferencesStore.darkMode ? 'Modo claro' : 'Modo escuro'">
          {{ preferencesStore.darkMode ? '☀️' : '🌙' }}
        </button>
      </div>
      <div class="auth-buttons">
        <template v-if="userStore.isLoggedIn()">
          <span class="user-name">{{ userStore.user?.nome }}</span>
          <RouterLink to="/saved" class="btn btn-saved">📚 Meus Textos</RouterLink>
          <button @click="handleLogout" class="btn btn-logout">Sair</button>
        </template>
        <template v-else>
          <button @click="openLogin" class="btn btn-login">Entrar</button>
          <button @click="openRegister" class="btn btn-register">Registrar</button>
        </template>
      </div>
    </div>
  </header>

  <LoginModal :show="showLoginModal" @close="closeModals" @switch-to-register="openRegister" />
  <RegisterModal :show="showRegisterModal" @close="closeModals" @switch-to-login="openLogin" />

  <RouterView />
</template>

<style scoped>
header {
  background-color: var(--color-header);
  padding: 20px;
  font-family: Arial, Helvetica, sans-serif;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 24px;
  font-weight: bold;
  flex-wrap: wrap;
  gap: 8px;
}

.header-actions {
  display: flex;
  align-items: center;
}

.theme-toggle {
  background: none;
  border: none;
  font-size: 22px;
  cursor: pointer;
  padding: 4px 8px;
  line-height: 1;
  border-radius: 4px;
  transition: background-color 0.3s ease;
}

.theme-toggle:hover {
  background-color: rgba(0, 0, 0, 0.08);
}

.auth-buttons {
  display: flex;
  gap: 10px;
  align-items: center;
}

.user-name {
  font-size: 16px;
  font-weight: 600;
  color: inherit;
}

.btn {
  padding: 10px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.btn-login {
  background-color: transparent;
  color: inherit;
  border: 1px solid var(--color-text);
}

.btn-login:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.btn-saved {
  background-color: transparent;
  color: inherit;
  border: 1px solid var(--color-text);
  text-decoration: none;
}

.btn-saved:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.btn-logout {
  background-color: var(--color-danger);
  color: white;
}

.btn-logout:hover {
  background-color: var(--color-danger-hover);
}

@media (max-width: 480px) {
  header {
    padding: 12px 16px;
  }

  .header-content {
    font-size: 18px;
  }

  .btn {
    padding: 8px 12px;
    font-size: 13px;
  }

  .auth-buttons {
    gap: 6px;
  }
}
</style>