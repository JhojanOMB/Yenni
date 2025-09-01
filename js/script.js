let preventFlip = false;

class FlipBook {
    constructor(bookElem) {
        this.book = bookElem;
        this.leaves = [...bookElem.querySelectorAll('.hoja')];
        this.current = parseInt(localStorage.getItem('flipbook-hoja')) || 0;
        this.max = this.leaves.length;
        this.init();
    }

    init() {
        this.update();

        this.book.addEventListener('click', e => {
            if (e.target.closest('.reproductor')) return; // evita clicks en cualquier hijo del reproductor
            if (e.target.closest('a')) return;

            const { left, width } = this.book.getBoundingClientRect();
            const x = e.clientX - left;

            if (x > width / 2 && this.current < this.max) this.current++;
            if (x <= width / 2 && this.current > 0) this.current--;

            localStorage.setItem('flipbook-hoja', this.current);
            this.update();

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
const VISIBLE_TIME = 5000;

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

document.addEventListener('DOMContentLoaded', () => {
    const flipbook = document.getElementById('flipbook');
    if (!flipbook) return;
    new FlipBook(flipbook);

    // ---------- REPRODUCTOR INTEGRADO ----------
    const page = document.getElementById('page-28');
    const audio = document.getElementById('audio-28');
    const playBtn = document.getElementById('dr-play-28');
    const fallbackBtn = document.getElementById('dr-fallback-28');
    const progress = document.getElementById('dr-progress-28');
    const progressFill = document.getElementById('dr-progress-filled-28');
    const timeEl = document.getElementById('dr-time-28');
    const playerEl = document.getElementById('dr-player-28');

    if (!audio || !playerEl || !page) return;

    let isPlaying = false;
    const STORAGE_KEY = "audio-pos-28";

    const fmt = s => {
        s = Math.max(0, Math.floor(s || 0));
        const m = Math.floor(s / 60),
              sec = s % 60;
        return `${m}:${sec.toString().padStart(2, '0')}`;
    };

    const setPlayingUI = () => {
        if (!playBtn) return;
        playBtn.textContent = isPlaying ? '⏸' : '▶';
        playBtn.setAttribute('aria-pressed', String(isPlaying));
    };

    const tryPlay = async () => {
        try {
            await audio.play();
            isPlaying = true;
            setPlayingUI();
            if (fallbackBtn) fallbackBtn.style.display = 'none';
        } catch (err) {
            console.warn('audio: play rejected', err);
            isPlaying = false;
            setPlayingUI();
            if (fallbackBtn) fallbackBtn.style.display = 'inline-block';
        }
    };

    const doPause = () => {
        audio.pause();
        isPlaying = false;
        setPlayingUI();
    };

    const togglePlay = () => {
        if (audio.paused || audio.ended) tryPlay();
        else doPause();
    };

    const updateProgress = () => {
        if (!audio.duration || !isFinite(audio.duration)) {
            if (progressFill) progressFill.style.width = '0%';
            if (timeEl) timeEl.textContent = '0:00 / 0:00';
            return;
        }
        const pct = (audio.currentTime / audio.duration) * 100;
        if (progressFill) progressFill.style.width = `${pct}%`;
        if (timeEl) timeEl.textContent = `${fmt(audio.currentTime)} / ${fmt(audio.duration)}`;
        try { localStorage.setItem(STORAGE_KEY, String(audio.currentTime)); } catch(e) {}
    };

    audio.addEventListener('loadedmetadata', () => {
        const saved = parseFloat(localStorage.getItem(STORAGE_KEY));
        if (!isNaN(saved) && saved > 0 && saved < audio.duration) {
            audio.currentTime = saved;
        }
        updateProgress();
    });

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', () => { isPlaying = false; setPlayingUI(); });
    audio.addEventListener('play', () => { isPlaying = true; setPlayingUI(); });
    audio.addEventListener('pause', () => { isPlaying = false; setPlayingUI(); });

    // Evitar que clicks dentro del reproductor lleguen al flipbook
    ['click', 'pointerdown', 'pointerup', 'pointermove', 'pointercancel', 'touchstart', 'touchend'].forEach(ev => {
        playerEl.addEventListener(ev, e => e.stopPropagation());
    });

    playBtn.addEventListener('click', ev => {
        ev.stopPropagation(); // evita que FlipBook reciba este click
        togglePlay();         // reproduce o pausa normalmente
    });

    if (fallbackBtn) {
        fallbackBtn.addEventListener('click', async ev => {
            ev.stopPropagation();
            try { 
                await audio.play(); 
                isPlaying = true; 
                fallbackBtn.style.display = 'none'; 
                setPlayingUI(); 
            } catch(err) { console.warn('fallback play failed', err); }
        });
    }

    if (progress) {
        progress.addEventListener('click', ev => {
            ev.stopPropagation();
            const rect = progress.getBoundingClientRect();
            const pct = Math.min(1, Math.max(0, (ev.clientX - rect.left)/rect.width));
            if (audio.duration) audio.currentTime = pct * audio.duration;
            updateProgress();
        });
    }

    // ---------- Integración con FlipBook ----------
    const leaves = flipbook.querySelectorAll('.hoja');
    const pageLeaf = page.closest('.hoja');
    const pageIndex = pageLeaf ? Array.prototype.indexOf.call(leaves, pageLeaf) : -1;

    const handlePageChanged = detail => {
        if (!detail || pageIndex < 0) return;
        if (detail.visibleIndex === pageIndex) tryPlay();
        else doPause();
    };

    flipbook.addEventListener('pageChanged', e => handlePageChanged(e.detail));

    // Estado inicial
    const storedPage = parseInt(localStorage.getItem('flipbook-hoja'));
    const currentPage = Number.isNaN(storedPage) ? 0 : storedPage;
    if (currentPage === pageIndex) tryPlay();
});

(function(){
    const flipbook = document.getElementById('flipbook');
    const page = document.getElementById('page-28');
    const audio = document.getElementById('audio-28');
    const playBtn = document.getElementById('dr-play-28');
    const fraseEl = document.getElementById('cancion-frase-28');
    const fraseTexto = "«Que cada nota me recuerde a ti, y cada suspiro sea tuyo.»";

    if(!flipbook || !page || !audio || !fraseEl || !playBtn) return;

    let typingTimeouts = [];

    // Efecto tipeo
    async function typeFrase(text, el, speed = 150){
        clearFrase(); // Limpiamos antes de escribir
        el.textContent = '';
        for(let i = 0; i < text.length; i++){
            const timeout = setTimeout(() => {
                el.textContent = text.slice(0, i+1);
            }, i * speed);
            typingTimeouts.push(timeout);
        }
    }

    // Limpiar frase y timeouts
    function clearFrase(){
        typingTimeouts.forEach(t => clearTimeout(t));
        typingTimeouts = [];
        if(fraseEl) fraseEl.textContent = '';
    }

    // Detectar cambio de página
    const leaves = flipbook.querySelectorAll('.hoja');
    const pageLeaf = page.closest('.hoja');
    const pageIndex = pageLeaf ? Array.prototype.indexOf.call(leaves, pageLeaf) : -1;
    if(pageIndex < 0) return;

    flipbook.addEventListener('pageChanged', async (e) => {
        if(!e.detail) return;
        if(e.detail.visibleIndex === pageIndex){
            // Reproducir audio
            try { await audio.play(); } catch(err){ console.warn(err); }
            // Mostrar frase lentamente
            typeFrase(fraseTexto, fraseEl, 150);
        } else {
            // Pausar y limpiar al salir
            audio.pause();
            audio.currentTime = 0;
            clearFrase();
        }
    });

    // También si al cargar ya estás en esa página
    const stored = parseInt(localStorage.getItem('flipbook-hoja'));
    const current = Number.isNaN(stored) ? 0 : stored;
    if(Math.min(current, leaves.length-1) === pageIndex){
        audio.play().catch(err=>console.warn(err));
        typeFrase(fraseTexto, fraseEl, 150);
    }

})();
