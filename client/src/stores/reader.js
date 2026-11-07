import { defineStore } from "pinia";
import { useTextStore } from "./text";
import { usePaginationStore } from "./pagination";
import { usePreferencesStore } from "./preferences";

const LANGUAGE_WORDS = {
  "pt-BR": ["que","não","uma","para","com","como","você","dos","das","isso","por","mais","uma","seu","sua","está","são","leitura"],
  "en-US": ["the","and","you","with","that","this","for","from","are","is","not","have","your","read","reading"],
  "es-ES": ["que","una","para","con","como","esta","este","los","las","por","más","una","sus","son","lectura"],
  "fr-FR": ["que","une","pour","avec","dans","les","des","est","sont","vous","pas","plus","lecture"],
  "it-IT": ["che","una","per","con","come","sono","non","questo","questa","della","delle","più","lettura"],
  "de-DE": ["der","die","das","und","für","mit","ist","nicht","eine","ein","von","auf","lesen","lesung"],
};

function detectLanguage(text) {
  const words = String(text || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").match(/[a-z]+/g) || [];
  if (!words.length) return "pt-BR";
  const scores = Object.entries(LANGUAGE_WORDS).map(([lang, list]) => [lang, list.reduce((score, word) => score + (words.includes(word.normalize("NFD").replace(/[\u0300-\u036f]/g, "")) ? 1 : 0), 0)]);
  scores.sort((a,b)=>b[1]-a[1]);
  return scores[0][1] > 0 ? scores[0][0] : "pt-BR";
}

export const useReaderStore = defineStore("reader", {
  state: () => ({ currentWordIndex:null, currentWordPos:null, isPlaying:false, isPaused:false, voices:[], selectedVoiceURI:null, detectedLanguage:"pt-BR", _cancelRequested:false }),
  actions: {
    loadVoices() { if(typeof window==="undefined"||!window.speechSynthesis)return; this.voices=window.speechSynthesis.getVoices(); },
    setWord(index){this.currentWordIndex=index;this.currentWordPos=null},
    startFromWord(index){this.setWord(index);this.play()},
    getVisibleWordTokens(){const t=useTextStore(),p=usePaginationStore(),w=t.tokens.filter(x=>x.isWord);return w.slice(p.startIndex,p.startIndex+p.maxWords)},
    play(){
      const synth=window.speechSynthesis;if(!synth)return;try{synth.resume()}catch{};synth.cancel();
      const textStore=useTextStore(), paginationStore=usePaginationStore(), allWords=textStore.tokens.filter(t=>t.isWord), visibleWords=this.getVisibleWordTokens();if(!visibleWords.length)return;
      let startPos=0;if(this.currentWordIndex!==null){const globalPos=allWords.findIndex(w=>w.index===this.currentWordIndex),visibleStart=paginationStore.startIndex;if(globalPos>=visibleStart&&globalPos<visibleStart+visibleWords.length)startPos=globalPos-visibleStart}
      const startToken=visibleWords[startPos],startTokenIndex=textStore.tokens.findIndex(t=>t.index===startToken.index),endToken=visibleWords[visibleWords.length-1],endTokenIndex=textStore.tokens.findIndex(t=>t.index===endToken.index),pageTokens=textStore.tokens.slice(startTokenIndex,endTokenIndex+1),spokenText=pageTokens.map(t=>t.text).join("");if(!spokenText.trim())return;
      const preferences=usePreferencesStore(); const language=detectLanguage(textStore.originalText || spokenText); this.detectedLanguage=language;
      const preferred=this.voices.find(v=>v.voiceURI===this.selectedVoiceURI); const voice=preferred || this.voices.find(v=>v.lang?.toLowerCase()===language.toLowerCase()) || this.voices.find(v=>v.lang?.toLowerCase().startsWith(language.slice(0,2).toLowerCase())) || this.voices.find(v=>v.lang?.toLowerCase().startsWith("pt-br")) || this.voices[0];
      const utterance=new SpeechSynthesisUtterance(spokenText);if(voice)utterance.voice=voice;utterance.rate=Math.min(2,Math.max(.5,Number(preferences.speed)||1));utterance.pitch=1;utterance.lang=voice?.lang||language;
      this._cancelRequested=false;this.isPlaying=true;this.isPaused=false;this.currentWordPos=startPos;this.currentWordIndex=startToken.index;
      utterance.onboundary=(event)=>{if(this._cancelRequested||event.name!=="word")return;const charIndex=event.charIndex||0;let cursor=0;for(let i=startPos;i<visibleWords.length;i++){const word=visibleWords[i],idx=spokenText.indexOf(word.text,cursor);if(idx<0)continue;const end=idx+word.text.length;if(charIndex>=idx&&charIndex<=end){this.currentWordPos=i;this.currentWordIndex=word.index;break}cursor=end}};
      utterance.onend=()=>{if(this._cancelRequested)return;if(this._tryAdvancePage())return;this._resetReadingState()};utterance.onerror=(event)=>{if(this._cancelRequested)return;if(event?.error==="interrupted"||event?.error==="canceled")return;this._resetReadingState()};synth.speak(utterance);
    },
    _tryAdvancePage(){const p=usePaginationStore(),t=useTextStore(),w=t.tokens.filter(x=>x.isWord),next=p.startIndex+p.maxWords;if(next>=w.length)return false;p.startIndex=next;const nw=this.getVisibleWordTokens();if(!nw.length)return false;this.currentWordPos=0;this.currentWordIndex=nw[0].index;window.setTimeout(()=>this.play(),30);return true},
    _resetReadingState(){this.isPlaying=false;this.isPaused=false;this.currentWordIndex=null;this.currentWordPos=null},
    pause(){if(!this.isPlaying||this.isPaused)return;this._cancelRequested=false;const synth=window.speechSynthesis;if(!synth)return;synth.pause();this.isPaused=true},
    stop(){this._cancelRequested=true;window.speechSynthesis?.cancel();this._resetReadingState()},
    togglePlay(){const synth=window.speechSynthesis;if(this.isPlaying&&this.isPaused){try{synth.resume()}catch{};this.isPaused=false;return}if(this.isPlaying)this.pause();else this.play()},
  },
});
