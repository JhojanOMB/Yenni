// ------------------- CONFIG -------------------
const STORAGE_KEY_LIST = "galeria-lista"; // todas las imágenes que existen
const STORAGE_KEY_SEEN = "galeria-seen";   // imágenes que ya viste
const badge = document.getElementById("notif-badge"); // el badge en index.html

// ------------------- FUNCIONES -------------------
// Mostrar u ocultar badge
function actualizarBadge(nuevas) {
  if (badge) {
    if (nuevas > 0) {
      badge.style.display = "flex";
      badge.textContent = nuevas;
    } else {
      badge.style.display = "none";
    }
  }
}

// Leer arrays de localStorage
function getStored(key) {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : [];
  } catch {
    return [];
  }
}

// Guardar arrays en localStorage
function setStored(key, arr) {
  try { localStorage.setItem(key, JSON.stringify(arr)); } catch {}
}

// ------------------- DETECCIÓN DE NUEVAS IMÁGENES -------------------
function detectarNuevas(imagenesActuales) {
  const listaGuardada = getStored(STORAGE_KEY_LIST); // todas las que conocíamos
  const vistas = getStored(STORAGE_KEY_SEEN);        // ya vistas

  // Guardar lista actual en localStorage
  setStored(STORAGE_KEY_LIST, imagenesActuales);

  // Contar nuevas que no están en vistas
  const nuevas = imagenesActuales.filter(src => !vistas.includes(src));
  actualizarBadge(nuevas.length);
}

// ------------------- INICIALIZACIÓN -------------------
function initNotificaciones() {
  // 1️⃣ Obtener todas las imágenes de la galería
  const galeria = document.querySelectorAll(".gallery-img");
  const imagenesActuales = Array.from(galeria).map(img => img.src);

  // 2️⃣ Detectar nuevas imágenes
  detectarNuevas(imagenesActuales);

  // 3️⃣ Al hacer click en el botón de ir a galería, marcar todas como vistas
  const boton = document.querySelector("#boton-container-notificacion a");
  if (boton) {
    boton.addEventListener("click", () => {
      setStored(STORAGE_KEY_SEEN, imagenesActuales);
      actualizarBadge(0);
    });
  }
}

// ------------------- RUN -------------------
document.addEventListener("DOMContentLoaded", initNotificaciones);
