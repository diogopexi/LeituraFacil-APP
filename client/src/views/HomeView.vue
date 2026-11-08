<script setup>
import { Capacitor } from '@capacitor/core'
import { Clipboard } from '@capacitor/clipboard'
import { ref, nextTick } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { useTextStore } from '@/stores/text'


const router = useRouter()
const textStore = useTextStore()
const text = ref('')
const error = ref('')
const fileInput = ref(null)
const editor = ref(null)
const adapting = ref(false)
const loadingFile = ref(false);



function isPdf(file) {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}



async function pasteFromClipboard() {
  try {
    const value = Capacitor.isNativePlatform() 
      ? (await Clipboard.read()).value
      :await navigator.clipboard.readText()
    if (value) text.value += value
  } catch {
    error.value = 'Não foi possível acessar a área de transferência.'
  }
}
function triggerFileUpload() { fileInput.value?.click() }


async function handleFileUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return
  error.value = '';
  loadingFile.value = true;

  try {
    if (isPdf(file)) {
        // Import dinâmico: o pdf.js (pesado) só é carregado quando o usuário
        // realmente escolhe um PDF, e não na abertura do app.
      const {extractTextFromPdf} = await import('@/utils/pdfText');
      const pdfText = await extractTextFromPdf(file);
      
      if (!pdfText.trim()) {
        error.value = "Este PDF não tem texto selecionável (parece ser uma imagem escaneada).";
        return;
      } 
      text.value += pdfText;
    } else{
      const headText = await file.slice(0, 4096).text();

      if (!isTextContent(headText)) {
        error.value = "O arquivo selecionado não parece ser um arquivo de texto.";
        return;
      }

      text.value += await file.text();

    }

    validate();

  } catch {
    error.value = "Não foi possível ler o arquivo selecionado.";
  } finally {
    loadingFile.value = false;

    // Permite escolher o mesmo arquivo de novo depois.
    event.target.value = '';
  }
}
      
function isTextContent(content) {
  let printable = 0
  for (let i = 0; i < content.length; i++) {
    const code = content.charCodeAt(i)
    if (code === 0) return false
    if ((code >= 32 && code <= 126) || [9,10,13].includes(code) || code >= 128) printable++
  }
  return !content.length || printable / content.length > 0.8
}

function tokenizeLocally(value) {
  const segmenter = new Intl.Segmenter('pt-BR', { granularity: 'word' })
  return [...segmenter.segment(value)].map(token => ({ index: token.index, text: token.segment, isWord: token.isWordLike }))
}


async function adaptText() {
  if (!text.value.trim()) { error.value = 'Por favor, insira um texto para leitura.'; return }
  error.value = ''
  adapting.value = true
  try {
    // A tokenização roda no próprio aparelho: leva milissegundos e não depende de rede.
    // O servidor só é chamado se o navegador não tiver Intl.Segmenter (aparelhos muito antigos).
    let tokens
    if (typeof Intl.Segmenter === 'function') {
      tokens = tokenizeLocally(text.value)
    } else {
      const apiBase = import.meta.env.VITE_API_BASE || '/api'
      const res = await axios.post(`${apiBase}/read`, { text: text.value }, { timeout: 5000 })
      tokens = res.data
    }
    textStore.setTokens(tokens)
    textStore.setOriginalText(text.value)
    textStore.setSavedId(null)
    await router.push('/read')
  } catch (e) {
    error.value = 'Não foi possível preparar o texto para leitura.'
  } finally {
    adapting.value = false
  }
}


async function focusEditor() {
  await nextTick()
  editor.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}
</script>

<template>
  <main class="landing-page">
    <section class="hero section-shell">
      <div class="hero-copy">
        <span class="eyebrow">ACESSIBILIDADE PARA A LEITURA</span>
        <h1>Transforme textos em uma leitura mais confortável.</h1>
        <p>Ajuste fonte, espaçamento, cores e ouça o texto em voz alta. Tudo pensado para facilitar a sua leitura.</p>
        <div class="hero-actions">
          <button class="primary-button hero-button" @click="focusEditor">Adaptar meu texto <span>→</span></button>
          <RouterLink class="secondary-button" to="/como-funciona">Como funciona <span>▷</span></RouterLink>
        </div>
      </div>

      <div class="before-after" aria-label="Exemplo de adaptação de texto">
        <div class="example-card before-card"><span class="card-label">Antes</span><p class="before-text">A leitura em muitos formatos pode ser desafiadora. Nosso objetivo é tornar os textos mais acessíveis e agradáveis para pessoas com dislexia e outras necessidades de leitura.</p></div>
        <div class="transform-arrow">→</div>
        <div class="example-card after-card"><span class="card-label green">Depois</span><p class="after-text">A leitura em muitos formatos pode ser desafiadora. Nosso objetivo é tornar os textos mais acessíveis e agradáveis para pessoas com dislexia e outras necessidades de leitura.</p></div>
      </div>
    </section>

    <section ref="editor" id="text-editor" class="editor-section section-shell">
      <div class="editor-heading"><span class="eyebrow">COMECE AGORA</span><h2>Adapte seu texto para uma leitura mais confortável.</h2><p>Cole um texto ou carregue um arquivo .txt ou .pdf. Depois, personalize a leitura do seu jeito.</p></div>
      <div class="editor-card">
        <textarea v-model="text" placeholder="Cole ou escreva seu texto aqui..."></textarea>
        <p v-if="error" class="error-text">{{ error }}</p>
        <div class="editor-actions"><button class="secondary-button" type="button" @click="pasteFromClipboard">▣ Colar</button><button class="secondary-button" type="button" @click="triggerFileUpload">□ Carregar .txt ou PDF</button><input ref="fileInput" type="file" accept=".txt,.pdf,application/pdf" hidden @change="handleFileUpload" /><button class="primary-button" type="button" :disabled="adapting" @click="adaptText">{{ adapting ? 'Preparando...' : 'Adaptar meu texto' }} <span>→</span></button></div>
      </div>
    </section>
  </main>
</template>
