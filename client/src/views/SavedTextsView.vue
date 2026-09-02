<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { useUserStore } from '@/stores/user';
import { useTextStore } from '@/stores/text';

const router = useRouter();
const userStore = useUserStore();
const textStore = useTextStore();

const textos = ref([]);
const loading = ref(true);
const error = ref('');
const editingId = ref(null);
const editTitle = ref('');
const menuTextId = ref(null);

const menuText = computed(() =>
  textos.value.find(t => t._id === menuTextId.value)
);

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

async function loadTextos() {
  loading.value = true;
  error.value = '';
  try {
    const res = await axios.get(
      `${import.meta.env.VITE_API_BASE}/users/${userStore.user._id}/textos`,
      { headers: { Authorization: `Bearer ${userStore.token}` } }
    );
    textos.value = res.data;
  } catch (e) {
    error.value = e.response?.data?.erro || "Erro ao carregar textos.";
  } finally {
    loading.value = false;
  }
}

async function openTexto(texto) {
  try {
    const res = await axios.get(
      `${import.meta.env.VITE_API_BASE}/users/${userStore.user._id}/textos/${texto._id}`,
      { headers: { Authorization: `Bearer ${userStore.token}` } }
    );
    const { titulo, conteudo } = res.data;

    const tokensRes = await axios.post(
      `${import.meta.env.VITE_API_BASE}/read`,
      { text: conteudo }
    );

    textStore.setTokens(tokensRes.data);
    textStore.setOriginalText(conteudo);
    textStore.setSavedId(texto._id);

    await axios.put(
      `${import.meta.env.VITE_API_BASE}/users/${userStore.user._id}/textos/${texto._id}`,
      { titulo, conteudo },
      { headers: { Authorization: `Bearer ${userStore.token}` } }
    );

    router.push('/read');
  } catch (e) {
    error.value = e.response?.data?.erro || "Erro ao abrir texto.";
  }
}

function openMenu(event, texto) {
  event.stopPropagation();
  menuTextId.value = texto._id;
}

function closeMenu() {
  menuTextId.value = null;
}

function handleRename() {
  const texto = menuText.value;
  if (!texto) return;
  closeMenu();
  editingId.value = texto._id;
  editTitle.value = texto.titulo;
}

async function handleDelete() {
  const texto = menuText.value;
  if (!texto) return;
  closeMenu();
  if (!confirm(`Excluir "${texto.titulo}"?`)) return;
  try {
    await axios.delete(
      `${import.meta.env.VITE_API_BASE}/users/${userStore.user._id}/textos/${texto._id}`,
      { headers: { Authorization: `Bearer ${userStore.token}` } }
    );
    textos.value = textos.value.filter(t => t._id !== texto._id);
  } catch (e) {
    error.value = e.response?.data?.erro || "Erro ao excluir texto.";
  }
}

async function saveEdit(texto) {
  try {
    await axios.put(
      `${import.meta.env.VITE_API_BASE}/users/${userStore.user._id}/textos/${texto._id}`,
      { titulo: editTitle.value },
      { headers: { Authorization: `Bearer ${userStore.token}` } }
    );
    texto.titulo = editTitle.value;
    editingId.value = null;
  } catch (e) {
    error.value = e.response?.data?.erro || "Erro ao editar título.";
  }
}

function cancelEdit() {
  editingId.value = null;
  editTitle.value = '';
}

function goHome() {
  router.push('/');
}

onMounted(() => {
  if (!userStore.isLoggedIn()) {
    router.push('/');
    return;
  }
  loadTextos();
});
</script>

<template>
  <main class="saved-main">
    <div class="saved-header">
      <h2>Meus Textos</h2>
      <button @click="goHome" class="btn-back">← Voltar</button>
    </div>

    <p v-if="error" class="error">{{ error }}</p>

    <div v-if="loading" class="loading">Carregando...</div>

    <div v-else-if="textos.length === 0" class="empty">
      Nenhum texto salvo ainda.
    </div>

    <div v-else class="textos-list">
      <div
        v-for="texto in textos"
        :key="texto._id"
        class="texto-card"
        @click="openTexto(texto)"
      >
        <div class="texto-info">
          <template v-if="editingId === texto._id">
            <input
              v-model="editTitle"
              class="edit-input"
              @keyup.enter="saveEdit(texto)"
              @click.stop
            />
            <div class="edit-actions" @click.stop>
              <button @click="saveEdit(texto)" class="btn btn-save">💾 Salvar</button>
              <button @click="cancelEdit" class="btn btn-cancel">❌ Cancelar</button>
            </div>
          </template>
          <template v-else>
            <span class="texto-titulo">{{ texto.titulo }}</span>
            <span class="texto-data">{{ formatDate(texto.ultimoAcesso) }}</span>
          </template>
        </div>
        <button
          v-if="!editingId"
          class="menu-btn"
          @click="openMenu($event, texto)"
          aria-label="Menu"
        >⋯</button>
      </div>
    </div>

    <div v-if="menuTextId" class="modal-overlay" @click="closeMenu">
      <div class="action-modal" @click.stop>
        <h4 class="modal-title">{{ menuText?.titulo }}</h4>
        <button @click="handleRename" class="action-btn">✏️ Renomear</button>
        <button @click="handleDelete" class="action-btn danger">🗑️ Excluir</button>
        <button @click="closeMenu" class="action-btn cancel">Cancelar</button>
      </div>
    </div>
  </main>
</template>

<style scoped>
.saved-main {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
}

.saved-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.saved-header h2 {
  margin: 0;
}

.btn-back {
  padding: 8px 16px;
  border: 1px solid var(--color-text);
  border-radius: 6px;
  background: none;
  color: inherit;
  font-size: 14px;
  cursor: pointer;
}

.loading,
.empty {
  text-align: center;
  padding: 40px;
  color: var(--color-text-muted);
}

.error {
  color: var(--color-error);
  margin-bottom: 16px;
}

.textos-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.texto-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border: 1px solid var(--color-border-light);
  border-radius: 10px;
  gap: 12px;
  cursor: pointer;
  transition: background 0.15s, box-shadow 0.15s;
}

.texto-card:hover {
  background: var(--color-surface);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.texto-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.texto-titulo {
  font-weight: 600;
  font-size: 16px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  pointer-events: none;
}

.texto-data {
  font-size: 13px;
  color: var(--color-text-muted);
  pointer-events: none;
}

.edit-input {
  width: 100%;
  padding: 8px 10px;
  font-size: 15px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  box-sizing: border-box;
}

.edit-actions {
  display: flex;
  gap: 6px;
  margin-top: 8px;
}

.btn {
  padding: 7px 14px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
}

.btn-save {
  background: var(--color-success);
  color: white;
}

.btn-save:hover {
  background: var(--color-success-hover);
}

.btn-cancel {
  background: var(--color-border-light);
  color: var(--color-text);
}

.btn-cancel:hover {
  background: var(--color-border);
}

.menu-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--color-text-muted);
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, color 0.15s;
}

.menu-btn:hover {
  background: var(--color-border-light);
  color: var(--color-text);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: var(--color-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.action-modal {
  background: var(--color-surface);
  border-radius: 12px;
  padding: 20px;
  min-width: 260px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.modal-title {
  margin: 0 0 4px;
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.action-btn {
  width: 100%;
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  text-align: center;
  transition: background 0.15s;
}

.action-btn:not(.cancel):not(.danger) {
  background: var(--color-border-light);
  color: var(--color-text);
}

.action-btn:not(.cancel):not(.danger):hover {
  background: var(--color-border);
}

.action-btn.danger {
  background: var(--color-danger-light);
  color: var(--color-danger-hover);
}

.action-btn.danger:hover {
  background: var(--color-danger-light-hover);
}

.action-btn.cancel {
  background: transparent;
  color: var(--color-text-muted);
  margin-top: 4px;
}

.action-btn.cancel:hover {
  background: var(--color-surface);
}

@media (max-width: 600px) {
  .saved-main {
    padding: 16px;
  }

  .texto-card {
    padding: 12px;
  }

  .action-modal {
    min-width: 220px;
    margin: 0 16px;
  }
}
</style>
