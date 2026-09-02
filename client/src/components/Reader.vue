<script setup>
import { computed, ref, onMounted, onUnmounted } from "vue";
import { usePreferencesStore } from "@/stores/preferences";
import { usePaginationStore } from "@/stores/pagination";
import { useTextStore } from "@/stores/text";
import { useReaderStore } from "@/stores/reader";

const textStore = useTextStore();
const preferencesStore = usePreferencesStore();
const paginationStore = usePaginationStore();
const readerStore = useReaderStore();

const emit = defineEmits(["wordClick"]);

const visibleTokens = computed(() => {
  if (!paginationStore.maxWords) {
    return textStore.tokens;
  }

  let wordIndex = 0;

  return textStore.tokens.filter(token => {
    if (!token.isWord) {
      return (
        wordIndex >= paginationStore.startIndex &&
        wordIndex < paginationStore.startIndex + paginationStore.maxWords
      );
    }

    const visible =
      wordIndex >= paginationStore.startIndex &&
      wordIndex < paginationStore.startIndex + paginationStore.maxWords;

    wordIndex++;

    return visible;
  });
});

const showPopover = ref(false);
const popoverToken = ref(null);
const popoverStyle = ref({});
const popoverRef = ref(null);

let popoverOpening = false;

function handleClick(token, event) {
  if (!token.isWord) return;

  if (showPopover.value && popoverToken.value?.index === token.index) {
    closePopover();
    return;
  }

  const rect = event.target.getBoundingClientRect();
  const spaceBelow = window.innerHeight - rect.bottom;

  popoverToken.value = token;
  popoverStyle.value = {
    left: `${rect.left + rect.width / 2}px`,
    transform: "translateX(-50%)",
  };

  if (spaceBelow < 100) {
    popoverStyle.value.top = `${rect.top - 4}px`;
    popoverStyle.value.transform = "translateX(-50%) translateY(-100%)";
  } else {
    popoverStyle.value.top = `${rect.bottom + 4}px`;
  }

  popoverOpening = true;
  showPopover.value = true;
}

function closePopover() {
  showPopover.value = false;
  popoverToken.value = null;
}

function startFromHere() {
  if (popoverToken.value) {
    readerStore.setWord(popoverToken.value.index);
  }
  closePopover();
}

function showMeaning() {
  if (popoverToken.value) {
    emit("wordClick", popoverToken.value);
  }
  closePopover();
}

function onDocumentClick(event) {
  if (popoverOpening) {
    popoverOpening = false;
    return;
  }

  if (
    showPopover.value &&
    popoverRef.value &&
    !popoverRef.value.contains(event.target)
  ) {
    closePopover();
  }
}

onMounted(() => {
  document.addEventListener("click", onDocumentClick);
});

onUnmounted(() => {
  document.removeEventListener("click", onDocumentClick);
});

function isDark(color) {
  const c = color.substring(1);
  const rgb = parseInt(c, 16);
  const r = (rgb >> 16) & 255;
  const g = (rgb >> 8) & 255;
  const b = rgb & 255;

  return (r * 0.299 + g * 0.587 + b * 0.114) < 140;
}
</script>

<template>
  <div class="text-wrapper" :style="{
    '--bg': preferencesStore.backgroundColor,
    '--fg': preferencesStore.fontColor,
    '--hover': isDark(preferencesStore.backgroundColor)
      ? 'rgba(255,255,255,0.15)'
      : 'rgba(0,0,0,0.15)',
    '--highlight': preferencesStore.highlightColor,

    color: preferencesStore.fontColor,
    backgroundColor: preferencesStore.backgroundColor,
    fontSize: preferencesStore.fontScale + 'em',
    lineHeight: preferencesStore.lineHeight + 'em',
    wordSpacing: preferencesStore.wordSpacing + 'em',
    letterSpacing: preferencesStore.letterSpacing + 'em',
  }">
    <div class="text-content">
      <span v-for="token in visibleTokens" :key="token.index" :class="{ word: token.isWord, highlight: token.isWord && readerStore.currentWordIndex === token.index }" @click="handleClick(token, $event)">
        {{ token.text }}
      </span>
      <div aria-hidden="true" class="spacer"></div>
    </div>
    <div
      v-if="showPopover"
      ref="popoverRef"
      class="word-popover"
      :style="popoverStyle"
    >
      <button @click="startFromHere">🔊 Iniciar daqui</button>
      <button @click="showMeaning">📖 Significado</button>
    </div>
  </div>
</template>

<style scoped>
.text-wrapper {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-anchor: none;

  transition:
    font-size 0.3s ease,
    letter-spacing 0.3s ease,
    word-spacing 0.3s ease,
    line-height 0.3s ease;
}

.word {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.word:hover {
  background-color: var(--hover);
}

.text-content {
  padding: 24px;
  white-space: pre-wrap;
}

.spacer {
  height: 3em;
}

.highlight {
  background-color: var(--highlight);
  border-radius: 2px;
}

.word-popover {
  position: fixed;
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: var(--color-surface);
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
  padding: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  white-space: nowrap;
  max-width: min(300px, 90vw);
}

.word-popover button {
  width: 100%;
  padding: 12px 20px;
  border: none;
  border-radius: 6px;
  background: none;
  color: var(--color-text);
  font-size: 14px;
  font-family: Arial, Helvetica, sans-serif;
  cursor: pointer;
  text-align: left;
  transition: background-color 0.15s ease;
}

.word-popover button:hover {
  background-color: var(--color-border-light);
}

@media (max-width: 480px) {
  .word-popover {
    left: 16px !important;
    right: 16px;
    transform: none !important;
    max-width: none;
  }

  .word-popover button {
    padding: 14px 20px;
  }
}

@media (max-width: 767px) {
  .text-content {
    padding-bottom: 80px;
  }
}
</style>