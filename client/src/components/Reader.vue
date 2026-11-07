<script setup>
import { computed, ref, onMounted, onUnmounted, watch, nextTick } from "vue";
import { usePreferencesStore } from "@/stores/preferences";
import { usePaginationStore } from "@/stores/pagination";
import { useTextStore } from "@/stores/text";
import { useReaderStore } from "@/stores/reader";

const textStore = useTextStore();
const preferencesStore = usePreferencesStore();
const paginationStore = usePaginationStore();
const readerStore = useReaderStore();
const emit = defineEmits(["wordClick"]);

const showPopover = ref(false);
const popoverToken = ref(null);
const popoverStyle = ref({});
const popoverRef = ref(null);
const selectedWordIndex = ref(null);
const wordElements = new Map();
const guideStyle = ref({ top: "0px", left: "0px", width: "0px", opacity: 0 });
let popoverOpening = false;

const totalWords = computed(() => textStore.tokens.filter(t => t.isWord).length);
const totalPages = computed(() => Math.max(1, Math.ceil(totalWords.value / paginationStore.maxWords)));
const currentPage = computed(() => Math.floor(paginationStore.startIndex / paginationStore.maxWords) + 1);
const hasPrevious = computed(() => paginationStore.startIndex > 0);
const hasNext = computed(() => paginationStore.startIndex + paginationStore.maxWords < totalWords.value);
const pageSizeOption = computed(() => paginationStore.pageSizeOption);

const visibleTokens = computed(() => {
  let wordIndex = 0;
  const start = paginationStore.startIndex;
  const end = start + paginationStore.maxWords;
  return textStore.tokens.filter(token => {
    if (!token.isWord) return wordIndex >= start && wordIndex < end;
    const visible = wordIndex >= start && wordIndex < end;
    wordIndex++;
    return visible;
  });
});

const effectiveBackground = computed(() => preferencesStore.darkMode ? "#13264D" : preferencesStore.backgroundColor);
const effectiveForeground = computed(() => preferencesStore.darkMode ? "#F5F8FF" : preferencesStore.fontColor);
const effectiveHighlight = computed(() => preferencesStore.darkMode ? "#3D786C" : preferencesStore.highlightColor);

function updateGuide(tokenIndex = readerStore.currentWordIndex) {
  if (!preferencesStore.guideLine || tokenIndex == null) return;
  let el = wordElements.get(tokenIndex);
  const wrapper = document.querySelector('.text-wrapper');
  if (!el) {
    const firstVisibleWord = visibleTokens.value.find(token => token.isWord);
    if (firstVisibleWord) el = wordElements.get(firstVisibleWord.index);
  }
  if (!el || !wrapper) return;
  const rect = el.getBoundingClientRect();
  const wrapperRect = wrapper.getBoundingClientRect();
  const content = wrapper.querySelector('.text-content');
  const contentRect = content?.getBoundingClientRect();
  // A linha fica abaixo da linha/frase onde está a palavra atual,
  // ocupando somente a largura útil do texto.
  const top = rect.bottom - wrapperRect.top + wrapper.scrollTop + 6;
  const left = contentRect ? Math.max(0, contentRect.left - wrapperRect.left) : 0;
  const width = contentRect ? Math.min(contentRect.width, wrapper.clientWidth) : wrapper.clientWidth;
  guideStyle.value = { top: `${Math.max(8, top)}px`, left: `${left}px`, width: `${width}px`, opacity: 1 };
}
function setWordElement(token, el) {
  if (el) wordElements.set(token.index, el);
  else wordElements.delete(token.index);
}

function handleClick(token, event) {
  if (!token.isWord) return;
  selectedWordIndex.value = token.index;
  updateGuide(token.index);
  const rect = event.target.getBoundingClientRect();
  const spaceBelow = window.innerHeight - rect.bottom;
  popoverToken.value = token;
  popoverStyle.value = { left: `${rect.left + rect.width / 2}px`, transform: "translateX(-50%)" };
  if (spaceBelow < 130) {
    popoverStyle.value.top = `${rect.top - 8}px`;
    popoverStyle.value.transform = "translateX(-50%) translateY(-100%)";
  } else {
    popoverStyle.value.top = `${rect.bottom + 8}px`;
  }
  popoverOpening = true;
  showPopover.value = true;
}
function closePopover() { showPopover.value = false; popoverToken.value = null; }
function startFromHere() {
  if (popoverToken.value) readerStore.startFromWord(popoverToken.value.index);
  closePopover();
}
function showMeaning() {
  if (popoverToken.value) emit("wordClick", popoverToken.value);
  closePopover();
}
function onDocumentClick(event) {
  if (popoverOpening) { popoverOpening = false; return; }
  if (showPopover.value && popoverRef.value && !popoverRef.value.contains(event.target)) closePopover();
}
function goPrevious() { readerStore.stop(); paginationStore.decreaseScroll(); selectedWordIndex.value = null; requestAnimationFrame(() => updateGuide()); }
function goNext() { readerStore.stop(); paginationStore.increaseScroll(totalWords.value); selectedWordIndex.value = null; requestAnimationFrame(() => updateGuide()); }
async function fitNormalPage() {
  if (pageSizeOption.value !== "normal" || !totalWords.value) return;
  paginationStore.maxWords = 90;
  await nextTick();
  const wrapper = document.querySelector('.text-wrapper');
  const content = wrapper?.querySelector('.text-content');
  if (!wrapper || !content) return;
  for (let i = 0; i < 8; i++) {
    const available = wrapper.clientHeight - 20;
    const height = content.scrollHeight;
    if (height <= available) break;
    const ratio = Math.max(0.15, Math.min(0.95, available / height));
    const next = Math.max(1, Math.min(90, Math.floor(paginationStore.maxWords * ratio * 0.96)));
    if (next >= paginationStore.maxWords) break;
    paginationStore.maxWords = next;
    await nextTick();
  }
}

function plainText() { return textStore.originalText || textStore.tokens.map(t => t.text).join(""); }
function downloadText() {
  const blob = new Blob([plainText()], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "texto-leitura-facil.txt"; a.click();
  URL.revokeObjectURL(url);
}
async function copyText() {
  try {
    await navigator.clipboard.writeText(plainText());
    window.dispatchEvent(new CustomEvent("leitura-feedback", { detail: "✓ Texto copiado!" }));
  } catch {
    const area = document.createElement("textarea");
    area.value = plainText(); document.body.appendChild(area); area.select();
    document.execCommand("copy"); area.remove();
    window.dispatchEvent(new CustomEvent("leitura-feedback", { detail: "✓ Texto copiado!" }));
  }
}

onMounted(async () => {
  document.addEventListener("click", onDocumentClick);
  await fitNormalPage();
  requestAnimationFrame(() => updateGuide());
});
onUnmounted(() => document.removeEventListener("click", onDocumentClick));
watch(() => [readerStore.currentWordIndex, preferencesStore.guideLine, paginationStore.startIndex], async () => { await nextTick(); requestAnimationFrame(() => updateGuide()); });
watch(() => [paginationStore.pageSizeOption, preferencesStore.lineHeight, preferencesStore.wordSpacing, preferencesStore.letterSpacing, preferencesStore.fontScale], async () => { await nextTick(); await fitNormalPage(); requestAnimationFrame(() => updateGuide()); });
</script>

<template>
  <div class="reader-shell">
    <div class="reader-toolbar">
      <div class="toolbar-left"><button class="tool-button" @click="readerStore.togglePlay()">🔊 {{ readerStore.isPlaying && !readerStore.isPaused ? 'Pausar' : (readerStore.isPaused ? 'Continuar' : 'Ouvir texto') }}</button><button class="tool-button" @click="readerStore.stop">■ Parar</button></div>
      <div class="toolbar-right"><button class="tool-button" @click="downloadText">⇩ Baixar</button><button class="tool-button" @click="copyText">▣ Copiar</button></div>
    </div>

    <div class="text-wrapper" :style="{ '--bg': effectiveBackground, '--fg': effectiveForeground, '--hover': preferencesStore.darkMode ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.09)', '--highlight': effectiveHighlight, color: effectiveForeground, backgroundColor: effectiveBackground, fontFamily: preferencesStore.fontFamily === 'OpenDyslexic' ? 'OpenDyslexic, Inter, sans-serif' : preferencesStore.fontFamily, fontSize: preferencesStore.fontScale + 'em', lineHeight: preferencesStore.lineHeight, '--word-gap': preferencesStore.wordSpacing + 'px', '--letter-gap': preferencesStore.letterSpacing + 'px' }">
      <div v-if="preferencesStore.guideLine" class="guide-line" :style="guideStyle" aria-hidden="true"></div>
      <div class="text-content">
        <span v-for="token in visibleTokens" :key="token.index" :ref="el => setWordElement(token, el)" :class="{ word: token.isWord, highlight: token.isWord && preferencesStore.wordHighlight && (readerStore.currentWordIndex === token.index || selectedWordIndex === token.index) }" @click="handleClick(token, $event)">{{ token.text }}</span>
        <div aria-hidden="true" class="spacer"></div>
      </div>
      <div v-if="showPopover" ref="popoverRef" class="word-popover" :style="popoverStyle" @click.stop><button @click="startFromHere">🔊 Iniciar daqui</button><button @click="showMeaning">📖 Significado</button></div>
    </div>

    <div class="reader-pagination"><button :disabled="!hasPrevious" @click="goPrevious">‹ Anterior</button><span>Página {{ currentPage }} de {{ totalPages }}</span><button :disabled="!hasNext" @click="goNext">Próximo ›</button></div>
  </div>
</template>

<style scoped>
.reader-shell{flex:1;min-width:0;min-height:0;display:flex;flex-direction:column;background:var(--cream);border-left:1px solid var(--line)}
.reader-toolbar{height:58px;flex:0 0 58px;padding:0 22px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line);background:var(--white)}.toolbar-left,.toolbar-right{display:flex;gap:9px}.tool-button{border:1px solid var(--line);background:var(--cream-2);color:var(--text);border-radius:9px;padding:8px 12px;font-size:11px;font-weight:750}.tool-button:hover{background:var(--green-soft)}
.text-wrapper{position:relative;flex:1;min-height:0;overflow:hidden;overflow-anchor:none}.text-content{position:relative;z-index:2;max-width:1000px;margin:auto;padding:58px 48px 80px;white-space:pre-wrap;letter-spacing:var(--letter-gap);word-spacing:var(--word-gap)}.word{cursor:pointer;transition:background-color .2s ease;border-radius:4px}.word:hover{background:var(--hover)}.highlight{background:var(--highlight);padding:1px 3px}.guide-line{position:absolute;z-index:1;height:2px;background:var(--highlight);pointer-events:none;box-shadow:0 0 0 1px color-mix(in srgb, var(--highlight) 25%, transparent)}
.spacer{height:3em}.word-popover{position:fixed;z-index:100;display:flex;flex-direction:column;gap:4px;background:var(--white);border:1px solid var(--line);border-radius:10px;padding:5px;box-shadow:0 12px 28px rgba(0,0,0,.2);white-space:nowrap}.word-popover button{width:100%;padding:11px 15px;border:0;border-radius:7px;background:transparent;color:var(--text);font-size:12px;text-align:left}.word-popover button:hover{background:var(--cream-2)}
.reader-pagination{min-height:66px;padding:0 28px;display:flex;justify-content:space-between;align-items:center;background:var(--white);border-top:1px solid var(--line);color:var(--muted);font-size:11px}.reader-pagination button{border:1px solid var(--line);background:var(--cream-2);border-radius:8px;padding:8px 12px;color:var(--navy);font-size:11px;font-weight:800}.reader-pagination button:disabled{opacity:.35;cursor:not-allowed}
@media(max-width:767px){.reader-toolbar{padding:0 12px;height:54px;flex-basis:54px}.toolbar-right{display:none}.tool-button{padding:7px 9px}.text-content{padding:35px 24px 90px}.reader-pagination{padding:0 14px}.reader-pagination span{font-size:10px}}
</style>
