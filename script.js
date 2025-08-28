class FlipBook {
    constructor(bookElem) {
        this.book = bookElem;
        this.leaves = [...bookElem.querySelectorAll('.hoja')];
        // Recupera la hoja guardada o inicia en 0
        this.current = parseInt(localStorage.getItem('flipbook-hoja')) || 0;
        this.max = this.leaves.length;
        this.init();
    }

    init() {
        this.update();

        this.book.addEventListener('click', e => {
            if (e.target.closest('a')) return;

            const { left, width } = this.book.getBoundingClientRect();
            const x = e.clientX - left;

            if (x > width / 2 && this.current < this.max) this.current++;
            if (x <= width / 2 && this.current > 0) this.current--;

            // Guarda la hoja actual en localStorage
            localStorage.setItem('flipbook-hoja', this.current);

            this.update();

            // Emitimos evento para que otros scripts (reproductor) sepan que cambió la página
            const visibleIndex = Math.min(this.current, this.max - 1);
            this.book.dispatchEvent(new CustomEvent('pageChanged', {
                detail: { current: this.current, visibleIndex }
            }));
        });
    }

    update() {
        this.leaves.forEach((leaf, idx) => {
            const pos = idx < this.current;
            leaf.style.transform = pos ? 'rotateY(-180deg)' : 'rotateY(0deg)';
            leaf.style.zIndex = pos ? idx : this.max - idx;
        });

        // También emitimos evento cuando update() se ejecuta
        const visibleIndex = Math.min(this.current, this.max - 1);
        this.book.dispatchEvent(new CustomEvent('pageChanged', {
            detail: { current: this.current, visibleIndex }
        }));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new FlipBook(document.getElementById('flipbook'));
});

/* ---------- MENSAJE CORAZÓN ---------- */
const mensajeReal = "TE QUIERO MUCHO";
const elemento = document.getElementById("mensaje");
const corazon = document.querySelector(".corazon-img");

// Mostrar primero guiones bajos
let mostrado = mensajeReal.split("").map(char => {
    return char === " " ? " " : "_";
});

if (elemento) {
    elemento.textContent = mostrado.join(" ");
}

let i = 0;
function revelarLetras() {
    if (i < mensajeReal.length) {
        if (mensajeReal[i] !== " ") {
            mostrado[i] = mensajeReal[i];
        }
        elemento.textContent = mostrado.join(" ");
        i++;
        setTimeout(revelarLetras, 400); // velocidad
    }
}

// Reproducir con click en el corazón
if (corazon) {
    corazon.addEventListener("click", () => {
        if (i === 0) { // Solo la primera vez
            revelarLetras();
        }
    });
}

// Reproducir automáticamente cuando se llega a la página del corazón
(function autoStartCorazon(){
    const page = document.getElementById('page-17');
    const flipbook = document.getElementById('flipbook');
    if(!page || !flipbook) return;

    const leaves = flipbook.querySelectorAll('.hoja');
    const pageLeaf = page.closest('.hoja');
    const pageIndex = pageLeaf ? Array.prototype.indexOf.call(leaves, pageLeaf) : -1;
    if(pageIndex < 0) return;

    function handlePageChanged(detail){
        if(!detail) return;
        if(detail.visibleIndex === pageIndex && i === 0){
            revelarLetras(); // Inicia automáticamente si aún no empezó
        }
    }

    flipbook.addEventListener('pageChanged', e => handlePageChanged(e.detail));

    // Chequear estado inicial (si ya estás en esa página al cargar)
    const stored = parseInt(localStorage.getItem('flipbook-hoja'));
    const current = Number.isNaN(stored) ? 0 : stored;
    const initialVisible = Math.min(current, leaves.length-1);
    if(initialVisible === pageIndex && i === 0){
        revelarLetras();
    }
})();


/* ---------- CONFIG FRASES ---------- */
const frases = [
  "«Seré tu memoria cuando las hojas se pierdan.»",
  "«Seré el cómplice de tus locuras.»",
  "«Ya sé que te encanta bailar, por eso te miro como si fueras mi canción favorita.»",
  "«Seré el Badtz-Maru que nunca se rinde si es por ti.»",
  "«Seré quien te diga que no estás sola, ni en tu lado más oscuro.»",
  "«Seré tu escritor fantasma en las páginas de nuestra historia.»",
  "«Sé que dices que no necesitas a nadie, pero igual voy a ser el necio que quiere estar contigo.»",
  "«Sé que puedes con todo sola, pero yo voy a ser el que te recuerde que también puedes descansar en mí.»",
  "«Tú eres mi libro más oscuro y mi poema más tierno.»",
];

// Modo: 'random' | 'sequential' | 'shuffle'
const MODE = 'random';

// Tiempo total que la frase debe estar visible (ms) PERMANECIENDO tras escribirse
const VISIBLE_TIME = 2000;

// Velocidad de tipeo y borrado (ms por carácter)
const TYPE_SPEED = 28;
const DELETE_SPEED = 18;

// Retardo inicial antes de arrancar (ms)
const START_DELAY = 300;

function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }

const el = document.querySelector('.type-text');
const cursor = document.querySelector('.type-cursor');
if(el) {
  let seqIndex = 0;
  let shuffleArr = [];
  let lastIndex = -1;

  function pickIndex() {
    if(MODE === 'sequential'){
      const idx = seqIndex % frases.length;
      seqIndex++;
      return idx;
    }
    if(MODE === 'shuffle'){
      if(shuffleArr.length === 0){
        shuffleArr = frases.map((f,i)=>i);
        // Fisher-Yates shuffle
        for(let i=shuffleArr.length-1;i>0;i--){
          const j = Math.floor(Math.random()*(i+1));
          [shuffleArr[i], shuffleArr[j]] = [shuffleArr[j], shuffleArr[i]];
        }
      }
      return shuffleArr.shift();
    }
    // mode random
    if(frases.length === 1) return 0;
    let idx;
    do {
      idx = Math.floor(Math.random()*frases.length);
    } while(idx === lastIndex);
    return idx;
  }

  async function typeText(text) {
    el.style.visibility = 'visible';
    el.textContent = '';
    for(let i=1;i<=text.length;i++){
      el.textContent = text.slice(0,i);
      await sleep(TYPE_SPEED);
    }
  }

  async function deleteText() {
    let txt = el.textContent;
    while(txt.length > 0){
      txt = txt.slice(0, -1);
      el.textContent = txt;
      await sleep(DELETE_SPEED);
    }
  }

  async function runLoop(){
    await sleep(START_DELAY);
    while(true){
      const idx = pickIndex();
      lastIndex = idx;
      const phrase = frases[idx];
      await typeText(phrase);
      await sleep(VISIBLE_TIME);
      await deleteText();
      await sleep(300);
    }
  }
  
  runLoop().catch(err => console.error(err));
}

/* ---------- REPRODUCTOR + BRIDGE con FlipBook + Guardar progreso (CORREGIDO) ---------- */
(function(){
  if (document.readyState === 'loading') {
    return document.addEventListener('DOMContentLoaded', init);
  } else init();

  function init(){
    const page = document.getElementById('page-28');
    const flipbook = document.getElementById('flipbook') || document.documentElement;
    if (!page || !flipbook) return;

    const audio = document.getElementById('audio-28');
    const playBtn = document.getElementById('dr-play-28');
    const fallbackBtn = document.getElementById('dr-fallback-28');
    const progress = document.getElementById('dr-progress-28');
    const progressFill = document.getElementById('dr-progress-filled-28');
    const timeEl = document.getElementById('dr-time-28');
    const playerEl = document.getElementById('dr-player-28');
    if (!audio || !playerEl) {
      console.warn('Reproductor: falta audio o playerEl');
      return;
    }

    // debug rápido si algo no existe
    console.assert(playBtn, 'No se encontró #dr-play-28');
    console.assert(progress, 'No se encontró #dr-progress-28');

    let isPlaying = false;
    const STORAGE_KEY = "audio-pos-28"; // clave única para esta página

    // ---------- Evitar que el flipbook interprete los toques dentro del reproductor ----------
    const stopAll = ev => { try { ev.stopPropagation(); } catch (e) {} };
    // Bloqueamos en el contenedor del reproductor y en el progress; NO en el playBtn (para evitar interferir)
    ['pointerdown','pointerup','pointermove','pointercancel','touchstart','touchend'].forEach(evName => {
      playerEl.addEventListener(evName, stopAll, { passive: false });
      if (progress) progress.addEventListener(evName, stopAll, { passive: false });
      if (fallbackBtn) fallbackBtn.addEventListener(evName, stopAll, { passive: false });
    });

    // ---------- Helpers ----------
    const fmt = s => { s = Math.max(0, Math.floor(s || 0)); const m = Math.floor(s/60), sec = s % 60; return `${m}:${sec.toString().padStart(2,'0')}`; };
    const setPlayingUI = () => {
      if (!playBtn) return;
      playBtn.textContent = isPlaying ? '⏸' : '▶';
      playBtn.setAttribute('aria-pressed', String(isPlaying));
    };

    async function tryPlay(){
      try {
        await audio.play();
        isPlaying = true;
        setPlayingUI();
        if (fallbackBtn) fallbackBtn.style.display = 'none';
        console.debug('audio: play OK');
      } catch (err) {
        // fallo (autoplay u otro). mostramos fallback si lo tienes
        console.warn('audio: play rejected', err);
        if (fallbackBtn) fallbackBtn.style.display = 'inline-block';
        isPlaying = false;
        setPlayingUI();
      }
    }

    function doPause(){
      try {
        audio.pause();
        isPlaying = false;
        setPlayingUI();
        console.debug('audio: paused');
      } catch (err) {
        console.warn('audio: pause error', err);
      }
    }

    // Toggle robusto: usa estado real de <audio> y promise de play()
    function togglePlay(){
      // prevenir doble-click rápido que pueda crear race
      if (audio.paused || audio.ended) {
        // reproducir
        tryPlay();
      } else {
        // pausar
        doPause();
      }
    }

    // ---------- Progreso ----------
    function updateProgress(){
      if (!audio.duration || !isFinite(audio.duration)) {
        if (progressFill) progressFill.style.width = '0%';
        if (timeEl) timeEl.textContent = '0:00 / 0:00';
        return;
      }
      const pct = (audio.currentTime / audio.duration) * 100;
      if (progressFill) progressFill.style.width = `${pct}%`;
      if (timeEl) timeEl.textContent = `${fmt(audio.currentTime)} / ${fmt(audio.duration)}`;

      // Guardar progreso cada vez que actualiza (timeupdate)
      try { localStorage.setItem(STORAGE_KEY, String(audio.currentTime)); } catch(e) {}
    }

    // Restaurar posición cuando carga metadata
    audio.addEventListener('loadedmetadata', () => {
      try {
        const saved = parseFloat(localStorage.getItem(STORAGE_KEY));
        if (!isNaN(saved) && saved > 0 && saved < audio.duration) {
          audio.currentTime = saved;
        }
      } catch(e){}
      updateProgress();
    });

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', () => { isPlaying = false; setPlayingUI(); });

    // Sincronizar UI con eventos reales del audio (por si se cambia desde otro lado)
    audio.addEventListener('play', () => { isPlaying = true; setPlayingUI(); });
    audio.addEventListener('pause', () => { isPlaying = false; setPlayingUI(); });

    // ---------- Botones ----------
    if (playBtn) {
      // listener limpio: stopPropagation para que no llegue al flipbook y togglePlay()
      playBtn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        ev.preventDefault();
        togglePlay();
      });

      // soporte teclado (space/enter)
      playBtn.addEventListener('keydown', (ev) => {
        if (ev.key === ' ' || ev.key === 'Spacebar' || ev.key === 'Enter') {
          ev.preventDefault();
          togglePlay();
        }
      });
    }

    if (fallbackBtn) {
      fallbackBtn.addEventListener('click', async (ev) => {
        ev.stopPropagation();
        try {
          await audio.play();
          isPlaying = true;
          fallbackBtn.style.display = 'none';
          setPlayingUI();
        } catch (err) {
          console.warn('fallback play failed', err);
        }
      });
    }

    // ---------- Seeking (click + pointer) ----------
    if (progress) {
      progress.addEventListener('click', ev => {
        ev.stopPropagation();
        const rect = progress.getBoundingClientRect();
        const pct = Math.min(1, Math.max(0, (ev.clientX - rect.left) / rect.width));
        if (audio.duration) audio.currentTime = pct * audio.duration;
        updateProgress();
      });

      let isSeeking = false;
      function seekFromPointer(x) {
        const rect = progress.getBoundingClientRect();
        const pct = Math.min(1, Math.max(0, (x - rect.left) / rect.width));
        if (audio.duration) audio.currentTime = pct * audio.duration;
        updateProgress();
      }

      progress.addEventListener('pointerdown', ev => { ev.stopPropagation(); isSeeking = true; try { progress.setPointerCapture(ev.pointerId); } catch {} seekFromPointer(ev.clientX); });
      progress.addEventListener('pointermove', ev => { if (isSeeking) { ev.stopPropagation(); seekFromPointer(ev.clientX); } });
      progress.addEventListener('pointerup', ev => { if (isSeeking) { ev.stopPropagation(); isSeeking = false; try { progress.releasePointerCapture(ev.pointerId);} catch {} seekFromPointer(ev.clientX); } });
      progress.addEventListener('pointercancel', () => { isSeeking = false; });
    }

    // ---------- Integración con FlipBook ----------
    const leaves = flipbook.querySelectorAll('.hoja');
    const pageLeaf = page.closest('.hoja');
    const pageIndex = pageLeaf ? Array.prototype.indexOf.call(leaves, pageLeaf) : -1;
    function handlePageChanged(detail){
      if (!detail || pageIndex < 0) return;
      if (detail.visibleIndex === pageIndex) tryPlay(); else doPause();
    }
    flipbook.addEventListener('pageChanged', e => handlePageChanged(e.detail));

    // ---------- Estado inicial: si la página está visible, intentar reproducir ----------
    const stored = parseInt(localStorage.getItem('flipbook-hoja'));
    const current = Number.isNaN(stored) ? 0 : stored;
    const initialVisible = Math.min(current, leaves.length - 1);
    if (initialVisible === pageIndex) tryPlay(); else doPause();

    // Extra: guarda posición también al salir de la pestaña
    window.addEventListener('beforeunload', () => {
      try { localStorage.setItem(STORAGE_KEY, String(audio.currentTime)); } catch(e) {}
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        try { localStorage.setItem(STORAGE_KEY, String(audio.currentTime)); } catch(e) {}
      }
    });
  } // init
})();
