import { defineStore } from "pinia";

const clamp = (value, min = 0) => Math.max(min, value);
const round1 = (value) => Math.round(value * 10) / 10;

export const usePaginationStore = defineStore("pagination", {
  state: () => ({
    maxWords: Infinity,
    startIndex: 0,
  }),

  actions: {
    clearMaxWords() {
      this.maxWords = Infinity;
    },

    increaseScroll() {
      if (this.maxWords == Infinity) return;
      this.startIndex = round1(this.startIndex + this.maxWords);
    },

    decreaseScroll() {
      if (this.maxWords == Infinity) return;
      this.startIndex = clamp(round1(this.startIndex - this.maxWords), 0);
    },

    resetScroll() {
      this.startIndex = 0;
    },
  },
});
