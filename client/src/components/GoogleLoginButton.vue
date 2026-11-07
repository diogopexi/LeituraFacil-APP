<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { useUserStore } from '@/stores/user'

const emit = defineEmits(['success', 'error'])
const userStore = useUserStore()
const ready = ref(false)
const configured = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID)
let script
let observer

function renderButton() {
  if (!configured || !window.google?.accounts?.id) return
  const el = document.getElementById('google-login-button')
  if (!el) return
  el.innerHTML = ''
  window.google.accounts.id.initialize({
    client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    callback: async (response) => {
      try { await userStore.loginWithGoogle(response.credential); emit('success') }
      catch (e) { emit('error', e) }
    }
  })
  window.google.accounts.id.renderButton(el, { theme: 'outline', size: 'large', width: 330, text: 'continue_with', shape: 'rectangular' })
  ready.value = true
}

onMounted(() => {
  if (!configured) return
  if (window.google?.accounts?.id) return renderButton()
  script = document.createElement('script')
  script.src = 'https://accounts.google.com/gsi/client'
  script.async = true
  script.defer = true
  script.onload = renderButton
  document.head.appendChild(script)
  observer = new MutationObserver(renderButton)
  observer.observe(document.body, { childList: true, subtree: true })
})
onUnmounted(() => observer?.disconnect())
</script>

<template>
  <div class="google-wrap">
    <div v-if="configured" id="google-login-button"></div>
    <button v-else class="google-placeholder" type="button" disabled title="Configure VITE_GOOGLE_CLIENT_ID para habilitar">G <span>Continuar com Google</span></button>
    <small v-if="!configured">O login com Google precisa ser configurado no projeto.</small>
  </div>
</template>

<style scoped>
.google-wrap{display:grid;gap:7px;justify-items:center;margin-top:15px}.google-wrap>div{min-height:40px;max-width:100%;overflow:hidden}.google-placeholder{height:42px;width:100%;border:1px solid var(--color-border-light);border-radius:7px;background:var(--color-surface);color:var(--color-text);font-weight:700;display:flex;align-items:center;justify-content:center;gap:10px;opacity:.7}.google-placeholder span{font-size:13px}.google-wrap small{font-size:9px;color:var(--color-text-muted);text-align:center}
</style>
