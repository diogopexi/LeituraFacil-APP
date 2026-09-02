<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import axios from 'axios';
import Sidebar from '@/components/Sidebar.vue';
import Reader from '@/components/Reader.vue';
import WordMeaningModal from '@/components/WordMeaningModal.vue';
import { useTextStore } from '@/stores/text';
import { usePaginationStore } from '@/stores/pagination';
import { useReaderStore } from '@/stores/reader';

const textStore = useTextStore();
const paginationStore = usePaginationStore();
const readerStore = useReaderStore();

const sidebarOpen = ref(false);
const showWordMeaning = ref(false);
const selectedWord = ref('');
const definitions = ref([]);
const loading = ref(false);
const error = ref(null);

const isMobile = ref(false);

let mql = null;
function onMqlChange(e) {
  isMobile.value = e.matches;
}

onMounted(() => {
  mql = window.matchMedia('(max-width: 767px)');
  isMobile.value = mql.matches;
  mql.addEventListener('change', onMqlChange);
});

onUnmounted(() => {
  if (mql) mql.removeEventListener('change', onMqlChange);
});

const totalPages = computed(() => {
  if (paginationStore.maxWords === Infinity) return 0;
  const totalWords = textStore.tokens.filter(t => t.isWord).length;
  return Math.ceil(totalWords / paginationStore.maxWords);
});

const currentPage = computed(() => {
  if (paginationStore.maxWords === Infinity) return 0;
  return Math.floor(paginationStore.startIndex / paginationStore.maxWords) + 1;
});

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value;
}

async function handleWordClick(token) {
  selectedWord.value = token.text;
  definitions.value = [];
  error.value = null;
  loading.value = true;
  showWordMeaning.value = true;

  try {
    const res = await axios.get(
      `${import.meta.env.VITE_API_BASE}/word/${encodeURIComponent(token.text)}`
    );
    definitions.value = res.data.definitions;
  } catch (e) {
    error.value = e.response?.data?.erro || 'Erro ao buscar significado';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
    <main>
        <button
            v-if="!sidebarOpen"
            class="sidebar-toggle"
            @click="toggleSidebar"
            aria-label="Abrir configurações"
        >☰</button>
        <Sidebar :open="sidebarOpen" @close="sidebarOpen = false" />
        <Reader @wordClick="handleWordClick" />
        <WordMeaningModal
            :show="showWordMeaning"
            :word="selectedWord"
            :definitions="definitions"
            :loading="loading"
            :error="error"
            @close="showWordMeaning = false"
        />
        <div v-if="isMobile" class="mobile-action-bar">
            <template v-if="paginationStore.maxWords !== Infinity">
                <button @click="readerStore.stop(); paginationStore.decreaseScroll()" class="action-btn" aria-label="Página anterior">◀</button>
                <span class="page-indicator">{{ currentPage }}/{{ totalPages }}</span>
                <button @click="readerStore.stop(); paginationStore.increaseScroll()" class="action-btn" aria-label="Próxima página">▶</button>
                <span class="bar-divider"></span>
            </template>
            <button @click="readerStore.togglePlay()" class="action-btn" aria-label="Play/Pause">
                {{ readerStore.isPlaying && !readerStore.isPaused ? '⏸️' : '▶️' }}
            </button>
            <button @click="readerStore.stop()" class="action-btn" aria-label="Parar">⏹️</button>
        </div>
    </main>
</template>

<style scoped>
main {
    display: flex;
    height: 100vh;
    overflow: hidden;
    position: relative;
}

.sidebar-toggle {
    display: none;
    position: fixed;
    top: 12px;
    left: 12px;
    z-index: 50;
    width: 44px;
    height: 44px;
    border: none;
    border-radius: 8px;
    background: var(--color-button);
    color: white;
    font-size: 22px;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.sidebar-toggle:hover {
    background: var(--color-button-hover);
}

@media (max-width: 1024px) {
    .sidebar-toggle {
        display: flex;
        align-items: center;
        justify-content: center;
    }
}

@media (max-width: 767px) {
    .sidebar-toggle {
        top: 8px;
        left: 8px;
        width: 40px;
        height: 40px;
        font-size: 18px;
    }
}

.mobile-action-bar {
    display: none;
}

@media (max-width: 767px) {
    .mobile-action-bar {
        display: flex;
        align-items: center;
        gap: 8px;
        position: fixed;
        bottom: 16px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 60;
        background: var(--color-surface);
        padding: 6px 12px;
        border-radius: 12px;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
    }
}

.action-btn {
    width: 44px;
    height: 44px;
    border: none;
    border-radius: 8px;
    background: var(--color-button);
    color: white;
    font-size: 20px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
}

.action-btn:hover {
    background: var(--color-button-hover);
}

.page-indicator {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text);
    min-width: 40px;
    text-align: center;
}

.bar-divider {
    width: 1px;
    height: 24px;
    background: rgba(0, 0, 0, 0.15);
}
</style>