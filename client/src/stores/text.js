import { defineStore } from "pinia";

export const useTextStore = defineStore("text", {
  state: () => ({
    tokens: [],
    originalText: '',
    savedId: null,
  }),

  actions: {
    setTokens(tokens) {
      this.tokens = tokens;
    },

    setOriginalText(text) {
      this.originalText = text;
    },

    setSavedId(id) {
      this.savedId = id;
    },

    clear() {
      this.tokens = [];
      this.originalText = '';
      this.savedId = null;
    }
  }
});