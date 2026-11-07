import { defineStore } from "pinia";

export const usePaginationStore = defineStore("pagination", {
  state: () => ({ maxWords: 90, startIndex: 0, pageSizeOption: "normal" }),
  actions: {
    setPageSize(size = "normal") {
      this.pageSizeOption = String(size);
      this.maxWords = this.pageSizeOption === "normal" ? 90 : Math.min(10, Math.max(1, Number(this.pageSizeOption) || 1));
      this.startIndex = 0;
    },
    increaseScroll(totalWords = Infinity) { const next = this.startIndex + this.maxWords; if (next < totalWords) this.startIndex = next; },
    decreaseScroll() { this.startIndex = Math.max(0, this.startIndex - this.maxWords); },
    resetScroll() { this.startIndex = 0; this.maxWords = this.pageSizeOption === "normal" ? 90 : Math.min(10, Math.max(1, Number(this.pageSizeOption) || 1)); },
  },
});
