<script setup>
import { ref } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
import { useTextStore } from '@/stores/text';
import router from '@/router';

const text = ref('');
const error = ref('');
const fileInput = ref(null);
const textStore = useTextStore();

async function pasteFromClipboard() {
  try {
    const clipboardText = await navigator.clipboard.readText();
    if (clipboardText) {
      text.value += clipboardText;
    }
  } catch {
    error.value = "Não foi possível acessar a área de transferência.";
  }
}

function triggerFileUpload() {
  fileInput.value?.click();
}

async function handleFileUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  error.value = '';

  try {
    const headText = await file.slice(0, 4096).text();

    if (!isTextContent(headText)) {
      error.value = "O arquivo selecionado não parece ser um arquivo de texto.";
      event.target.value = '';
      return;
    }

    const fullText = await file.text();
    text.value += fullText;
    validate();
  } catch {
    error.value = "Erro ao ler o arquivo.";
  }
}

function isTextContent(content) {
  const sample = content.slice(0, 4096);
  let printable = 0;
  for (let i = 0; i < sample.length; i++) {
    const code = sample.charCodeAt(i);
    if (code === 0) return false;
    if (code >= 32 && code <= 126) printable++;
    else if ([9, 10, 13].includes(code)) printable++;
    else if (code >= 128) printable++;
  }
  return sample.length === 0 || (printable / sample.length) > 0.8;
}

async function validate() {
  if (!text.value.trim()) {
    error.value = "Por favor, insira um texto para leitura.";
    return false;
  }

  error.value = '';

  try {
    const res = await axios.post(`${import.meta.env.VITE_API_BASE}/read`, { text: text.value });

    if (res.status === 200) {
      textStore.setTokens(res.data);
      textStore.setOriginalText(text.value);
      router.push('/read');
    }
  } catch (e) {
    error.value = e.response?.data?.erro || "Erro ao enviar texto.";
  }
}
</script>

<template>
  <main>
    <h3>Digite ou cole seu texto:</h3>
    <form method="POST" action="/api/read" @submit.prevent="validate">
      <textarea v-model="text" required></textarea>

      <p v-if="error" class="error-text">{{ error }}</p>

      <div class="button-group">
        <button type="button" @click="pasteFromClipboard">📋 Colar</button>
        <button type="button" @click="triggerFileUpload">📂 Carregar .txt</button>
        <input type="file" ref="fileInput" accept=".txt" @change="handleFileUpload" hidden />
        <button type="submit">Abrir para leitura →</button>
      </div>
    </form>
  </main>
</template>

<style scoped>
textarea {
  width: 100%;
  height: min(50vh, 400px);
  min-height: 150px;
  padding: 10px;
  font-size: 16px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  resize: none;
}

main {
  padding: 20px;
  max-width: 900px;
  margin: auto;
}

h3 {
  margin-bottom: 14px;
}

.button-group {
  display: flex;
  gap: 10px;
  margin-top: 15px;
  align-items: center;
}

.button-group button[type="submit"] {
  margin-left: auto;
}

.error-text {
  color: var(--color-error);
}

@media (max-width: 600px) {
  main {
    display: flex;
    flex-direction: column;
    height: calc(100dvh - 56px);
    padding: 12px;
  }

  form {
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  textarea {
    flex: 1;
    height: auto;
  }

  .button-group {
    flex-wrap: wrap;
  }

  .button-group button {
    flex: 1;
  }
}
</style>