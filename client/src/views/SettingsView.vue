<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { useUserStore } from '@/stores/user'
import { usePreferencesStore } from '@/stores/preferences'

const API_BASE = import.meta.env.VITE_API_BASE || '/api'
const router = useRouter()
const userStore = useUserStore()
const preferencesStore = usePreferencesStore()
const profileName = ref('')
const profilePhoto = ref('')
const textos = ref([])
const presets = ref([])
const loading = ref(true)
const error = ref('')
const success = ref('')
const savingProfile = ref(false)
const sendingVerification = ref(false)

const currentUser = computed(() => userStore.user || {})
const initials = computed(() => (profileName.value || currentUser.value.nome || 'U').trim().slice(0, 2).toUpperCase())
const emailAlert = computed(() => currentUser.value.emailVerificado === false)
function headers() { return { Authorization: `Bearer ${userStore.token}` } }
function flash(message) { success.value = message; setTimeout(() => success.value = '', 2500) }

async function loadAll() {
  if (!userStore.isLoggedIn()) { router.push('/'); return }
  loading.value = true; error.value = ''
  try {
    const [u, t, p] = await Promise.all([
      axios.get(`${API_BASE}/users/${userStore.user._id}`, { headers: headers() }),
      axios.get(`${API_BASE}/users/${userStore.user._id}/textos`, { headers: headers() }),
      axios.get(`${API_BASE}/users/${userStore.user._id}/config-presets`, { headers: headers() })
    ])
    userStore.user = u.data; localStorage.setItem('user', JSON.stringify(u.data))
    profileName.value = u.data.nome || ''; profilePhoto.value = u.data.foto || ''
    textos.value = t.data || []; presets.value = p.data || []
  } catch (e) { error.value = e.response?.data?.erro || 'Não foi possível carregar sua conta.' }
  finally { loading.value = false }
}

async function saveProfile() {
  savingProfile.value = true; error.value = ''
  try {
    const res = await axios.put(`${API_BASE}/users/${userStore.user._id}/profile`, { nome: profileName.value, foto: profilePhoto.value }, { headers: headers() })
    userStore.user = res.data; localStorage.setItem('user', JSON.stringify(res.data)); flash('✓ Perfil atualizado!')
  } catch (e) { error.value = e.response?.data?.erro || 'Erro ao atualizar perfil.' }
  finally { savingProfile.value = false }
}

function choosePhoto(event) {
  const file = event.target.files?.[0]; if (!file) return
  if (!file.type.startsWith('image/')) { error.value = 'Escolha uma imagem.'; return }
  if (file.size > 2 * 1024 * 1024) { error.value = 'A foto deve ter no máximo 2 MB.'; return }
  const reader = new FileReader(); reader.onload = () => { profilePhoto.value = reader.result }; reader.readAsDataURL(file)
}
function setMode(mode) { preferencesStore.setThemeMode(mode) }
function openText(texto) { router.push({ path: '/saved', query: { abrir: texto._id } }) }
function goBack() { router.push('/') }

async function sendVerification() {
  sendingVerification.value = true; error.value = ''
  try {
    await axios.post(`${API_BASE}/auth/resend-verification`, { email: currentUser.value.email })
    router.push({ path: '/verificar-email', query: { email: currentUser.value.email } })
  } catch (e) { error.value = e.response?.data?.erro || 'Não foi possível enviar o código.' }
  finally { sendingVerification.value = false }
}

async function deletePreset(preset) {
  try {
    await axios.delete(`${API_BASE}/users/${userStore.user._id}/config-presets/${preset._id}`, { headers: headers() })
    presets.value = presets.value.filter(p => p._id !== preset._id); flash('Fonte removida.')
  } catch (e) { error.value = e.response?.data?.erro || 'Erro ao remover fonte.' }
}
function applyPreset(preset) { preferencesStore.loadFromConfig(preset.configuracao); flash(`✓ “${preset.nome}” aplicada aos próximos textos.`) }

onMounted(loadAll)
</script>

<template>
  <main class="account-page"><div class="account-shell">
    <div class="account-top"><div><span class="account-kicker">MINHA CONTA</span><h1>Configurações</h1><p>Gerencie seu perfil, seus textos e as fontes que deseja reutilizar.</p></div><button class="back-btn" @click="goBack">← Voltar</button></div>
    <p v-if="error" class="account-error">{{ error }}</p><p v-if="success" class="account-success">{{ success }}</p>
    <div v-if="loading" class="account-loading">Carregando sua conta...</div>
    <div v-else class="account-grid">
      <section class="account-card profile-card"><div class="card-title"><span class="card-icon">●</span><div><h2>Perfil</h2><p>Seus dados pessoais</p></div></div>
        <div class="profile-editor"><div class="photo-column"><div class="profile-photo"><img v-if="profilePhoto" :src="profilePhoto" alt="Foto de perfil"><span v-else>{{ initials }}</span></div><label class="photo-btn">Trocar foto<input type="file" accept="image/*" @change="choosePhoto"></label></div>
          <div class="profile-fields"><label>Nome completo<input v-model="profileName" type="text" autocomplete="name"></label><label>E-mail<div class="email-field"><input :value="currentUser.email || ''" type="email" disabled><span v-if="emailAlert" class="email-alert">⚠️</span></div></label>
            <small v-if="emailAlert" class="email-note">Seu e-mail ainda não foi verificado.</small><button v-if="emailAlert" class="verify-button" :disabled="sendingVerification" @click="sendVerification">{{ sendingVerification ? 'Enviando código...' : '✉ Verificar e-mail' }}</button><button class="primary-action" :disabled="savingProfile" @click="saveProfile">{{ savingProfile ? 'Salvando...' : 'Salvar perfil' }}</button>
          </div>
        </div>
      </section>
      <section class="account-card mode-card"><div class="card-title"><span class="card-icon">◐</span><div><h2>Modo</h2><p>Escolha como o site deve aparecer.</p></div></div><div class="mode-options"><button :class="{selected: preferencesStore.themeMode === 'light'}" @click="setMode('light')">☀️<b>Claro</b><small>Sempre claro</small></button><button :class="{selected: preferencesStore.themeMode === 'dark'}" @click="setMode('dark')">🌙<b>Escuro</b><small>Sempre escuro</small></button><button :class="{selected: preferencesStore.themeMode === 'system'}" @click="setMode('system')">💻<b>Sistema</b><small>Segue seu dispositivo</small></button></div></section>
      <section class="account-card wide-card"><div class="card-title"><span class="card-icon">▱</span><div><h2>Meus textos</h2><p>Textos salvos na sua conta.</p></div></div><div v-if="!textos.length" class="empty-state">Você ainda não tem textos salvos.</div><div v-else class="saved-items"><button v-for="texto in textos" :key="texto._id" class="saved-item" @click="openText(texto)"><span class="saved-file">▤</span><span><b>{{ texto.titulo }}</b><small>{{ new Date(texto.ultimoAcesso).toLocaleDateString('pt-BR') }}</small></span><span>›</span></button></div></section>
      <section class="account-card wide-card"><div class="card-title"><span class="card-icon">Aa</span><div><h2>Fontes salvas</h2><p>Use uma fonte salva nos próximos textos.</p></div></div><div v-if="!presets.length" class="empty-state">Nenhuma fonte salva ainda. Salve uma fonte pela área de configurações de leitura.</div><div v-else class="preset-list"><div v-for="preset in presets" :key="preset._id" class="preset-item"><div><b>{{ preset.nome }}</b><small>{{ preset.configuracao?.nomeFonte || 'OpenDyslexic' }} · {{ Math.round((preset.configuracao?.tamanhoFonte || 1) * 100) }}%</small></div><div class="preset-actions"><button @click="applyPreset(preset)">Aplicar</button><button class="delete-action" @click="deletePreset(preset)">Excluir</button></div></div></div></section>
    </div>
  </div></main>
</template>
<style scoped>
.account-page{min-height:calc(100vh - 72px);padding:42px 22px 70px;background:var(--color-background)}.account-shell{max-width:1040px;margin:auto}.account-top{display:flex;justify-content:space-between;gap:20px;align-items:flex-end;margin-bottom:25px}.account-kicker{font-size:11px;font-weight:900;letter-spacing:.14em;color:var(--green-dark)}.account-top h1{font-size:34px;line-height:1.15;color:var(--navy);margin:6px 0}.account-top p{font-size:13px;color:var(--muted);max-width:650px}.back-btn{border:1px solid var(--line);background:var(--white);color:var(--text);border-radius:10px;padding:10px 15px;font-weight:750}.account-grid{display:grid;grid-template-columns:1.25fr .75fr;gap:18px}.account-card{background:var(--white);border:1px solid var(--line);border-radius:18px;padding:24px;box-shadow:0 8px 25px rgba(25,42,65,.045)}.wide-card{grid-column:1/-1}.card-title{display:flex;gap:12px;align-items:center;margin-bottom:21px}.card-title h2{font-size:18px;color:var(--navy)}.card-title p{font-size:11px;color:var(--muted);margin-top:2px}.card-icon{width:36px;height:36px;border-radius:11px;display:grid;place-items:center;background:var(--green-soft);color:var(--green-dark);font-weight:900}.profile-editor{display:grid;grid-template-columns:145px 1fr;gap:28px}.photo-column{display:flex;flex-direction:column;align-items:center;gap:10px}.profile-photo{width:112px;height:112px;border-radius:50%;background:var(--green-soft);display:grid;place-items:center;overflow:hidden;color:var(--green-dark);font-size:27px;font-weight:900;border:3px solid var(--white);box-shadow:0 0 0 1px var(--line)}.profile-photo img{width:100%;height:100%;object-fit:cover}.photo-btn{font-size:11px;font-weight:800;color:var(--navy-2);cursor:pointer}.photo-btn input{display:none}.profile-fields{display:grid;gap:13px}.profile-fields label{display:grid;gap:6px;font-size:11px;color:var(--muted);font-weight:700}.profile-fields input{height:39px;border:1px solid var(--line);border-radius:9px;padding:0 11px;background:var(--cream-2);color:var(--text)}.email-field{display:flex;align-items:center;gap:7px}.email-field input{flex:1}.email-alert{font-size:15px}.email-note{font-size:10px;color:#a16a19}.primary-action,.verify-button{height:39px;border:0;border-radius:9px;font-weight:800}.primary-action{background:var(--green);color:#fff}.verify-button{background:var(--cream-2);border:1px solid var(--line);color:var(--navy)}.mode-options{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.mode-options button{border:1px solid var(--line);border-radius:11px;background:var(--cream-2);padding:13px 8px;display:grid;gap:4px;text-align:center;color:var(--text)}.mode-options button.selected{border-color:var(--green);box-shadow:0 0 0 2px rgba(66,173,121,.12)}.mode-options b{font-size:12px}.mode-options small{font-size:9px;color:var(--muted)}.saved-items,.preset-list{display:grid;gap:8px}.saved-item,.preset-item{border:1px solid var(--line);background:var(--cream-2);border-radius:10px}.saved-item{display:grid;grid-template-columns:34px 1fr 20px;align-items:center;text-align:left;padding:11px;color:var(--text);width:100%}.saved-file{font-size:18px;color:var(--green-dark)}.saved-item b,.saved-item small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.saved-item b{font-size:12px}.saved-item small{font-size:9px;color:var(--muted);margin-top:3px}.preset-item{display:flex;justify-content:space-between;gap:15px;align-items:center;padding:12px}.preset-item b,.preset-item small{display:block}.preset-item b{font-size:12px}.preset-item small{font-size:9px;color:var(--muted);margin-top:3px}.preset-actions{display:flex;gap:6px}.preset-actions button{border:1px solid var(--line);background:var(--white);border-radius:7px;padding:7px 10px;font-size:10px;font-weight:800;color:var(--navy)}.preset-actions .delete-action{color:var(--danger)}.empty-state,.account-loading{text-align:center;padding:28px;color:var(--muted);font-size:12px}.account-error,.account-success{padding:10px 12px;border-radius:9px;font-size:11px;margin-bottom:14px}.account-error{background:#fff0f0;color:#a52b2b}.account-success{background:var(--green-soft);color:var(--green-dark)}@media(max-width:760px){.account-grid{grid-template-columns:1fr}.profile-editor{grid-template-columns:1fr}.mode-options{grid-template-columns:1fr}.account-top{align-items:flex-start;flex-direction:column}.wide-card{grid-column:auto}}
</style>
