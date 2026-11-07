import { defineStore } from "pinia";
import { useUserStore } from "./user";

const API_BASE = import.meta.env.VITE_API_BASE || "/api";
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const round1 = (value, fallback = 0) => { const n = Number(value); return Number.isFinite(n) ? Math.round(n * 10) / 10 : fallback; };

const LIGHT_THEME = {
  backgroundColor: "#FFFFFF",
  fontColor: "#172033",
  highlightColor: "#CBE8D4",
  darkMode: false,
};

const DARK_THEME = {
  backgroundColor: "#13264D",
  fontColor: "#F5F8FF",
  highlightColor: "#356E61",
  darkMode: true,
};

const CREAM_THEME = { backgroundColor: "#FAF5E8", fontColor: "#263238", highlightColor: "#DDECC8", darkMode: false };
const BLUE_THEME = { backgroundColor: "#EAF2FF", fontColor: "#173A79", highlightColor: "#C9DCF9", darkMode: false };
const GREEN_THEME = { backgroundColor: "#EEF8F1", fontColor: "#214B35", highlightColor: "#CBE8D4", darkMode: false };
const LAVENDER_THEME = { backgroundColor: "#F2F0FA", fontColor: "#3D385A", highlightColor: "#DDD7F3", darkMode: false };

export const usePreferencesStore = defineStore("preferences", {
  state: () => ({
    lineHeight: 1.6,
    wordSpacing: 0.5,
    letterSpacing: 0.5,
    fontScale: 1,
    backgroundColor: LIGHT_THEME.backgroundColor,
    fontColor: LIGHT_THEME.fontColor,
    highlightColor: LIGHT_THEME.highlightColor,
    fontFamily: "OpenDyslexic",
    speed: 1,
    darkMode: false,
    themeMode: "light",
    guideLine: true,
    wordHighlight: true,
    saving: false,
    loading: false,
  }),

  actions: {
    toggleDarkMode() { this.setThemeMode(this.darkMode ? "light" : "dark"); },

    setThemeMode(mode) {
      this.themeMode = mode;
      if (mode === "system") {
        const dark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches || false;
        this.applyTheme(dark ? "dark" : "light");
      } else {
        this.applyTheme(mode);
      }
    },

    applyTheme(theme) {
      const selected = theme === "dark" ? DARK_THEME : theme === "cream" ? CREAM_THEME : theme === "blue" ? BLUE_THEME : theme === "green" ? GREEN_THEME : theme === "lavender" ? LAVENDER_THEME : LIGHT_THEME;
      this.backgroundColor = selected.backgroundColor;
      this.fontColor = selected.fontColor;
      this.highlightColor = selected.highlightColor;
      this.darkMode = selected.darkMode;
    },

    increaseLineHeight(step = 0.1) { this.lineHeight = clamp(round1(Number.isFinite(Number(this.lineHeight)) ? Number(this.lineHeight) + step : 1.6), 1.0, 6.0); },
    decreaseLineHeight(step = 0.1) { this.lineHeight = clamp(round1(Number.isFinite(Number(this.lineHeight)) ? Number(this.lineHeight) - step : 1.6), 1.0, 6.0); },
    increaseWordSpacing(step = 0.1) { this.wordSpacing = clamp(round1(Number.isFinite(Number(this.wordSpacing)) ? Number(this.wordSpacing) + step : 0.5), 0.5, 6.0); },
    decreaseWordSpacing(step = 0.1) { this.wordSpacing = clamp(round1(Number.isFinite(Number(this.wordSpacing)) ? Number(this.wordSpacing) - step : 0.5), 0.5, 6.0); },
    increaseLetterSpacing(step = 0.1) { this.letterSpacing = clamp(round1(Number.isFinite(Number(this.letterSpacing)) ? Number(this.letterSpacing) + step : 0.5), 0.5, 6.0); },
    decreaseLetterSpacing(step = 0.1) { this.letterSpacing = clamp(round1(Number.isFinite(Number(this.letterSpacing)) ? Number(this.letterSpacing) - step : 0.5), 0.5, 6.0); },
    increaseFontScale(step = 0.1) { this.fontScale = clamp(round1(Number.isFinite(Number(this.fontScale)) ? Number(this.fontScale) + step : 1), 0.5, 3); },
    decreaseFontScale(step = 0.1) { this.fontScale = clamp(round1(Number.isFinite(Number(this.fontScale)) ? Number(this.fontScale) - step : 1), 0.5, 3); },

    loadFromConfig(c) {
      if (!c) return;
      if (c.espacoLinha != null) this.lineHeight = clamp(round1(c.espacoLinha, 1.6), 1, 6);
      if (c.espacoPalavra != null) this.wordSpacing = clamp(round1(c.espacoPalavra, 0.5), 0.5, 6);
      if (c.espacoLetra != null) this.letterSpacing = clamp(round1(c.espacoLetra, 0.5), 0.5, 6);
      if (c.tamanhoFonte != null) this.fontScale = clamp(round1(c.tamanhoFonte, 1), 0.5, 3);
      if (c.corFundo) this.backgroundColor = c.corFundo;
      if (c.corFonte) this.fontColor = c.corFonte;
      if (c.corDestaque) this.highlightColor = c.corDestaque;
      if (c.nomeFonte) this.fontFamily = c.nomeFonte;
      if (c.velocidadeVoz != null) this.speed = Number(c.velocidadeVoz);
      if (c.temaModo) this.themeMode = c.temaModo; else if (c.modoEscuro != null) this.themeMode = c.modoEscuro ? "dark" : "light";
      if (c.linhaGuia != null) this.guideLine = Boolean(c.linhaGuia);
      if (c.destaquePalavra != null) this.wordHighlight = Boolean(c.destaquePalavra);
    },

    loadFromUser(user) {
      if (!user || !user.configs) return;
      const c = user.configs;
      if (c.espacoLinha != null && Number.isFinite(Number(c.espacoLinha))) this.lineHeight = clamp(round1(Number(c.espacoLinha), 1.6), 1.0, 6.0);
      if (c.espacoPalavra != null && Number.isFinite(Number(c.espacoPalavra))) this.wordSpacing = clamp(round1(Number(c.espacoPalavra), 0.5), 0.5, 6.0);
      if (c.espacoLetra != null && Number.isFinite(Number(c.espacoLetra))) this.letterSpacing = clamp(round1(Number(c.espacoLetra), 0.5), 0.5, 6.0);
      if (c.tamanhoFonte != null && Number.isFinite(Number(c.tamanhoFonte))) this.fontScale = clamp(round1(Number(c.tamanhoFonte), 1), 0.5, 3);
      if (c.corFundo != null) this.backgroundColor = c.corFundo;
      if (c.corFonte != null) this.fontColor = c.corFonte;
      if (c.corDestaque != null) this.highlightColor = c.corDestaque;
      if (c.nomeFonte != null) this.fontFamily = c.nomeFonte;
      if (c.velocidadeVoz != null && Number.isFinite(Number(c.velocidadeVoz))) this.speed = Number(c.velocidadeVoz);
      if (c.modoEscuro != null) this.darkMode = Boolean(c.modoEscuro);
      if (c.temaModo) this.themeMode = c.temaModo; else this.themeMode = this.darkMode ? "dark" : "light";
      if (c.linhaGuia != null) this.guideLine = Boolean(c.linhaGuia);
      if (c.destaquePalavra != null) this.wordHighlight = Boolean(c.destaquePalavra);
    },

    resetToDefaults() {
      this.lineHeight = 1.6;
      this.wordSpacing = 0.5;
      this.letterSpacing = 0.5;
      this.fontScale = 1;
      this.fontFamily = "OpenDyslexic";
      this.speed = 1;
      this.guideLine = true;
      this.wordHighlight = true;
      this.themeMode = "light";
      this.applyTheme("light");
    },

    toServerObject() {
      return {
        espacoLinha: this.lineHeight,
        espacoPalavra: this.wordSpacing,
        espacoLetra: this.letterSpacing,
        tamanhoFonte: this.fontScale,
        corFundo: this.backgroundColor,
        corFonte: this.fontColor,
        corDestaque: this.highlightColor,
        nomeFonte: this.fontFamily,
        velocidadeVoz: this.speed,
        modoEscuro: this.darkMode,
        temaModo: this.themeMode,
        linhaGuia: this.guideLine,
        destaquePalavra: this.wordHighlight,
      };
    },

    async saveToServer() {
      const userStore = useUserStore();
      if (!userStore.isLoggedIn()) return;
      this.saving = true;
      try {
        const res = await fetch(`${API_BASE}/users/${userStore.user._id}/configs`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${userStore.token}` },
          body: JSON.stringify(this.toServerObject()),
        });
        const data = await readJsonSafe(res);
        if (!res.ok) throw new Error(data?.erro || "Erro ao salvar configurações");
        this.loadFromUser(data);
        userStore.user.configs = data.configs;
        localStorage.setItem("user", JSON.stringify(userStore.user));
      } finally {
        this.saving = false;
      }
    },

    async reloadFromServer() {
      const userStore = useUserStore();
      if (!userStore.isLoggedIn()) return;
      this.loading = true;
      try {
        const res = await fetch(`${API_BASE}/users/${userStore.user._id}`, {
          headers: { Authorization: `Bearer ${userStore.token}` },
        });
        const data = await readJsonSafe(res);
        if (!res.ok) throw new Error(data?.erro || "Erro ao carregar configurações");
        this.loadFromUser(data);
        userStore.user.configs = data.configs;
        localStorage.setItem("user", JSON.stringify(userStore.user));
      } finally {
        this.loading = false;
      }
    },
  },
});

async function readJsonSafe(response) {
  const text = await response.text();
  if (!text.trim()) return {};
  try { return JSON.parse(text); } catch { return { erro: text.slice(0, 180) }; }
}
