// corazon_no_shadows.js — Versión más luminosa (sin sombras)
import * as THREE from 'https://esm.sh/three@0.158.0';
import { OrbitControls } from 'https://esm.sh/three@0.158.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://esm.sh/three@0.158.0/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'https://esm.sh/three@0.158.0/examples/jsm/loaders/DRACOLoader.js';

//// CONFIG
const MODEL_SRC = '../media/corazon.glb';
const PARTICLE_COUNT = 1800;
const HEART_SCALE = 12.0;
const JITTER = 18;
const PARTICLE_SIZE_BASE = 6.0;
const PULSE = true;
const PULSE_MAG = 0.9;
const ORBIT_MIN = 1.5;
const ORBIT_MAX = 5.6;
const COLOR_A = new THREE.Color(91/255,15/255,26/255);
const COLOR_B = new THREE.Color(58/255,15/255,58/255);
const GLOBAL_ROTATION_SPEED = 0.00012;
const GLOBAL_ZOOM_AMPLITUDE = 0.035;
const GLOBAL_ZOOM_SPEED = 0.00032;

const SWIRL_RADIUS = 5.8;
const SWIRL_SPEED = 0.0009;
const HELIX_AMP = 8.5;

// flags
const FORCE_CONVERT_UNLIT = true;
const DEBUG_MATERIALS = false;

// BRIGHTNESS HELPERS
let LIGHT_BOOST = 1.0; // pulsa 'b' para alternar boost (1 -> 1.6)
const BASE_KEY_INTENSITY = 1.2;
const BASE_FILL_INTENSITY = 1.0;
const BASE_BOTTOM_INTENSITY = 1.4;
const BASE_DIR_INTENSITY = 0.45;
const BASE_AMBIENT_INTENSITY = 1.2;
const BASE_HEMI_INTENSITY = 0.6;

//// SETUP SCENE + RENDERER
const container = document.getElementById('container');
if (!container) console.error('No se encontró #container en el DOM.');

const scene = new THREE.Scene();
scene.background = null;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio || 1);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);
// DESACTIVADO: no necesitamos sombras
renderer.shadowMap.enabled = false;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// compatibility r152/r155+
renderer.useLegacyLights = false;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.35; // subimos exposure para dar más luz general

container.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 20000);
camera.position.set(0, 0, 120);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 10;
controls.maxDistance = 2000;
controls.target.set(0, 0, 0);

//// PARTICLES
const particleGeo = new THREE.BufferGeometry();
const positions = new Float32Array(PARTICLE_COUNT * 3);
const basePos = new Float32Array(PARTICLE_COUNT * 3);
const aZ = new Float32Array(PARTICLE_COUNT);
const aPhase = new Float32Array(PARTICLE_COUNT);
const aSize = new Float32Array(PARTICLE_COUNT);
const colors = new Float32Array(PARTICLE_COUNT * 3);

function heartPoint(t) {
  const x = 16 * Math.pow(Math.sin(t), 3);
  const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
  return { x, y };
}
function buildTargets(count, scale) {
  const arr = [];
  for (let i = 0; i < count; i++) {
    const t = (i / count) * Math.PI * 2;
    const p = heartPoint(t);
    const jitterFactor = JITTER * (0.5 + Math.random());
    const sx = p.x * scale + (Math.random() - 0.5) * jitterFactor;
    const sy = p.y * scale + (Math.random() - 0.5) * jitterFactor;
    const z = Math.random();
    arr.push({ x: sx, y: sy, z });
  }
  return arr;
}
function initParticles() {
  const scale = Math.min(window.innerWidth, window.innerHeight) / (HEART_SCALE * 2.8);
  const targets = buildTargets(PARTICLE_COUNT, scale);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const t = targets[i];
    positions[i*3+0] = t.x + (Math.random()-0.5)*2;
    positions[i*3+1] = t.y + (Math.random()-0.5)*2;
    positions[i*3+2] = (t.z - 0.5) * 20;

    basePos[i*3+0] = t.x;
    basePos[i*3+1] = t.y;
    basePos[i*3+2] = (t.z - 0.5) * 20;

    aZ[i] = t.z;
    aPhase[i] = Math.random() * Math.PI * 2;
    aSize[i] = PARTICLE_SIZE_BASE * (0.6 + Math.pow(1 - t.z, 2) * 2.2);

    const col = COLOR_A.clone().lerp(COLOR_B, t.z);
    colors[i*3+0] = col.r;
    colors[i*3+1] = col.g;
    colors[i*3+2] = col.b;
  }
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeo.setAttribute('aBasePos', new THREE.BufferAttribute(basePos, 3));
  particleGeo.setAttribute('aZ', new THREE.BufferAttribute(aZ, 1));
  particleGeo.setAttribute('aPhase', new THREE.BufferAttribute(aPhase, 1));
  particleGeo.setAttribute('aSize', new THREE.BufferAttribute(aSize, 1));
  particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
}
initParticles();

//// SHADERS
const vertexShader = /* glsl */`
  attribute vec3 aBasePos;
  attribute float aZ;
  attribute float aPhase;
  attribute float aSize;
  varying float vZ;
  varying vec3 vColor;
  uniform float uTime;
  uniform float uGlobalAngle;
  uniform float uPixelRatio;
  uniform float uZoomFactor;
  uniform float uSwirlRadius;
  uniform float uSwirlSpeed;
  uniform float uHelixAmp;
  void main(){
    vColor = color;
    vZ = aZ;

    float t = uTime * 0.0009 + aPhase;
    float angleLocal = t * (0.9 + aZ * 0.7);

    float orbitR = ${ORBIT_MIN.toFixed(3)} + (${ORBIT_MAX.toFixed(3)} - ${ORBIT_MIN.toFixed(3)}) * aZ;
    float oxLocal = cos(angleLocal) * orbitR + sin(uTime * 0.0007 + aPhase * 0.12) * 0.35;
    float oyLocal = sin(angleLocal * 1.05) * (orbitR * 0.78) + cos(uTime * 0.0009 + aPhase * 0.11) * 0.28;

    vec2 baseXY = aBasePos.xy;
    float distFromCenter = length(baseXY);
    vec2 dir = (distFromCenter > 0.0001) ? normalize(baseXY) : vec2(1.0, 0.0);
    vec2 perp = vec2(-dir.y, dir.x);

    float swirlAngle = uGlobalAngle * 0.6 + uTime * uSwirlSpeed * 0.001 + aPhase * 0.6;
    float swirlStrength = (1.0 - smoothstep(0.0, 40.0, distFromCenter)) * 1.0;

    vec3 swirlOffset = vec3(perp * cos(swirlAngle) * uSwirlRadius * (0.6 + aZ * 0.8) * swirlStrength,
                            sin(swirlAngle * 1.45) * uHelixAmp * (1.0 - aZ) * swirlStrength );

    float pulseX = 0.0;
    float pulseY = 0.0;
    if (${PULSE ? 1 : 0} == 1) {
      float tp = uTime * 0.0012 + aPhase;
      pulseX = cos(tp * 1.2) * (${(PULSE_MAG*0.18).toFixed(4)}) * (0.8 + aZ);
      pulseY = sin(tp * 1.4) * (${(PULSE_MAG*0.16).toFixed(4)}) * (0.8 + aZ);
    }

    vec3 pos = aBasePos + vec3(oxLocal + pulseX, oyLocal + pulseY, (aZ - 0.5) * 20.0) + swirlOffset;

    float dx = pos.x;
    float dz = pos.z;
    float c = cos(uGlobalAngle);
    float s = sin(uGlobalAngle);
    float rx = dx * c - dz * s;
    float rz = dx * s + dz * c;
    pos.x = rx;
    pos.z = rz;

    vec4 mvPosition = modelViewMatrix * vec4(pos * (1.0 + uZoomFactor), 1.0);
    gl_Position = projectionMatrix * mvPosition;

    float size = aSize;
    float perspectiveScale = (300.0 / (-mvPosition.z + 50.0));
    gl_PointSize = max(1.0, size * perspectiveScale * uPixelRatio);
  }
`;

const fragmentShader = /* glsl */`
  varying float vZ;
  varying vec3 vColor;
  void main(){
    vec2 uv = gl_PointCoord - vec2(0.5);
    float dist = length(uv);
    float alpha = smoothstep(0.5, 0.18, dist);
    float glow = 1.0 - dist * 1.6;
    glow = pow(max(glow, 0.0), 1.5);
    vec3 col = vColor * (0.6 + glow * 1.2);
    gl_FragColor = vec4(col, alpha * (0.65 + vZ * 0.35));
    gl_FragColor.rgb += 0.06 * glow;
    if (gl_FragColor.a < 0.01) discard;
  }
`;

const particleMat = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  vertexColors: true,
  uniforms: {
    uTime: { value: 0 },
    uPixelRatio: { value: window.devicePixelRatio || 1 },
    uGlobalAngle: { value: 0 },
    uZoomFactor: { value: 0 },
    uSwirlRadius: { value: SWIRL_RADIUS },
    uSwirlSpeed: { value: SWIRL_SPEED },
    uHelixAmp: { value: HELIX_AMP }
  }
});

const particlePoints = new THREE.Points(particleGeo, particleMat);
particlePoints.frustumCulled = false;

const sceneGroup = new THREE.Group();
sceneGroup.add(particlePoints);
scene.add(sceneGroup);

//// LIGHTS: instancias sin sombras
const keyLight = new THREE.SpotLight(0xff9fcf, BASE_KEY_INTENSITY * LIGHT_BOOST, 0, Math.PI * 0.22, 0.4, 1.0);
const fillLight = new THREE.SpotLight(0xffcfe6, BASE_FILL_INTENSITY * LIGHT_BOOST, 0, Math.PI * 0.5, 0.6, 1.0);
const bottomLight = new THREE.PointLight(0xffa7c0, BASE_BOTTOM_INTENSITY * LIGHT_BOOST, 400, 1.0);
const dirLight = new THREE.DirectionalLight(0xffffff, BASE_DIR_INTENSITY * LIGHT_BOOST);

// ambient & hemi para levantar tonos
const amb = new THREE.AmbientLight(0xffffff, BASE_AMBIENT_INTENSITY * LIGHT_BOOST);
const hemi = new THREE.HemisphereLight(0xffe6f0, 0x080006, BASE_HEMI_INTENSITY * LIGHT_BOOST);

scene.add(keyLight, fillLight, bottomLight, dirLight, amb, hemi);

// helpers opcionales
const keyHelper = new THREE.SpotLightHelper(keyLight);
const fillHelper = new THREE.SpotLightHelper(fillLight);
const bottomHelper = new THREE.PointLightHelper(bottomLight, 2);
scene.add(keyHelper, fillHelper, bottomHelper);
keyHelper.visible = false;
fillHelper.visible = false;
bottomHelper.visible = false;

//// CARGA MODELO
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);

const modelGroup = new THREE.Group();
modelGroup.frustumCulled = false;
const loadingEl = document.getElementById('loading');

function isUnlitMaterial(mat) {
  if (!mat) return false;
  if (mat.isMeshBasicMaterial) return true;
  if (mat.userData && mat.userData.gltfExtensions && mat.userData.gltfExtensions.KHR_materials_unlit) return true;
  if (mat.type && typeof mat.type === 'string' && mat.type.toLowerCase().includes('unlit')) return true;
  return false;
}
function convertUnlitToStandard(oldMat) {
  const map = oldMat.map || null;
  const color = (oldMat.color && oldMat.color.clone) ? oldMat.color.clone() : new THREE.Color(0xffffff);
  // Subimos metalness/roughness y añadimos un poco de emissive para que no quede plano
  const newMat = new THREE.MeshStandardMaterial({
    color,
    map,
    metalness: Math.min(1.0, (oldMat.metalness !== undefined ? oldMat.metalness : 0.0) + 0.18),
    roughness: Math.max(0.0, (oldMat.roughness !== undefined ? oldMat.roughness : 1.0) - 0.4),
    side: THREE.DoubleSide,
    transparent: oldMat.transparent || false,
    opacity: oldMat.opacity !== undefined ? oldMat.opacity : 1
  });
  // Añadimos un leve emissive del mismo tono para levantar sombras duras
  const emissiveTone = new THREE.Color(color).multiplyScalar(0.12);
  newMat.emissive = emissiveTone;
  newMat.emissiveIntensity = 0.55;
  return newMat;
}

loader.load(MODEL_SRC, (gltf) => {
  const model = gltf.scene || gltf.scenes[0];
  modelGroup.add(model);

  if (DEBUG_MATERIALS) {
    model.traverse((c) => {
      if (c.isMesh && c.material) console.log('ANTES', c.name || c.uuid, c.material.type, c.material);
    });
  }

  // ensure normals exist
  model.traverse((c) => {
    if (c.isMesh && c.geometry && !c.geometry.attributes.normal) {
      try { c.geometry.computeVertexNormals(); if (DEBUG_MATERIALS) console.log('Normals computed for', c.name || c.uuid); }
      catch(e) { console.warn('No se pudieron calcular normales', c.name || c.uuid, e); }
    }
  });

  // convert unlit/basic -> standard and set map color space
  model.traverse((c) => {
    if (c.isMesh && c.material) {
      if (c.material.map) {
        try { c.material.map.colorSpace = THREE.SRGBColorSpace; } catch(e){/*ignore*/ }
      }
      if (FORCE_CONVERT_UNLIT && isUnlitMaterial(c.material)) {
        c.material = convertUnlitToStandard(c.material);
      } else if (c.material.isMeshBasicMaterial) {
        const map = c.material.map || null;
        const baseColor = (c.material.color && c.material.color.clone) ? c.material.color.clone() : new THREE.Color(0xffffff);
        c.material = new THREE.MeshStandardMaterial({
          color: baseColor,
          map,
          metalness: 0.18,
          roughness: 0.35,
          side: THREE.DoubleSide
        });
      } else if (c.material.isMeshStandardMaterial) {
        c.material.metalness = Math.min(1, (c.material.metalness || 0) + 0.18);
        c.material.roughness = Math.max(0, (c.material.roughness || 1) - 0.4);
        // añadir un poco de emissive si no tiene
        if (!c.material.emissive || c.material.emissive.equals(new THREE.Color(0,0,0))) {
          c.material.emissive = (c.material.color) ? c.material.color.clone().multiplyScalar(0.08) : new THREE.Color(0x220000);
          c.material.emissiveIntensity = 0.45;
        }
      }
      if (c.material) c.material.side = THREE.DoubleSide;
      if (c.material) c.material.needsUpdate = true;
    }
  });

  if (DEBUG_MATERIALS) {
    model.traverse((c) => {
      if (c.isMesh && c.material) console.log('DESPUÉS', c.name || c.uuid, c.material.type, c.material);
    });
  }

  // scale + center
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  if (maxDim > 0) {
    const desired = 55;
    const scaleFactor = desired / maxDim;
    model.scale.setScalar(scaleFactor);
    box.setFromObject(model);
    box.getSize(size);
    box.getCenter(center);
  }
  model.position.sub(center);

  sceneGroup.add(modelGroup);

  // fit camera
  (function fitCameraToObject(camera, object, controls, offset = 1.05) {
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxSize = Math.max(size.x, size.y, size.z);
    if (maxSize === 0) return;
    const fov = camera.fov * (Math.PI / 180);
    const aspect = camera.aspect;
    const fitHeightDistance = Math.abs(maxSize / 2 / Math.tan(fov / 2));
    const fitWidthDistance = Math.abs((maxSize / 2) / Math.tan(fov / 2) / aspect);
    let distance = Math.max(fitHeightDistance, fitWidthDistance);
    distance = distance * offset;
    const dir = new THREE.Vector3(0, 0, 1);
    camera.position.copy(center.clone().add(dir.multiplyScalar(distance)));
    camera.near = Math.max(0.1, distance / 1000);
    camera.far = distance * 1000;
    camera.updateProjectionMatrix();
    if (controls) {
      controls.target.copy(center);
      controls.maxDistance = distance * 10;
      controls.update();
    }
  })(camera, sceneGroup, controls, 1.05);

  // bounding sphere for light placement
  const sphere = box.getBoundingSphere(new THREE.Sphere());
  const radius = sphere.radius;

  // position & aim lights based on bounds (no shadows)
  const keyPos = center.clone().add(new THREE.Vector3(radius * 1.2, radius * 0.6, radius * 1.3));
  keyLight.position.copy(keyPos);
  keyLight.target.position.copy(center);
  keyLight.angle = Math.min(Math.PI * 0.35, 0.9 * Math.atan((radius*1.8) / keyPos.distanceTo(center)));
  keyLight.distance = 0;
  keyLight.intensity = BASE_KEY_INTENSITY * LIGHT_BOOST;
  keyLight.decay = 1.0;
  scene.add(keyLight.target);

  const fillPos = center.clone().add(new THREE.Vector3(-radius * 0.8, -radius * 1.1, -radius * 0.4));
  fillLight.position.copy(fillPos);
  fillLight.target.position.copy(center);
  fillLight.angle = Math.PI * 0.6;
  fillLight.distance = 0;
  fillLight.intensity = BASE_FILL_INTENSITY * LIGHT_BOOST * 1.2; // fill un poco más fuerte
  fillLight.decay = 1.0;
  scene.add(fillLight.target);

  bottomLight.position.copy(center.clone().add(new THREE.Vector3(0, -radius * 1.05, 0)));
  bottomLight.intensity = BASE_BOTTOM_INTENSITY * LIGHT_BOOST * 1.25;

  const dirPos = center.clone().add(new THREE.Vector3(0, radius * 2.0, radius * 1.2));
  dirLight.position.copy(dirPos);
  dirLight.target.position.copy(center);
  dirLight.intensity = BASE_DIR_INTENSITY * LIGHT_BOOST * 1.1;
  scene.add(dirLight.target);

  // ambient/hemi adjusted
  amb.intensity = BASE_AMBIENT_INTENSITY * LIGHT_BOOST * 1.0;
  hemi.intensity = BASE_HEMI_INTENSITY * LIGHT_BOOST * 1.0;

  // update helpers
  keyHelper.update();
  fillHelper.update();
  bottomHelper.update();

  if (loadingEl) loadingEl.style.display = 'none';

}, (xhr) => {
  if (loadingEl && xhr.total) loadingEl.textContent = 'Cargando modelo... ' + (xhr.loaded / xhr.total * 100).toFixed(0) + '%';
}, (err) => {
  console.error('Error cargando GLB', err);
  if (loadingEl) loadingEl.textContent = 'Error cargando modelo.';
});

//// helper para alternar boost (teclear 'b')
function updateLightIntensities() {
  keyLight.intensity = BASE_KEY_INTENSITY * LIGHT_BOOST;
  fillLight.intensity = BASE_FILL_INTENSITY * LIGHT_BOOST * 1.2;
  bottomLight.intensity = BASE_BOTTOM_INTENSITY * LIGHT_BOOST * 1.25;
  dirLight.intensity = BASE_DIR_INTENSITY * LIGHT_BOOST * 1.1;
  amb.intensity = BASE_AMBIENT_INTENSITY * LIGHT_BOOST;
  hemi.intensity = BASE_HEMI_INTENSITY * LIGHT_BOOST;
  keyHelper.update();
  fillHelper.update();
  bottomHelper.update();
}
window.addEventListener('keydown', (e) => {
  if (e.key === 'b' || e.key === 'B') {
    LIGHT_BOOST = LIGHT_BOOST === 1 ? 1.6 : 1;
    updateLightIntensities();
    console.log('LIGHT_BOOST ->', LIGHT_BOOST);
  }
});

//// ANIMACIÓN
let lastTS = performance.now();
let globalAngle = 0;
function animate(now) {
  const dt = now - lastTS;
  lastTS = now;

  modelGroup.rotation.y += 0.0005 * dt;

  globalAngle += GLOBAL_ROTATION_SPEED * dt;
  particleMat.uniforms.uTime.value = now;
  particleMat.uniforms.uGlobalAngle.value = globalAngle;

  const zoom = Math.sin(now * GLOBAL_ZOOM_SPEED) * GLOBAL_ZOOM_AMPLITUDE;
  particleMat.uniforms.uZoomFactor.value = zoom;
  particleMat.uniforms.uPixelRatio.value = window.devicePixelRatio || 1;

  controls.update();
  keyHelper.update();
  fillHelper.update();
  bottomHelper.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

//// RESIZE
window.addEventListener('resize', () => {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  particleMat.uniforms.uPixelRatio.value = window.devicePixelRatio || 1;
}, { passive: true });

//// AUDIO
const audio = document.getElementById('bgAudio');
const btn = document.getElementById('btnPlay');
const label = document.getElementById('audioLabel');
let isPlaying = false;
async function tryPlay() {
  try {
    await audio.play();
    isPlaying = true;
    if (btn) btn.textContent = '❚❚';
    if (label) label.textContent = 'Pausar música';
  } catch (err) {
    console.warn('Autoplay bloqueado:', err);
    if (btn) btn.textContent = '►';
    if (label) label.textContent = 'Reproducir música';
  }
}
window.addEventListener('load', tryPlay);
if (btn) btn.addEventListener('click', async () => {
  if (!audio) return;
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

//// MENSAJES-METEORITOS con estela de partículas ✨
const mensajes = [];

function crearMensaje(texto, color = "#ff9fcf") {
  // === TEXTO DINÁMICO ===
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  ctx.font = "bold 80px Arial";
  const textWidth = ctx.measureText(texto).width;
  canvas.width = textWidth + 200;
  canvas.height = 200;

  ctx.font = "bold 80px Arial";
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(texto, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 1 });
  const sprite = new THREE.Sprite(material);

  // Posición inicial y velocidad (como meteoro diagonal)
  sprite.scale.set(40, 15, 1);
  sprite.position.set(
    (Math.random() - 0.5) * 150,
    (Math.random() - 0.5) * 100,
    -200
  );
  sprite.userData.velocidad = new THREE.Vector3(
    (Math.random() - 0.5) * 0.4,
    (Math.random() - 0.5) * 0.4,
    1.5 + Math.random() * 1.2
  );
  sprite.userData.vida = 1;

  // === PARTICULAS ESTELA (estrella fugaz realista) ===
  const particleCount = 40;
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = sprite.position.x;
    positions[i * 3 + 1] = sprite.position.y;
    positions[i * 3 + 2] = sprite.position.z;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const trailMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 1.8,
    transparent: true,
    opacity: 0.8
  });

  const trail = new THREE.Points(geometry, trailMaterial);
  scene.add(trail);

  sprite.userData.trail = { geometry, positions, particleCount, points: trail };

  scene.add(sprite);
  mensajes.push(sprite);
}

function animarMensajes() {
  for (let i = mensajes.length - 1; i >= 0; i--) {
    const msg = mensajes[i];
    msg.position.add(msg.userData.velocidad);

    // Desvanecimiento del texto
    msg.userData.vida -= 0.0035;
    msg.material.opacity = Math.max(0, msg.userData.vida);

    // === Actualizar partículas de la estela ===
    const { geometry, positions, particleCount } = msg.userData.trail;
    for (let j = particleCount - 1; j > 0; j--) {
      positions[j * 3] = positions[(j - 1) * 3];
      positions[j * 3 + 1] = positions[(j - 1) * 3 + 1];
      positions[j * 3 + 2] = positions[(j - 1) * 3 + 2];
    }
    positions[0] = msg.position.x;
    positions[1] = msg.position.y;
    positions[2] = msg.position.z;

    geometry.attributes.position.needsUpdate = true;
    msg.userData.trail.points.material.opacity = msg.material.opacity * 0.8;

    // Eliminar mensaje cuando muere
    if (msg.userData.vida <= 0) {
      scene.remove(msg);
      scene.remove(msg.userData.trail.points);
      mensajes.splice(i, 1);
    }
  }
}

// Frases románticas dedicadas a ella
setInterval(() => {
  const frases = [
    "💖 Te Amo",
    "Tus besos son mi veneno dulce 🕷️",
    "Mi flaquita, mi todo 💕",
    "Siempre en mi mente, mi postrecito 🍨",
    "Mi reina hermosa 👑",
    "Tus ojos miel, mi universo infinito 👁️✨",
    "Aunque arda, contigo siempre 🔥❤️"
  ];
  const frase = frases[Math.floor(Math.random() * frases.length)];
  crearMensaje(frase, "#ff9fcf");
}, 5000);

// Integrar en el loop
const oldAnimate = animate;
animate = function(now) {
  oldAnimate(now);
  animarMensajes();
};
