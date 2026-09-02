import { defineStore } from "pinia";
import { useTextStore } from "./text";
import { usePaginationStore } from "./pagination";
import { usePreferencesStore } from "./preferences";

export const useReaderStore = defineStore("reader", {
  state: () => ({
    currentWordIndex: null,
    currentWordPos: null,
    isPlaying: false,
    isPaused: false,
    voices: [],
    selectedVoiceURI: null,
  }),

  actions: {
    loadVoices() {
      this.voices = window.speechSynthesis.getVoices();
    },

    setWord(index) {
      this.currentWordIndex = index;
      this.currentWordPos = null;
    },

    getVisibleWordTokens() {
      const textStore = useTextStore();
      const paginationStore = usePaginationStore();
      const tokens = textStore.tokens;

      const words = tokens.filter(t => t.isWord);

      if (!paginationStore.maxWords || paginationStore.maxWords === Infinity) {
        return words;
      }

      const start = paginationStore.startIndex;
      const end = start + paginationStore.maxWords;
      return words.slice(start, end);
    },

    play() {
      const synth = window.speechSynthesis;
      if (!synth) return;

      synth.cancel();

      const words = this.getVisibleWordTokens();
      if (words.length === 0) return;

      let startPos = 0;
      if (this.isPaused && this.currentWordPos !== null) {
        startPos = this.currentWordPos;
        if (startPos >= words.length) startPos = 0;
      } else if (this.currentWordIndex !== null) {
        const found = words.findIndex(w => w.index === this.currentWordIndex);
        if (found !== -1) startPos = found;
      }

      this._cancelRequested = false;
      this.isPlaying = true;
      this.isPaused = false;
      this._speakWord(words, startPos);
    },

    _speakWord(words, pos) {
      if (pos >= words.length) {
        if (this._tryAdvancePage()) return;
        this._resetReadingState();
        return;
      }

      const token = words[pos];
      this.currentWordIndex = token.index;
      this.currentWordPos = pos;

      const utterance = new SpeechSynthesisUtterance(token.text);
      const voice = this.voices.find(v => v.voiceURI === this.selectedVoiceURI);
      if (voice) utterance.voice = voice;
      utterance.rate = usePreferencesStore().speed;
      utterance.lang = "pt-BR";

      utterance.onend = () => {
        if (this._cancelRequested) return;
        this._speakWord(words, pos + 1);
      };

      utterance.onerror = () => {
        if (this._cancelRequested) return;
        this._resetReadingState();
      };

      window.speechSynthesis.speak(utterance);
    },

    _tryAdvancePage() {
      const paginationStore = usePaginationStore();
      const textStore = useTextStore();

      if (!paginationStore.maxWords || paginationStore.maxWords === Infinity) return false;

      const allWords = textStore.tokens.filter(t => t.isWord);
      const nextStart = paginationStore.startIndex + paginationStore.maxWords;
      if (nextStart >= allWords.length) return false;

      paginationStore.startIndex = nextStart;
      const nextWords = this.getVisibleWordTokens();
      if (nextWords.length === 0) return false;

      this.currentWordPos = 0;
      this.currentWordIndex = nextWords[0].index;
      this._speakWord(nextWords, 0);
      return true;
    },

    _resetReadingState() {
      this.isPlaying = false;
      this.isPaused = false;
      this.currentWordIndex = null;
      this.currentWordPos = null;
    },

    pause() {
      if (this.isPlaying && !this.isPaused) {
        this._cancelRequested = true;
        window.speechSynthesis.cancel();
        this.isPaused = true;
      }
    },

    stop() {
      this._cancelRequested = true;
      window.speechSynthesis.cancel();
      this._resetReadingState();
    },

    togglePlay() {
      if (this.isPlaying) {
        if (this.isPaused) {
          this.play();
        } else {
          this.pause();
        }
      } else {
        this.play();
      }
    },
  },
});
