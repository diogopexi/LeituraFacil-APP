<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import axios from 'axios'
import { usePreferencesStore } from '@/stores/preferences'
import { usePaginationStore } from '@/stores/pagination'
import { useReaderStore } from '@/stores/reader'
import { useUserStore } from '@/stores/user'
import { useTextStore } from '@/stores/text'
import { useRouter } from 'vue-router'

defineProps({ open: Boolean })
const emit = defineEmits(['close'])
const preferencesStore = usePreferencesStore()
const paginationStore = usePaginationStore()
const readerStore = useReaderStore()
const userStore = useUserStore()
const textStore = useTextStore()
const router = useRouter()
const feedbackText = ref('')
const saveTitle = ref('')
const saving = ref(false)
const presetSaving = ref(false)
const presetName = ref('')
const presets = ref([])

const themes = [
  { id: 'light', label: 'Branco', color: '#FFFFFF', text: '#172033', highlight: '#CBE8D4' },
  { id: 'cream', label: 'Creme', color: '#FAF5E8', text: '#263238', highlight: '#DDECC8' },
  { id: 'blue', label: 'Azul', color: '#EAF2FF', text: '#173A79', highlight: '#C9DCF9' },
  { id: 'green', label: 'Verde', color: '#EEF8F1', text: '#214B35', highlight: '#CBE8D4' },
  { id: 'lavender', label: 'Lilás', color: '#F2F0FA', text: '#3D385A', highlight: '#DDD7F3' },
  { id: 'dark', label: 'Azul escuro', color: '#13264D', text: '#F5F8FF', highlight: '#3D786C' },
]



function showFeedback(msg) {
  feedbackText.value = msg
  window.clearTimeout(showFeedback.timer)
  showFeedback.timer = window.setTimeout(() => { feedbackText.value = '' }, 2200)
}
function applyTheme(id) { preferencesStore.applyTheme(id) }
function toggleGuide() { preferencesStore.guideLine = !preferencesStore.guideLine }
function toggleHighlight() { preferencesStore.wordHighlight = !preferencesStore.wordHighlight }
function previousPage() { readerStore.stop(); paginationStore.decreaseScroll() }
function nextPage() {
  readerStore.stop()
  paginationStore.increaseScroll(textStore.tokens.filter(t => t.isWord).length)
}

async function saveTexto() {
  if (!userStore.isLoggedIn()) return showFeedback('Entre na conta para salvar.')
  saving.value = true
  const conteudo = textStore.originalText || textStore.tokens.map(t => t.text).join('')
  const titulo = saveTitle.value.trim() || conteudo.trim().slice(0, 50) || 'Sem título'
  try {
    const res = await axios.post(`${import.meta.env.VITE_API_BASE || '/api'}/users/${userStore.user._id}/textos`, { titulo, conteudo }, { headers: { Authorization: `Bearer ${userStore.token}` } })
    textStore.setSavedId(res.data._id)
    showFeedback('✓ Texto salvo!')
    saveTitle.value = ''
    setTimeout(() => router.push('/saved'), 350)
  } catch (e) { showFeedback(e.response?.data?.erro || 'Erro ao salvar texto.') }
  finally { saving.value = false }
}

async function loadPresets() {
  if (!userStore.isLoggedIn()) return
  try {
    const res = await axios.get(`${import.meta.env.VITE_API_BASE || '/api'}/users/${userStore.user._id}/config-presets`, { headers: { Authorization: `Bearer ${userStore.token}` } })
    presets.value = res.data || []
  } catch { presets.value = [] }
}
async function savePreset() {
  if (!userStore.isLoggedIn()) return showFeedback('Entre na conta para salvar configurações.')
  if (!presetName.value.trim()) return showFeedback('Digite um nome para a fonte.')
  presetSaving.value = true
  try {
    const res = await axios.post(`${import.meta.env.VITE_API_BASE || '/api'}/users/${userStore.user._id}/config-presets`, { nome: presetName.value.trim(), configuracao: preferencesStore.toServerObject() }, { headers: { Authorization: `Bearer ${userStore.token}` } })
    presets.value.unshift(res.data); presetName.value = ''; showFeedback('✓ Fonte salva!')
  } catch (e) { showFeedback(e.response?.data?.erro || 'Erro ao salvar configuração.') }
  finally { presetSaving.value = false }
}
function applyPreset(preset) { preferencesStore.loadFromConfig(preset.configuracao); showFeedback(`✓ “${preset.nome}” aplicada.`) }
async function removePreset(preset) {
  try { await axios.delete(`${import.meta.env.VITE_API_BASE || '/api'}/users/${userStore.user._id}/config-presets/${preset._id}`, { headers: { Authorization: `Bearer ${userStore.token}` } }); presets.value = presets.value.filter(p => p._id !== preset._id); showFeedback('Configuração removida.') }
  catch (e) { showFeedback(e.response?.data?.erro || 'Erro ao remover configuração.') }
}
function handleReset() { preferencesStore.resetToDefaults(); paginationStore.resetScroll(); showFeedback('Configurações resetadas') }
function goHome() { emit('close'); router.push('/') }
function loadVoices() { readerStore.loadVoices() }

watch(() => userStore.user?._id, (id) => { if (id) loadPresets() }, { immediate: true })
watch(() => preferencesStore.speed, (newSpeed, oldSpeed) => {
  if (newSpeed === oldSpeed || !readerStore.isPlaying || readerStore.isPaused) return
  const current = readerStore.currentWordIndex
  readerStore.stop()
  if (current !== null) readerStore.startFromWord(current)
})

onMounted(() => { loadVoices(); window.speechSynthesis?.addEventListener('voiceschanged', loadVoices) })
onUnmounted(() => { window.speechSynthesis?.removeEventListener('voiceschanged', loadVoices) })
</script>

<template>
  <div v-if="open" class="sidebar-backdrop" @click="emit('close')"></div>
  <aside class="settings-panel" :class="{ open }">
    <div class="panel-top"><div class="panel-title"><span class="settings-icon">⚙</span><h2>Configurações</h2></div><button class="sidebar-close" @click="emit('close')">×</button></div>

    <section class="settings-section">
      <h3>↕ <span>Espaçamento</span></h3>
      <div class="setting-row"><span>Altura das linhas</span><b>{{ preferencesStore.lineHeight.toFixed(1) }}</b><div class="stepper"><button type="button" @click="preferencesStore.decreaseLineHeight()">−</button><button type="button" @click="preferencesStore.increaseLineHeight()">+</button></div></div>
      <div class="setting-row"><span>Espaço entre palavras</span><b>{{ preferencesStore.wordSpacing.toFixed(1) }}</b><div class="stepper"><button type="button" @click="preferencesStore.decreaseWordSpacing()">−</button><button type="button" @click="preferencesStore.increaseWordSpacing()">+</button></div></div>
      <div class="setting-row"><span>Espaço entre letras</span><b>{{ preferencesStore.letterSpacing.toFixed(1) }}</b><div class="stepper"><button type="button" @click="preferencesStore.decreaseLetterSpacing()">−</button><button type="button" @click="preferencesStore.increaseLetterSpacing()">+</button></div></div>
      <div class="setting-row"><span>Tamanho do texto</span><b>{{ Math.round(preferencesStore.fontScale * 100) }}%</b><div class="stepper"><button type="button" @click="preferencesStore.decreaseFontScale()">−</button><button type="button" @click="preferencesStore.increaseFontScale()">+</button></div></div>
      <div class="setting-row page-size-row"><span>Palavras por página</span><select v-model="paginationStore.pageSizeOption" class="mini-select" @change="paginationStore.setPageSize(paginationStore.pageSizeOption)"><option value="normal">Normal</option><option v-for="n in 10" :key="n" :value="String(n)">{{ n }}</option></select></div>
    </section>

    <section class="settings-section">
      <h3>◉ <span>Aparência</span></h3>
      <label class="field-label">Fonte</label>
      <select v-model="preferencesStore.fontFamily" class="select-control"><option>OpenDyslexic</option><option>Inter</option><option>Arial</option><option>Verdana</option></select>
<label class="field-label">Tema de leitura</label>
      <div class="theme-options" aria-label="Temas de leitura">
        <button v-for="theme in themes" :key="theme.id" class="theme-option" :class="{ selected: preferencesStore.backgroundColor === theme.color }" :title="theme.label" :aria-label="theme.label" @click="applyTheme(theme.id)">
          <span class="theme-sample" :style="{ background: theme.color, color: theme.text }">Aa</span>
        </button>
      </div>
    </section>

    <section class="settings-section">
      <h3>◈ <span>Navegação</span></h3>
      <div class="toggle-row"><span>Linha guia</span><button class="switch" :class="{ on: preferencesStore.guideLine }" @click="toggleGuide"><span></span></button></div>
      <div class="toggle-row"><span>Destaque por palavra</span><button class="switch" :class="{ on: preferencesStore.wordHighlight }" @click="toggleHighlight"><span></span></button></div>
      <div class="nav-row"><button :disabled="paginationStore.startIndex === 0" @click="previousPage">‹ Anterior</button><span>Página {{ Math.floor(paginationStore.startIndex / paginationStore.maxWords) + 1 }}</span><button :disabled="paginationStore.startIndex + paginationStore.maxWords >= textStore.tokens.filter(t => t.isWord).length" @click="nextPage">Próximo ›</button></div>
    </section>

    <section class="settings-section reading-section">
      <h3>🔊 <span>Leitura em voz alta</span></h3>
      <div class="speed-line"><span>Velocidade</span></div>
      <input class="range-control" type="range" min="0.5" max="2" step="0.1" v-model.number="preferencesStore.speed" />
      <select v-model="readerStore.selectedVoiceURI" class="select-control"><option :value="null">Voz automática</option><option v-for="v in readerStore.voices" :key="v.voiceURI" :value="v.voiceURI">{{ v.name }}</option></select>
      <div class="reading-actions"><button class="listen-button" @click="readerStore.togglePlay()">{{ readerStore.isPlaying && !readerStore.isPaused ? '⏸ Pausar' : (readerStore.isPaused ? '▶ Continuar' : '▶ Ouvir texto') }}</button><button class="stop-button" @click="readerStore.stop">■</button></div>
    </section>

    <section v-if="userStore.isLoggedIn()" class="settings-section save-section">
      <h3>▱ <span>Meus textos</span></h3>
      <div v-if="!textStore.savedId" class="save-text-area"><input v-model="saveTitle" placeholder="Título (opcional)" class="title-input" /><button class="listen-button" @click="saveTexto" :disabled="saving">{{ saving ? 'Salvando...' : 'Salvar texto' }}</button></div>
      <p v-else class="saved-msg">✓ Texto salvo</p>
    </section>

    <section v-if="userStore.isLoggedIn()" class="settings-section save-section">
      <h3>Aa <span>Fontes salvas</span></h3>
      <div class="save-text-area"><input v-model="presetName" placeholder="Nome da fonte (ex.: Leitura confortável)" class="title-input" /><button class="listen-button" @click="savePreset" :disabled="presetSaving">{{ presetSaving ? 'Salvando...' : 'Salvar fonte' }}</button></div>
      <div v-if="!presets.length" class="preset-empty">Nenhuma fonte salva.</div>
      <div v-else class="sidebar-presets"><div v-for="preset in presets" :key="preset._id" class="sidebar-preset"><button class="preset-load" @click="applyPreset(preset)"><b>{{ preset.nome }}</b><small>Aplicar nos próximos textos</small></button><button class="preset-remove" @click="removePreset(preset)" aria-label="Excluir configuração">×</button></div></div>
    </section>

    <div v-if="feedbackText" class="feedback">{{ feedbackText }}</div>
    <div class="panel-footer-actions"><button class="reset-button" @click="handleReset">↻ Redefinir</button><button v-if="userStore.isLoggedIn()" class="presets-button" @click="router.push('/fontes-salvas')">Aa Fontes salvas</button><button class="home-button" @click="goHome">⌂ Voltar ao início</button></div>
  </aside>
</template>

<style scoped>
.sidebar-backdrop{display:none}.settings-panel{width:320px;flex:0 0 320px;height:100%;padding:22px 18px 24px;background:var(--white);border-right:1px solid var(--line);overflow-y:auto;color:var(--text)}
.panel-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px}.panel-title{display:flex;align-items:center;gap:9px}.settings-icon{font-size:16px}.panel-top h2{font-size:17px;font-weight:800}.sidebar-close{display:none;border:0;background:transparent;font-size:24px;color:var(--muted)}
.settings-section{padding:0 3px 20px;margin-bottom:17px;border-bottom:1px solid var(--line)}.settings-section:last-of-type{border-bottom:0}.settings-section h3{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:850;margin-bottom:15px;color:var(--text)}
.setting-row{display:grid;grid-template-columns:minmax(0,1fr) 42px 62px;align-items:center;gap:7px;margin:13px 0;font-size:12px}.setting-row b{text-align:center;font-size:12px;font-weight:700;color:var(--muted)}.stepper{display:flex;gap:5px}.stepper button{width:29px;height:29px;padding:0;border:1px solid var(--line);border-radius:8px;background:var(--cream-2);color:var(--navy);font-weight:800}.stepper button:hover{background:var(--green-soft)}
.mini-select{height:29px;border:1px solid var(--line);border-radius:8px;background:var(--cream-2);color:var(--text);font-size:10px;padding:0 6px;grid-column:2/-1}.page-size-row{grid-template-columns:minmax(0,1fr) 100px}.field-label{display:block;font-size:11px;color:var(--muted);margin:11px 0 6px}.select-control{width:100%;height:38px;border:1px solid var(--line);border-radius:9px;background:var(--cream-2);color:var(--text);padding:0 10px;font-size:12px;outline:none}.theme-options{display:flex;flex-wrap:wrap;gap:12px;align-items:center}.theme-option{width:42px;height:42px;padding:3px;border:2px solid transparent;background:transparent;border-radius:50%;display:grid;place-items:center;cursor:pointer}.theme-option.selected{border-color:var(--green);box-shadow:0 0 0 2px rgba(66,173,121,.16)}.theme-sample{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;font-size:12px;font-weight:800;border:1px solid rgba(0,0,0,.14)}
.toggle-row{display:flex;justify-content:space-between;align-items:center;margin:13px 0;font-size:12px}.switch{width:36px;height:21px;border:0;border-radius:20px;background:#b9c1ca;padding:2px}.switch span{display:block;width:17px;height:17px;background:#fff;border-radius:50%;transition:.2s}.switch.on{background:var(--green)}.switch.on span{transform:translateX(15px)}.nav-row{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:7px;margin-top:14px}.nav-row button{border:1px solid var(--line);background:var(--cream-2);border-radius:8px;padding:8px 5px;color:var(--navy);font-size:11px;font-weight:800}.nav-row button:last-child{text-align:center}.nav-row button:disabled{opacity:.4;cursor:not-allowed}.nav-row span{font-size:10px;color:var(--muted);white-space:nowrap}
.speed-line{font-size:12px;color:var(--muted)}.range-control{width:100%;accent-color:var(--green);margin:9px 0 2px}.speed-buttons{display:flex;align-items:center;justify-content:space-between;color:var(--muted);font-size:9px;margin-bottom:11px}.speed-buttons button{width:25px;height:25px;border:1px solid var(--line);background:var(--cream-2);border-radius:7px;color:var(--text);font-weight:800}.reading-actions{display:flex;gap:7px;margin-top:9px}.listen-button{flex:1;min-height:38px;border:0;border-radius:9px;background:var(--green);color:#fff;font-size:11px;font-weight:800}.listen-button:hover{background:var(--green-dark)}.stop-button{width:38px;border:1px solid var(--line);border-radius:9px;background:var(--cream-2);color:var(--text)}.title-input{width:100%;height:36px;padding:0 10px;border:1px solid var(--line);border-radius:8px;background:var(--cream-2);color:var(--text);font-size:11px}.save-text-area{display:flex;flex-direction:column;gap:7px}.saved-msg{font-size:11px;color:var(--green-dark)}.preset-empty{font-size:10px;color:var(--muted);padding:9px 0}.sidebar-presets{display:grid;gap:6px;margin-top:8px}.sidebar-preset{display:flex;align-items:stretch;border:1px solid var(--line);border-radius:8px;overflow:hidden;background:var(--cream-2)}.preset-load{flex:1;border:0;background:transparent;text-align:left;padding:8px 9px;color:var(--text)}.preset-load b,.preset-load small{display:block}.preset-load b{font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.preset-load small{font-size:9px;color:var(--green-dark);margin-top:2px}.preset-remove{width:30px;border:0;border-left:1px solid var(--line);background:transparent;color:var(--danger);font-size:16px}.feedback{text-align:center;padding:8px;background:var(--green-soft);color:var(--green-dark);border-radius:8px;font-size:11px;margin-bottom:9px}.panel-footer-actions{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:4px}.panel-footer-actions button{height:34px;border:1px solid var(--line);border-radius:8px;background:var(--cream-2);color:var(--text);font-size:10px;font-weight:700}.panel-footer-actions .reset-button,.panel-footer-actions .home-button,.panel-footer-actions .presets-button{grid-column:1/-1;justify-self:center;width:150px;height:37px;font-size:11px}.panel-footer-actions .reset-button{background:color-mix(in srgb,var(--green) 14%,transparent);border-color:color-mix(in srgb,var(--green) 35%,var(--line));color:var(--green-dark)}.panel-footer-actions .home-button{background:color-mix(in srgb,var(--navy) 10%,transparent);border-color:color-mix(in srgb,var(--navy) 28%,var(--line));color:var(--navy)}
@media(max-width:1024px){.sidebar-backdrop{display:block;position:fixed;inset:0;background:rgba(5,12,24,.45);z-index:90}.settings-panel{position:fixed;z-index:100;left:0;top:0;bottom:0;transform:translateX(-105%);transition:transform .25s ease;box-shadow:12px 0 30px rgba(0,0,0,.18)}.settings-panel.open{transform:translateX(0)}.sidebar-close{display:block}}
@media(max-width:480px){.settings-panel{width:min(92vw,320px)}}
</style>
