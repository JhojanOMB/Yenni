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
        });
    }

    update() {
        this.leaves.forEach((leaf, idx) => {
            const pos = idx < this.current;
            leaf.style.transform = pos ? 'rotateY(-180deg)' : 'rotateY(0deg)';
            leaf.style.zIndex = pos ? idx : this.max - idx;
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new FlipBook(document.getElementById('flipbook'));
});

  const mensajeReal = "TE QUIERO MUCHO";
  const elemento = document.getElementById("mensaje");
  const corazon = document.querySelector(".corazon-img");

  // Mostrar primero guiones bajos
  let mostrado = mensajeReal.split("").map(char => {
    return char === " " ? " " : "_";
  });

  elemento.textContent = mostrado.join(" ");

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

  // 👉 Ahora el trigger es el click en el corazón
  corazon.addEventListener("click", () => {
    if (i === 0) { // Solo la primera vez
      revelarLetras();
    }
  });

/* ---------- CONFIG FRASES ---------- */
const frases = [
  "«Seré tu memoria cuando las hojas se pierdan.»",
  "«Seré el complice de tus locuras.»",
  "«Ya sé que te encanta bailar, pero voy a ser el que te mire como si fueras música.»",
  "«Seré el Badtz-Maru que nunca se rinde si es por ti.»",
  "«Seré quien te diga que no estás sola, ni en tu lado más oscuro.»",
  "«Seré tu escritor fantasma en las páginas de nuestra historia.»",
  "«Voy a ser el eco de tus pasos para que nunca camines sola.»",
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

/* ---------- LÓGICA (no necesitas tocar más) ---------- */
function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }

const el = document.querySelector('.type-text');
const cursor = document.querySelector('.type-cursor');
if(!el) {
  console.warn('No se encontró .type-text. Inserta el HTML antes de este script.');
} else {
  // Preparar estado para shuffle
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
    // mode random (por defecto)
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
      // espera visible
      await sleep(VISIBLE_TIME);
      // borrar antes de siguiente
      await deleteText();
      // pequeño descanso antes de continuar
      await sleep(300);
    }
  }
  
  runLoop().catch(err => console.error(err));
}