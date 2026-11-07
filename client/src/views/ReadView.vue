<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import axios from 'axios'
import Sidebar from '@/components/Sidebar.vue'
import Reader from '@/components/Reader.vue'
import WordMeaningModal from '@/components/WordMeaningModal.vue'

const sidebarOpen = ref(false)
const showWordMeaning = ref(false)
const selectedWord = ref('')
const definitions = ref([])
const loading = ref(false)
const error = ref(null)
const feedback = ref('')
const isMobile = ref(false)
const dictionaryCache = new Map()
let mql = null
let feedbackTimer = null

function onMqlChange(e) { isMobile.value = e.matches }
function showFeedback(message) { feedback.value = message; clearTimeout(feedbackTimer); feedbackTimer = setTimeout(() => feedback.value = '', 2200) }

async function handleWordClick(token) {
  const word = token.text.replace(/^[^\p{L}]+|[^\p{L}]+$/gu, '').toLowerCase()
  if (!word) return
  selectedWord.value = word
  definitions.value = []
  error.value = null
  showWordMeaning.value = true
  if (dictionaryCache.has(word)) { definitions.value = dictionaryCache.get(word); return }
  loading.value = true
  try {
    const base = import.meta.env.VITE_API_BASE || '/api'
    const res = await axios.get(`${base}/word/${encodeURIComponent(word)}`, { timeout: 7000 })
    definitions.value = res.data.definitions || []
    dictionaryCache.set(word, definitions.value)
  } catch (e) {
    error.value = e.response?.data?.erro || 'Não foi possível consultar o dicionário. Verifique se o servidor está ligado.'
  } finally { loading.value = false }
}

onMounted(() => {
  mql = window.matchMedia('(max-width: 1024px)')
  isMobile.value = mql.matches
  mql.addEventListener('change', onMqlChange)
  window.addEventListener('leitura-feedback', e => showFeedback(e.detail))
})
onUnmounted(() => { mql?.removeEventListener('change', onMqlChange); clearTimeout(feedbackTimer) })
</script>

<template>
  <main class="reader-page">
    <button class="settings-toggle" @click="sidebarOpen = true" aria-label="Abrir configurações">☷ Configurações</button>
    <Sidebar :open="sidebarOpen" @close="sidebarOpen = false" />
    <Reader @wordClick="handleWordClick" />
    <WordMeaningModal :show="showWordMeaning" :word="selectedWord" :definitions="definitions" :loading="loading" :error="error" @close="showWordMeaning = false" />
    <div v-if="feedback" class="reader-feedback">{{ feedback }}</div>
  </main>
</template>
<style scoped>
.reader-page{height:calc(100vh - 78px);display:flex;position:relative;overflow:hidden;background:var(--cream)}.settings-toggle{display:none;position:fixed;left:12px;bottom:18px;z-index:70;border:0;border-radius:10px;background:var(--green);color:#fff;padding:11px 15px;box-shadow:0 8px 20px rgba(0,0,0,.15)}.reader-feedback{position:fixed;right:24px;bottom:24px;z-index:120;background:var(--navy);color:#fff;padding:11px 16px;border-radius:10px;font-size:12px;box-shadow:0 10px 25px rgba(0,0,0,.2)}
@media(max-width:1024px){.settings-toggle{display:block}}@media(max-width:767px){.reader-page{height:calc(100vh - 64px)}.settings-toggle{left:50%;transform:translateX(-50%)}}
</style>
