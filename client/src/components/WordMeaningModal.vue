<script setup>
defineProps({
  show: Boolean,
  word: String,
  definitions: Array,
  loading: Boolean,
  error: String,
});

const emit = defineEmits(["close"]);
</script>

<template>
  <div v-if="show" class="modal-overlay" @click="emit('close')">
    <div class="modal-content" @click.stop>
      <button class="close-btn" @click="emit('close')">✕</button>

      <template v-if="loading">
        <p class="status-text">Buscando significado...</p>
      </template>

      <template v-else-if="error || !definitions.length">
        <p class="status-text">Nenhum significado encontrado para: <strong>{{ word }}</strong></p>
      </template>

      <template v-else>
        <h2>{{ word }}</h2>
        <ol class="definitions-list">
          <li v-for="(def, i) in definitions" :key="i">{{ def }}</li>
        </ol>
      </template>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--color-overlay);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: var(--color-surface);
  border-radius: 8px;
  padding: 32px;
  width: 100%;
  max-width: 400px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  position: relative;
  font-family: Arial, Helvetica, sans-serif;
}

@media (max-width: 480px) {
  .modal-content {
    padding: 20px;
    max-width: calc(100vw - 24px);
  }
}

.close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--color-text-muted);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: var(--color-text);
}

h2 {
  margin-top: 0;
  margin-bottom: 20px;
  color: var(--color-text);
  text-transform: lowercase;
}

.definitions-list {
  margin: 0;
  padding-left: 20px;
}

.definitions-list li {
  margin-bottom: 10px;
  line-height: 1.5;
  color: var(--color-text);
  font-size: 15px;
}

.definitions-list li:last-child {
  margin-bottom: 0;
}

.status-text {
  text-align: center;
  color: var(--color-text-muted);
  font-size: 15px;
  line-height: 1.5;
}
</style>
