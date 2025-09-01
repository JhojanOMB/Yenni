const MODEL_SRC = '../media/corazon.glb';

const PARTICLE_COUNT = 1800;
const HEART_SCALE = 18.0;
const JITTER = 18;
const PARTICLE_SIZE_BASE = 3.2;
const PULSE = true;
const PULSE_MAG = 0.9;

const ORBIT_MIN = 1.5;
const ORBIT_MAX = 5.6;

const COLOR_A = { r: 91, g: 15, b: 26 };
const COLOR_B = { r: 58, g: 15, b: 58 };

const GLOBAL_ROTATION_SPEED = 0.00025;
const GLOBAL_ZOOM_AMPLITUDE = 0.045;
const GLOBAL_ZOOM_SPEED = 0.00032;

const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d', { alpha: true });

function resizeCanvas() {
  const DPR = Math.max(1, window.devicePixelRatio || 1);
  canvas.width = Math.floor(window.innerWidth * DPR);
  canvas.height = Math.floor(window.innerHeight * DPR);
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function heartPoint(t) {
  const x = 16 * Math.pow(Math.sin(t), 3);
  const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
  return { x, y };
}
function getCenter() {
  return { x: window.innerWidth / 2, y: window.innerHeight / 2 + 6 };
}
function mixColor(a, b, t) {
  const r = Math.round(a.r + (b.r - a.r) * t);
  const g = Math.round(a.g + (b.g - a.g) * t);
  const bb = Math.round(a.b + (b.b - a.b) * t);
  return `rgba(${r},${g},${bb},`;
}
function buildTargets(count, centerX, centerY, scale) {
  const arr = [];
  for (let i = 0; i < count; i++) {
    const t = (i / count) * Math.PI * 2;
    const p = heartPoint(t);
    const jitterFactor = JITTER * (0.5 + Math.random());
    const sx = centerX + p.x * scale + (Math.random() - 0.5) * jitterFactor;
    const sy = centerY - p.y * scale + (Math.random() - 0.5) * jitterFactor;
    const z = Math.random();
    arr.push({ x: sx, y: sy, z });
  }
  return arr;
}

let particles = [];
function initParticles() {
  particles = [];
  const c = getCenter();
  const scale = Math.min(window.innerWidth, window.innerHeight) / (HEART_SCALE * 2.8);
  const targets = buildTargets(PARTICLE_COUNT, c.x, c.y, scale);
  for (let i = 0; i < targets.length; i++) {
    const t = targets[i];
    const orbitR = ORBIT_MIN + (ORBIT_MAX - ORBIT_MIN) * t.z;
    particles.push({
      tx: t.x,
      ty: t.y,
      tz: t.z,
      x: t.x,
      y: t.y,
      size: PARTICLE_SIZE_BASE * (0.6 + Math.pow(1 - t.z, 2) * 2.2),
      alpha: 0.65 + t.z * 0.35,
      phase: Math.random() * Math.PI * 2,
      colorBase: mixColor(COLOR_A, COLOR_B, t.z),
      orbitR
    });
  }
}
initParticles();

let lastTS = performance.now();
let globalAngle = 0;

function draw(now) {
  const dt = now - lastTS;
  lastTS = now;

  globalAngle += GLOBAL_ROTATION_SPEED * dt;
  const zoom = 1 + Math.sin(now * GLOBAL_ZOOM_SPEED) * GLOBAL_ZOOM_AMPLITUDE;

  const center = getCenter();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const haloRadius = Math.min(window.innerWidth, window.innerHeight) * 0.36;
  ctx.beginPath();
  ctx.fillStyle = 'rgba(120,20,40,0.02)';
  ctx.arc(center.x, center.y, haloRadius, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];

    const t = now * 0.0009 + p.phase;
    const angleLocal = t * (0.9 + p.tz * 0.7);
    const oxLocal = Math.cos(angleLocal) * p.orbitR + Math.sin(now * 0.0007 + p.phase * 0.12) * 0.35;
    const oyLocal = Math.sin(angleLocal * 1.05) * (p.orbitR * 0.78) + Math.cos(now * 0.0009 + p.phase * 0.11) * 0.28;

    let pulseX = 0, pulseY = 0;
    if (PULSE) {
      const tp = now * 0.0012 + p.phase;
      pulseX = Math.cos(tp * 1.2) * (PULSE_MAG * 0.18) * (0.8 + p.tz);
      pulseY = Math.sin(tp * 1.4) * (PULSE_MAG * 0.16) * (0.8 + p.tz);
    }

    let x = p.tx + oxLocal + pulseX;
    let y = p.ty + oyLocal + pulseY;

    // 🔄 Pseudo-3D rotación alrededor del eje Y
    const dx = x - center.x;
    const dz = (p.tz - 0.5) * 200;
    const rotatedX = dx * Math.cos(globalAngle) - dz * Math.sin(globalAngle);
    const rotatedZ = dx * Math.sin(globalAngle) + dz * Math.cos(globalAngle);
    const scaleZ = 1 / (1 + rotatedZ * 0.002);
    const finalX = center.x + rotatedX * scaleZ;
    const finalY = center.y + (y - center.y) * scaleZ;

    ctx.beginPath();
    ctx.fillStyle = p.colorBase + (p.alpha * 0.95) + ')';
    ctx.shadowBlur = 6 * (0.1 + Math.pow(p.tz, 1.5));
    ctx.shadowColor = 'rgba(120,20,40,0.08)';
    ctx.arc(finalX, finalY, p.size * scaleZ, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  requestAnimationFrame(draw);
}
requestAnimationFrame(draw);

window.addEventListener('resize', () => {
  resizeCanvas();
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    initParticles();
  }, 160);
});

const audio = document.getElementById('bgAudio');
const btn = document.getElementById('btnPlay');
const label = document.getElementById('audioLabel');
let isPlaying = false;

async function tryPlay() {
  try {
    await audio.play();
    isPlaying = true;
    btn.textContent = '❚❚';
    label.textContent = 'Pausar música';
  } catch (err) {
    console.warn('Autoplay bloqueado:', err);
    btn.textContent = '►';
    label.textContent = 'Reproducir música';
  }
}

window.addEventListener('load', () => {
  const mv = document.getElementById('mv');
  if (mv) mv.src = MODEL_SRC;
  tryPlay();
});

btn.addEventListener('click', async () => {
  if (audio.paused) {
    try {
      await audio.play();
      isPlaying = true;
      btn.textContent = '❚❚';
      label.textContent = 'Pausar música';
    } catch (e) {
      console.error('Error al reproducir:', e);
      label.textContent = 'Pulsa ► para reproducir música';
    }
  } else {
    audio.pause();
    isPlaying = false;
    btn.textContent = '►';
    label.textContent = 'Reproducir música';
  }
});