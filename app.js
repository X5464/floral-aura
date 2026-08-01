// ===== CONSTANTS =====
const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],         // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8],         // Index
  [5, 9], [9, 10], [10, 11], [11, 12],    // Middle
  [9, 13], [13, 14], [14, 15], [15, 16],  // Ring
  [13, 17], [17, 18], [18, 19], [19, 20], // Pinky
  [0, 17]                                  // Palm base
];

const INDEX_TIP = 8;
const WRIST = 0;

// Camera resolution targets
const CAM_W = 640;
const CAM_H = 480;

// Curated aesthetic floral & leafy garden palette
const FLOWER_EMOJIS = [
  '🌸', '🌺', '🌻', '🌷', '🌹', '💐', '🌼', '💮', '🏵️', '🪻', '🪷', '🍃', '🌿', '☘️', '🌱',
  '🌸', '🌺', '🍃', '🌻', '🌷', '🌹', '🌿', '🌼', '🌸', '🌺'
];

// Per-hand aesthetic visual palettes
const HAND_COLORS = [
  { glow: 'rgba(196,113,245,0.85)', mid: 'rgba(255,107,157,0.35)', line: 'rgba(230,180,255,0.7)', wrist: 'rgba(249,199,79,0.65)' },
  { glow: 'rgba(100,210,255,0.85)', mid: 'rgba(80,255,200,0.35)',  line: 'rgba(180,240,255,0.7)', wrist: 'rgba(120,255,200,0.65)' }
];

// Petal emojis for drifting petals effect
const PETAL_EMOJIS = ['🌸', '🌺', '🍃', '🌸', '🌷'];

// Realistic Botanical Flower PNG Assets extracted from reference sheets
const REAL_FLOWER_FILES = [
  'flowers/pink_0.png', 'flowers/pink_1.png', 'flowers/pink_2.png', 'flowers/pink_3.png',
  'flowers/pink_4.png', 'flowers/pink_5.png', 'flowers/pink_6.png', 'flowers/pink_7.png',
  'flowers/pink_8.png', 'flowers/pink_9.png', 'flowers/pink_10.png', 'flowers/pink_11.png',
  'flowers/pink_12.png', 'flowers/pink_13.png', 'flowers/pink_14.png',
  'flowers/vibrant_0.png', 'flowers/vibrant_1.png', 'flowers/vibrant_2.png', 'flowers/vibrant_3.png',
  'flowers/vibrant_4.png', 'flowers/vibrant_5.png', 'flowers/vibrant_6.png', 'flowers/vibrant_7.png',
  'flowers/vibrant_8.png', 'flowers/vibrant_9.png', 'flowers/vibrant_10.png', 'flowers/vibrant_11.png',
  'flowers/vibrant_12.png', 'flowers/vibrant_13.png', 'flowers/vibrant_14.png'
];

// ===== PRE-RENDERED FLOWER & PETAL BITMAP CACHE =====
const FLOWER_SIZES = [22, 28, 34, 40];
const flowerBitmaps = [];
const petalBitmaps = [];

function preRenderFlowers() {
  // 1. Load Realistic Botanical PNG Flowers
  for (const src of REAL_FLOWER_FILES) {
    const img = new Image();
    img.src = src;
    for (const targetW of FLOWER_SIZES) {
      img.onload = () => {
        const aspect = img.height / img.width;
        const targetH = targetW * aspect;
        flowerBitmaps.push({
          img: img,
          displayW: targetW,
          displayH: targetH,
          halfW: targetW / 2,
          halfH: targetH / 2
        });
      };
      if (img.complete && img.naturalWidth !== 0) {
        img.onload();
      }
    }
  }

  // 2. Render Floral & Leaf Emojis
  for (const emoji of FLOWER_EMOJIS) {
    for (const sz of [18, 24, 30]) {
      const off = document.createElement('canvas');
      const padding = 6;
      off.width = sz + padding * 2;
      off.height = sz + padding * 2;
      const oc = off.getContext('2d');
      oc.font = `${sz}px serif`;
      oc.textAlign = 'center';
      oc.textBaseline = 'middle';
      oc.fillText(emoji, off.width / 2, off.height / 2);
      
      flowerBitmaps.push({
        img: off,
        displayW: off.width,
        displayH: off.height,
        halfW: off.width / 2,
        halfH: off.height / 2
      });
    }
  }

  // 3. Render Drifting Petals
  for (const emoji of PETAL_EMOJIS) {
    const sz = 16;
    const off = document.createElement('canvas');
    const padding = 4;
    off.width = sz + padding * 2;
    off.height = sz + padding * 2;
    const oc = off.getContext('2d');
    oc.font = `${sz}px serif`;
    oc.textAlign = 'center';
    oc.textBaseline = 'middle';
    oc.fillText(emoji, off.width / 2, off.height / 2);

    petalBitmaps.push({
      img: off,
      displayW: off.width,
      displayH: off.height,
      halfW: off.width / 2,
      halfH: off.height / 2
    });
  }
}

function randomFlowerBitmap() {
  return flowerBitmaps[Math.floor(Math.random() * flowerBitmaps.length)];
}

function randomPetalBitmap() {
  return petalBitmaps[Math.floor(Math.random() * petalBitmaps.length)];
}

// ===== STATE =====
let flowers = [];
let sparkles = [];
let stardust = [];
let petals = [];
let lastPetalTime = 0;
let plantCooldowns = [0, 0];
let isScattering = false;
let handWasPresent = false;
let currentLandmarks = []; // Store latest detected hand landmarks

// ===== CLOAK MODE STATE =====
let currentMode = 'flowers';        // 'flowers' or 'cloak'
let backgroundCanvas = null;         // Offscreen canvas for stored background snapshot
let backgroundCtx = null;
let hasBackground = false;           // Whether we've captured a background snapshot
let cloakHintShown = false;          // Whether the cloak hint has been shown once
const SMOOTH_FRAMES = 8;             // Frames for landmark EMA smoothing (higher = smoother, more lag)
const smoothBuffers = {};            // Per-hand, per-landmark EMA buffers
const FEATHER_BLUR = 12;             // Gaussian blur px for polygon edge feathering

// --- Tracking Persistence (prevents cloak from vanishing on brief tracking drops) ---
let lastValidPolygon = null;         // Last successfully computed 4-corner polygon
let framesSinceLastPolygon = 999;    // How many frames since we had a valid polygon
const PERSIST_FRAMES = 20;           // Hold last polygon for this many frames (~333ms at 60fps)
let cloakOpacity = 0;                // Current cloak opacity (animated)
let targetCloakOpacity = 0;          // Target opacity (1 when tracking, fades when lost)
let lastTwoHandWrists = null;        // Last known wrist positions when both hands were visible

// ======================================================================
// ONE-EURO FILTER (VR/AR Headset Motion Smoothing — Meta Quest / Apple Vision Pro)
// ======================================================================
class LowPassFilter {
  constructor(alpha = 1.0) {
    this.setAlpha(alpha);
    this.y = null;
  }
  setAlpha(alpha) {
    this.alpha = Math.max(0.0, Math.min(1.0, alpha));
  }
  filter(x) {
    if (this.y === null) {
      this.y = x;
    } else {
      this.y = this.alpha * x + (1.0 - this.alpha) * this.y;
    }
    return this.y;
  }
}

class OneEuroFilter {
  constructor(minCutoff = 1.2, beta = 0.015, dCutoff = 1.0) {
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.dCutoff = dCutoff;
    this.xFilter = new LowPassFilter();
    this.dxFilter = new LowPassFilter();
    this.lastTime = null;
  }
  alpha(cutoff, dt) {
    const tau = 1.0 / (2.0 * Math.PI * cutoff);
    return 1.0 / (1.0 + tau / dt);
  }
  filter(x, timestamp = Date.now()) {
    if (this.lastTime === null) {
      this.lastTime = timestamp;
      return this.xFilter.filter(x);
    }
    const dt = Math.max(0.001, (timestamp - this.lastTime) / 1000.0);
    this.lastTime = timestamp;

    const prevY = this.xFilter.y !== null ? this.xFilter.y : x;
    const dx = (x - prevY) / dt;
    this.dxFilter.setAlpha(this.alpha(this.dCutoff, dt));
    const edx = this.dxFilter.filter(dx);
    const cutoff = this.minCutoff + this.beta * Math.abs(edx);

    this.xFilter.setAlpha(this.alpha(cutoff, dt));
    return this.xFilter.filter(x);
  }
}

// Per-landmark One-Euro Filters
const oneEuroFilters = {};
function getOneEuroFilteredPt(key, x, y) {
  const kx = `${key}_x`;
  const ky = `${key}_y`;
  if (!oneEuroFilters[kx]) oneEuroFilters[kx] = new OneEuroFilter();
  if (!oneEuroFilters[ky]) oneEuroFilters[ky] = new OneEuroFilter();
  return {
    x: oneEuroFilters[kx].filter(x),
    y: oneEuroFilters[ky].filter(y)
  };
}



// DOM Elements
const landingScreen = document.getElementById('landing-screen');
const appEl = document.getElementById('app');
const videoEl = document.getElementById('video');
const canvas = document.getElementById('overlay-canvas');
const ctx = canvas.getContext('2d');
const instructionText = document.getElementById('instruction-text');
const startBtn = document.getElementById('start-btn');

// Cloak Mode DOM Elements
const modeSwitcherBtns = document.querySelectorAll('.mode-btn');
const retakeBtn = document.getElementById('retake-btn');
const cloakHintEl = document.getElementById('cloak-hint');

let hands, camera, videoReady = false, isProcessingFrame = false;

// ===== RESPONSIVE CANVAS RESIZING =====
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
}
window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', () => setTimeout(resizeCanvas, 200));

// ===== COORDINATE MAPPING (Dynamic video aspect ratio + object-fit: cover + mirror) =====
function lmToScreen(lm, sw, sh) {
  const vw = videoEl.videoWidth || CAM_W;
  const vh = videoEl.videoHeight || CAM_H;
  const videoAspect = vw / vh;
  const screenAspect = sw / sh;

  let displayScale, offsetX, offsetY;

  if (screenAspect > videoAspect) {
    displayScale = sw / vw;
    offsetX = 0;
    offsetY = (sh - vh * displayScale) / 2;
  } else {
    displayScale = sh / vh;
    offsetX = (sw - vw * displayScale) / 2;
    offsetY = 0;
  }

  // Mirror horizontally BEFORE applying video scale & offset to match CSS transform: scaleX(-1)
  let sx = (1 - lm.x) * vw * displayScale + offsetX;
  let sy = lm.y * vh * displayScale + offsetY;

  return { x: sx, y: sy };
}

// ===== MEDIAPIPE SETUP (Safe Lazy Initialization) =====
function ensureMediaPipe() {
  if (!hands && typeof Hands !== 'undefined') {
    try {
      hands = new Hands({
        locateFile: (file) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`
      });

      hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 0,           // 0 = Lite model (ultra-fast 60 FPS real-time responsiveness)
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.4
      });

      hands.onResults(onResults);
    } catch (e) {
      console.warn('MediaPipe setup exception:', e);
    }
  }
}

// ======================================================================
// BOOT INITIALIZATION SEQUENCE
// ======================================================================
(function boot() {
  resizeCanvas();
  preRenderFlowers();
  ensureMediaPipe();

  startBtn.textContent = 'Turn on camera';
  startBtn.disabled = false;
  startBtn.classList.add('ready');
})();

// ===== MODE SWITCHING =====
modeSwitcherBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const newMode = btn.dataset.mode;
    if (newMode === currentMode) return;
    switchMode(newMode);
  });
});

function switchMode(mode) {
  currentMode = mode;

  // Update toggle button UI
  modeSwitcherBtns.forEach(btn => {
    const isActive = btn.dataset.mode === mode;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });

  if (mode === 'cloak') {
    // Show retake button
    retakeBtn.classList.remove('hidden');

    // Show hint overlay on first switch to cloak
    if (!cloakHintShown) {
      cloakHintShown = true;
      cloakHintEl.classList.remove('hidden');
      // Auto-dismiss hint after 4 seconds
      setTimeout(() => {
        cloakHintEl.classList.add('fade-out');
        setTimeout(() => {
          cloakHintEl.classList.add('hidden');
          cloakHintEl.classList.remove('fade-out');
        }, 600);
      }, 4000);
    }

    // Auto-capture background if we don't have one yet
    if (!hasBackground && videoReady) {
      captureBackground();
    }
  } else {
    // Switch back to flowers — hide cloak UI
    retakeBtn.classList.add('hidden');
    // Dismiss cloak hint if still visible
    if (!cloakHintEl.classList.contains('hidden')) {
      cloakHintEl.classList.add('hidden');
    }
  }
}

// Retake background button
retakeBtn.addEventListener('click', () => {
  captureBackground();
  // Brief visual feedback
  retakeBtn.textContent = '✅ Captured!';
  setTimeout(() => { retakeBtn.textContent = '📷 Retake Background'; }, 1200);
});

// ===== CAMERA START =====
startBtn.addEventListener('click', () => {
  if (startBtn.disabled) return;
  startBtn.textContent = 'Starting camera...';
  startBtn.classList.remove('ready');
  startBtn.classList.add('starting');
  startBtn.disabled = true;

  landingScreen.classList.add('fade-out');
  setTimeout(() => {
    landingScreen.classList.add('hidden');
    startCamera();
  }, 300);
});

function startCamera() {
  appEl.classList.remove('hidden');
  videoEl.muted = true;
  videoEl.playsInline = true;
  videoEl.setAttribute('playsinline', '');
  videoEl.setAttribute('muted', '');
  
  ensureMediaPipe();

  if (typeof Camera !== 'undefined') {
    camera = new Camera(videoEl, {
      onFrame: async () => {
        if (!videoReady) {
          videoReady = true;
          resizeCanvas();
        }
        ensureMediaPipe();
        if (hands && !isProcessingFrame) {
          isProcessingFrame = true;
          try {
            await hands.send({ image: videoEl });
          } catch (e) {
            console.error("MediaPipe send error:", e);
          } finally {
            isProcessingFrame = false;
          }
        }
      },
      width: CAM_W,
      height: CAM_H
    });

    camera.start().then(() => {
      videoEl.play().catch(() => {});
    }).catch(() => {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } }).then((stream) => {
        videoEl.srcObject = stream;
        videoEl.play().catch(() => {});
      }).catch((err) => {
        console.error('Camera blocked:', err);
      });
    });
  } else {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } }).then((stream) => {
      videoEl.srcObject = stream;
      videoEl.play().catch(() => {});
    }).catch((err) => {
      console.error('Camera blocked:', err);
    });
  }

  // Auto-capture background snapshot after a short delay to let camera stabilize
  setTimeout(() => {
    if (!hasBackground) {
      captureBackground();
    }
  }, 1500);

  // Start continuous 60 FPS animation loop
  requestAnimationFrame(animLoop);
}

// Tab Visibility Switcher
document.addEventListener('visibilitychange', () => {
  if (!camera) return;
  if (document.hidden) {
    try { camera.stop(); } catch (e) {}
  } else {
    try { camera.start(); } catch (e) {}
  }
});

// ===== HAND TRACKING RESULTS =====
function onResults(results) {
  if (results && results.multiHandLandmarks) {
    currentLandmarks = results.multiHandLandmarks;
  } else {
    currentLandmarks = [];
  }
}

// ===== 60 FPS CONTINUOUS ANIMATION LOOP =====
function animLoop() {
  const w = canvas.width;
  const h = canvas.height;

  // Clear canvas every frame
  ctx.clearRect(0, 0, w, h);

  // ── CLOAK MODE BRANCH ──
  if (currentMode === 'cloak') {
    animLoopCloak(w, h);
    requestAnimationFrame(animLoop);
    return;
  }

  // ── FLOWER MODE (original, unchanged) ──
  let anyPointing = false;
  let anyOpen = false;

  if (currentLandmarks && currentLandmarks.length > 0) {
    for (let hi = 0; hi < currentLandmarks.length; hi++) {
      const lm = currentLandmarks[hi];
      const pts = lm.map(l => lmToScreen(l, w, h));
      const colors = HAND_COLORS[hi % 2];

      drawExoskeleton(pts, colors);
      const g = detectGesture(lm, hi);

      if (g === 'pointing') {
        plantFlower(pts[INDEX_TIP].x, pts[INDEX_TIP].y, hi);
        anyPointing = true;
      } else if (g === 'open') {
        if (!isScattering) shatterAll();
        anyOpen = true;
      }
    }

    if (anyPointing) instructionText.textContent = 'Planting flowers! 🌸';
    else if (anyOpen) instructionText.textContent = 'Shattering flowers! ✨🖐️';
    else instructionText.textContent = 'Point to plant · Open hand to shatter ✨';
  } else {
    handWasPresent = false;
    instructionText.textContent = 'Show your hands';
  }

  // Render flowers, stardust, petals & sparkles
  renderScene(w, h);

  // Request next 60 FPS frame
  requestAnimationFrame(animLoop);
}

// Track last tip position per hand for fast movement trajectory interpolation
let lastTipPos = [{ x: null, y: null }, { x: null, y: null }];

// ===== GESTURE DETECTION (3D Orientation-Invariant + Edge Protection) =====
let openHandFrameCount = 0;
let prevWristPos = [{ x: null, y: null }, { x: null, y: null }];

/**
 * Check if the PALM / FRONT pad side of the hand is facing the camera.
 * Returns false when the BACK (nail side) of the hand faces the camera.
 */
function isPalmFacingCamera(lm) {
  if (!lm || lm.length < 18 || !lm[0] || !lm[5] || !lm[17]) return true;
  try {
    // Vector 1: Wrist (0) to Index MCP (5)
    const v1x = lm[5].x - lm[0].x;
    const v1y = lm[5].y - lm[0].y;

    // Vector 2: Wrist (0) to Pinky MCP (17)
    const v2x = lm[17].x - lm[0].x;
    const v2y = lm[17].y - lm[0].y;

    // 2D Cross product Z component (indicates orientation in mirrored view)
    const nz = v1x * v2y - v1y * v2x;

    const indexRightOfPinky = lm[5].x > lm[17].x;
    return indexRightOfPinky ? (nz > 0.001) : (nz < -0.001);
  } catch (e) {
    return true; // Fail-safe default
  }
}

function detectGesture(lm, hi = 0) {
  if (!lm || lm.length < 21) return 'neutral';

  const indexRatio  = getFingerExtensionRatio(lm, 8, 5);
  const middleRatio = getFingerExtensionRatio(lm, 12, 9);
  const ringRatio   = getFingerExtensionRatio(lm, 16, 13);
  const pinkyRatio  = getFingerExtensionRatio(lm, 20, 17);
  const thumbRatio  = getFingerExtensionRatio(lm, 4, 2);

  // POINTING: Index finger extended noticeably more than middle, ring, pinky
  const isIndexPointing = (indexRatio > 1.15) &&
                          (indexRatio - middleRatio > 0.10) &&
                          (indexRatio - ringRatio > 0.10) &&
                          (indexRatio - pinkyRatio > 0.10);

  if (isIndexPointing) {
    openHandFrameCount = 0;
    return 'pointing';
  }

  // OPEN PALM SHATTER: All 5 fingers extended (index, middle, ring, pinky, thumb)
  const indexExt  = indexRatio > 1.20;
  const middleExt = middleRatio > 1.20;
  const ringExt   = ringRatio > 1.20;
  const pinkyExt  = pinkyRatio > 1.20;
  const thumbExt  = thumbRatio > 1.10;
  const notPointing = (indexRatio - middleRatio < 0.16);

  if (indexExt && middleExt && ringExt && pinkyExt && thumbExt && notPointing) {
    openHandFrameCount++;
    if (openHandFrameCount >= 3) { // ~50ms sustained 5-finger open palm
      return 'open';
    }
  } else {
    openHandFrameCount = 0;
  }

  return 'neutral';
}

function getFingerExtensionRatio(lm, tipIdx, mcpIdx) {
  if (!lm || !lm[tipIdx] || !lm[mcpIdx] || !lm[0]) return 0;
  try {
    const wrist = lm[0];
    const tip   = lm[tipIdx];
    const mcp   = lm[mcpIdx];

    const distWristTip = Math.hypot(tip.x - wrist.x, tip.y - wrist.y, tip.z - wrist.z);
    const distWristMcp = Math.hypot(mcp.x - wrist.x, mcp.y - wrist.y, mcp.z - wrist.z);

    return distWristMcp > 0 ? distWristTip / distWristMcp : 0;
  } catch (e) {
    return 0;
  }
}

// ===== EXOSKELETON DRAWING (Cybernetic Neon Hologram) =====
function drawExoskeleton(pts, c) {
  // 1. Neon Gradient Energy Bones
  for (const [a, b] of HAND_CONNECTIONS) {
    const pA = pts[a];
    const pB = pts[b];

    const boneGrad = ctx.createLinearGradient(pA.x, pA.y, pB.x, pB.y);
    boneGrad.addColorStop(0, c.line);
    boneGrad.addColorStop(0.5, c.glow);
    boneGrad.addColorStop(1, c.line);

    ctx.beginPath();
    ctx.moveTo(pA.x, pA.y);
    ctx.lineTo(pB.x, pB.y);
    ctx.strokeStyle = boneGrad;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  // 2. Cybernetic Energy Joint Nodes
  for (let i = 0; i < pts.length; i++) {
    const { x, y } = pts[i];

    if (i === INDEX_TIP) {
      // Targeting Sight & Ray
      const g = ctx.createRadialGradient(x, y, 0, x, y, 22);
      g.addColorStop(0, 'rgba(255, 255, 255, 1)');
      g.addColorStop(0.3, c.glow);
      g.addColorStop(0.7, c.mid);
      g.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, 22, 0, Math.PI * 2); ctx.fill();

      // Outer HUD Reticle Ring
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2); ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
    } else if (i === WRIST) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, 14);
      g.addColorStop(0, c.wrist);
      g.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, 14, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2); ctx.fill();
    }
  }
}

// ===== FLOWER PLANTING WITH SWEEP INTERPOLATION =====
function plantFlower(x, y, hi) {
  const now = Date.now();
  if (now - plantCooldowns[hi] < 12) return;
  plantCooldowns[hi] = now;

  const pointsToPlant = [];

  // If moving fast, interpolate intermediate coordinates along trajectory
  if (lastTipPos[hi] && lastTipPos[hi].x !== null) {
    const dist = Math.hypot(x - lastTipPos[hi].x, y - lastTipPos[hi].y);
    if (dist > 18) {
      const steps = Math.min(5, Math.floor(dist / 14));
      for (let s = 1; s <= steps; s++) {
        const ratio = s / steps;
        pointsToPlant.push({
          px: lastTipPos[hi].x + (x - lastTipPos[hi].x) * ratio,
          py: lastTipPos[hi].y + (y - lastTipPos[hi].y) * ratio
        });
      }
    } else {
      pointsToPlant.push({ px: x, py: y });
    }
  } else {
    pointsToPlant.push({ px: x, py: y });
  }

  lastTipPos[hi] = { x, y };

  for (const pt of pointsToPlant) {
    for (let n = 0; n < 2; n++) {
      const bmp = randomFlowerBitmap();
      flowers.push({
        x: pt.px + (Math.random() - 0.5) * 22,
        y: pt.py + (Math.random() - 0.5) * 22,
        bmp,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 2,
        opacity: 1,
        scale: 0.05,
        springVel: 0.15,
        targetScale: 0.75 + Math.random() * 0.3,
        vx: 0, vy: 0,
        scattered: false,
        birth: now,
        bobPhase: Math.random() * Math.PI * 2,
        bobSpd: 0.5 + Math.random() * 1.5
      });

      stardust.push({
        x: pt.px + (Math.random() - 0.5) * 16,
        y: pt.py + (Math.random() - 0.5) * 16,
        vx: (Math.random() - 0.5) * 0.8,
        vy: -0.4 - Math.random() * 0.5,
        size: 1 + Math.random() * 2,
        life: 1,
        decay: 0.015 + Math.random() * 0.02
      });
    }
  }
}

// ===== SHATTER ALL =====
function shatterAll() {
  isScattering = true;
  const cx = canvas.width / 2, cy = canvas.height / 2;

  for (const f of flowers) {
    if (f.scattered) continue;
    f.scattered = true;

    const dx = f.x - cx, dy = f.y - cy;
    const baseAngle = Math.atan2(dy, dx);
    const angle = baseAngle + (Math.random() - 0.5) * 1.4;
    const force = 18 + Math.random() * 28;

    f.vx = Math.cos(angle) * force;
    f.vy = Math.sin(angle) * force - 8;
    f.rotSpeed = (Math.random() - 0.5) * 40;

    // Burst of sparkles per flower — golden + pink hues
    for (let i = 0; i < 4; i++) {
      const sparkAngle = angle + (Math.random() - 0.5) * 1.5;
      const sparkForce = 5 + Math.random() * 12;
      sparkles.push({
        x: f.x + (Math.random() - 0.5) * 10,
        y: f.y + (Math.random() - 0.5) * 10,
        vx: Math.cos(sparkAngle) * sparkForce,
        vy: Math.sin(sparkAngle) * sparkForce - 4,
        size: 1.5 + Math.random() * 3.5,
        color: `hsl(${Math.random() < 0.5 ? (Math.random() * 50 + 30) : (Math.random() * 60 + 300)}, 85%, 72%)`,
        life: 1,
        decay: 0.025 + Math.random() * 0.025
      });
    }
  }

  setTimeout(() => { isScattering = false; }, 1200);
}

// ===== RENDER SCENE =====
function renderScene(w, h) {
  const now = Date.now();

  if (flowers.length > 5 && now - lastPetalTime > 1200) {
    lastPetalTime = now;
    const sourceFlower = flowers[Math.floor(Math.random() * flowers.length)];
    if (sourceFlower && !sourceFlower.scattered) {
      petals.push({
        x: sourceFlower.x,
        y: sourceFlower.y,
        bmp: randomPetalBitmap(),
        vx: (Math.random() - 0.5) * 0.5,
        vy: 0.6 + Math.random() * 0.8,
        swayPhase: Math.random() * Math.PI * 2,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 3,
        opacity: 0.9,
        scale: 0.7 + Math.random() * 0.3
      });
    }
  }

  // --- Stardust ---
  for (let i = stardust.length - 1; i >= 0; i--) {
    const sd = stardust[i];
    sd.x += sd.vx + Math.sin(now * 0.003 + sd.x) * 0.2;
    sd.y += sd.vy;
    sd.life -= sd.decay;
    if (sd.life <= 0) { stardust.splice(i, 1); continue; }

    ctx.globalAlpha = sd.life * 0.8;
    ctx.fillStyle = 'hsl(45, 100%, 75%)';
    ctx.beginPath();
    ctx.arc(sd.x, sd.y, sd.size, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- Drifting Petals ---
  for (let i = petals.length - 1; i >= 0; i--) {
    const pt = petals[i];
    pt.x += Math.sin(now * 0.002 + pt.swayPhase) * 1.1;
    pt.y += pt.vy;
    pt.rotation += pt.rotSpeed;
    pt.opacity -= 0.003;
    if (pt.opacity <= 0 || pt.y > h + 40) { petals.splice(i, 1); continue; }

    ctx.save();
    ctx.globalAlpha = Math.min(pt.opacity, 0.9);
    ctx.translate(pt.x, pt.y);
    ctx.rotate((pt.rotation * Math.PI) / 180);
    ctx.scale(pt.scale, pt.scale);
    ctx.drawImage(pt.bmp.img, -pt.bmp.halfW, -pt.bmp.halfH, pt.bmp.displayW, pt.bmp.displayH);
    ctx.restore();
  }

  // --- Sparkle particles ---
  for (let i = sparkles.length - 1; i >= 0; i--) {
    const s = sparkles[i];
    s.x += s.vx;
    s.y += s.vy;
    s.vy += 0.08;
    s.vx *= 0.99;
    s.life -= s.decay;
    if (s.life <= 0) { sparkles.splice(i, 1); continue; }

    ctx.globalAlpha = s.life * 0.5;
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size * 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = s.life * 0.9;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- Flowers ---
  for (let i = flowers.length - 1; i >= 0; i--) {
    const f = flowers[i];

    if (f.scattered) {
      f.vx *= 0.96;
      f.vy += 0.35;
      f.vy *= 0.98;
      f.x += f.vx;
      f.y += f.vy;
      f.rotation += f.rotSpeed;
      f.opacity -= 0.018;
      f.scale *= 0.995;

      if (f.opacity <= 0 || f.y > h + 60 || f.x < -60 || f.x > w + 60) {
        flowers.splice(i, 1);
        continue;
      }
    } else {
      f.springVel += (f.targetScale - f.scale) * 0.18;
      f.springVel *= 0.72;
      f.scale += f.springVel;
      f.rotation += f.rotSpeed * 0.1;
    }

    const bob = f.scattered ? 0 : Math.sin(now * 0.002 * f.bobSpd + f.bobPhase) * 2;
    // Living Breathing Pulse Scale Motion (expanding & contracting gently)
    const pulse = f.scattered ? 1.0 : (1.0 + Math.sin(now * 0.003 * f.bobSpd + f.bobPhase) * 0.12);

    ctx.save();
    ctx.globalAlpha = Math.min(f.opacity, 1);
    ctx.translate(f.x, f.y + bob);
    ctx.rotate((f.rotation * Math.PI) / 180);
    ctx.scale(Math.max(0.01, f.scale * pulse), Math.max(0.01, f.scale * pulse));

    if (f.scale < f.targetScale * 0.95 && !f.scattered) {
      const aura = ctx.createRadialGradient(0, 0, 0, 0, 0, f.bmp.halfW * 1.5);
      aura.addColorStop(0, 'rgba(255, 200, 255, 0.4)');
      aura.addColorStop(1, 'rgba(255, 200, 255, 0)');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(0, 0, f.bmp.halfW * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.drawImage(f.bmp.img, -f.bmp.halfW, -f.bmp.halfH, f.bmp.displayW, f.bmp.displayH);

    ctx.restore();
  }

  ctx.globalAlpha = 1;

  if (sparkles.length > 400) sparkles.splice(0, sparkles.length - 400);
  if (stardust.length > 200) stardust.splice(0, stardust.length - 200);
  if (petals.length > 100) petals.splice(0, petals.length - 100);
}

// ======================================================================
// INVISIBILITY CLOAK ENGINE — Robust Tracking System
// ======================================================================

/**
 * Capture the current video frame as the "empty room" background snapshot.
 * Stored on an offscreen canvas at the video's native resolution.
 */
function captureBackground() {
  const vw = videoEl.videoWidth;
  const vh = videoEl.videoHeight;
  if (!vw || !vh) return;

  if (!backgroundCanvas) {
    backgroundCanvas = document.createElement('canvas');
    backgroundCtx = backgroundCanvas.getContext('2d');
  }
  backgroundCanvas.width = vw;
  backgroundCanvas.height = vh;

  backgroundCtx.drawImage(videoEl, 0, 0, vw, vh);
  hasBackground = true;
}

/**
 * Adaptive EMA smoothing for landmark positions.
 * High alpha (0.45) ensures zero lag, and large movement (> 35px) snaps
 * immediately so tracking points never get stuck or frozen in place.
 */
const EMA_ALPHA = 0.45;

function smoothLandmark(key, raw) {
  if (!smoothBuffers[key]) {
    smoothBuffers[key] = { x: raw.x, y: raw.y };
    return { x: raw.x, y: raw.y };
  }

  const prev = smoothBuffers[key];
  const dist = Math.hypot(raw.x - prev.x, raw.y - prev.y);

  // If distance is large (> 35px), snap immediately without lagging/freezing
  if (dist > 35) {
    smoothBuffers[key] = { x: raw.x, y: raw.y };
    return { x: raw.x, y: raw.y };
  }

  // Smooth small movements
  const smoothed = {
    x: EMA_ALPHA * raw.x + (1 - EMA_ALPHA) * prev.x,
    y: EMA_ALPHA * raw.y + (1 - EMA_ALPHA) * prev.y
  };
  smoothBuffers[key] = smoothed;
  return { x: smoothed.x, y: smoothed.y };
}

/**
 * Given two hands' landmark arrays, determine left/right by wrist X position
 * and return the smoothed 4-corner polygon with intelligent edge expansion.
 */
function getCloakPolygon(landmarks, sw, sh) {
  if (!landmarks || landmarks.length < 2) return null;

  const wrist0 = lmToScreen(landmarks[0][0], sw, sh);
  const wrist1 = lmToScreen(landmarks[1][0], sw, sh);

  let leftIdx, rightIdx;
  if (wrist0.x < wrist1.x) {
    leftIdx = 0;
    rightIdx = 1;
  } else {
    leftIdx = 1;
    rightIdx = 0;
  }

  // Store wrist positions for single-hand fallback later
  lastTwoHandWrists = {
    left: lmToScreen(landmarks[leftIdx][0], sw, sh),
    right: lmToScreen(landmarks[rightIdx][0], sw, sh)
  };

  // Get raw corner landmarks (index tip = 8, thumb tip = 4)
  const rawLeftIndex  = lmToScreen(landmarks[leftIdx][8], sw, sh);
  const rawRightIndex = lmToScreen(landmarks[rightIdx][8], sw, sh);
  const rawRightThumb = lmToScreen(landmarks[rightIdx][4], sw, sh);
  const rawLeftThumb  = lmToScreen(landmarks[leftIdx][4], sw, sh);

  // Smooth each corner with EMA
  let p0 = smoothLandmark('left_index', rawLeftIndex);
  let p1 = smoothLandmark('right_index', rawRightIndex);
  let p2 = smoothLandmark('right_thumb', rawRightThumb);
  let p3 = smoothLandmark('left_thumb', rawLeftThumb);

  return [p0, p1, p2, p3];
}

/**
 * Single-hand fallback: When only one hand is visible, try to keep the cloak
 * alive by shifting the last valid polygon based on the visible hand's
 * movement relative to its last known wrist position.
 */
function getShiftedPolygon(landmarks, sw, sh) {
  if (!lastValidPolygon || !lastTwoHandWrists || !landmarks || landmarks.length < 1) {
    return null;
  }

  const visibleWrist = lmToScreen(landmarks[0][0], sw, sh);

  // Determine if the visible hand is closer to the last-known left or right wrist
  const distToLeft = Math.hypot(visibleWrist.x - lastTwoHandWrists.left.x,
                                visibleWrist.y - lastTwoHandWrists.left.y);
  const distToRight = Math.hypot(visibleWrist.x - lastTwoHandWrists.right.x,
                                 visibleWrist.y - lastTwoHandWrists.right.y);

  const isLeftHand = distToLeft < distToRight;
  const lastWrist = isLeftHand ? lastTwoHandWrists.left : lastTwoHandWrists.right;

  // Calculate the delta movement of the visible hand
  const dx = visibleWrist.x - lastWrist.x;
  const dy = visibleWrist.y - lastWrist.y;

  // Only shift if the movement is reasonable (< 200px), else it's likely a mistrack
  if (Math.abs(dx) > 200 || Math.abs(dy) > 200) return null;

  // Shift the entire polygon by half the delta (since only one hand moved)
  return lastValidPolygon.map(pt => ({
    x: pt.x + dx * 0.5,
    y: pt.y + dy * 0.5
  }));
}

/**
 * Draw subtle hand outlines for cloak mode (dimmer than flower mode).
 */
function drawCloakHandOutlines(pts) {
  const cloakLineColor = 'rgba(255, 255, 255, 0.15)';
  const cloakDotColor = 'rgba(255, 255, 255, 0.2)';

  for (const [a, b] of HAND_CONNECTIONS) {
    ctx.beginPath();
    ctx.moveTo(pts[a].x, pts[a].y);
    ctx.lineTo(pts[b].x, pts[b].y);
    ctx.strokeStyle = cloakLineColor;
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  for (let i = 0; i < pts.length; i++) {
    ctx.fillStyle = (i === 8 || i === 4) ? 'rgba(255,255,255,0.5)' : cloakDotColor;
    ctx.beginPath();
    ctx.arc(pts[i].x, pts[i].y, (i === 8 || i === 4) ? 4 : 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Render the cloak effect at the given polygon with the given opacity.
 * Separated from tracking logic so it can render cached/shifted polygons too.
 */
function renderCloakPolygon(polygon, w, h, opacity) {
  if (!polygon || opacity <= 0.01) return;

  const vw = videoEl.videoWidth || CAM_W;
  const vh = videoEl.videoHeight || CAM_H;
  const videoAspect = vw / vh;
  const screenAspect = w / h;

  let displayScale, offsetX, offsetY;
  if (screenAspect > videoAspect) {
    displayScale = w / vw;
    offsetX = 0;
    offsetY = (h - vh * displayScale) / 2;
  } else {
    displayScale = h / vh;
    offsetX = (w - vw * displayScale) / 2;
    offsetY = 0;
  }

  const drawW = vw * displayScale;
  const drawH = vh * displayScale;

  // 1. Clip to polygon and draw background snapshot
  ctx.save();
  ctx.globalAlpha = opacity;

  ctx.beginPath();
  ctx.moveTo(polygon[0].x, polygon[0].y);
  for (let i = 1; i < polygon.length; i++) {
    ctx.lineTo(polygon[i].x, polygon[i].y);
  }
  ctx.closePath();
  ctx.clip();

  ctx.save();
  ctx.translate(w, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(backgroundCanvas, 0, 0, vw, vh, offsetX, offsetY, drawW, drawH);
  ctx.restore();

  ctx.restore();

  // 2. Futuristic Glowing Outline
  ctx.save();
  ctx.globalAlpha = opacity * 0.85;
  ctx.beginPath();
  ctx.moveTo(polygon[0].x, polygon[0].y);
  for (let i = 1; i < polygon.length; i++) {
    ctx.lineTo(polygon[i].x, polygon[i].y);
  }
  ctx.closePath();
  ctx.strokeStyle = 'rgba(120, 220, 255, 0.4)';
  ctx.lineWidth = 2;
  ctx.shadowColor = 'rgba(100, 210, 255, 0.6)';
  ctx.shadowBlur = 16;
  ctx.stroke();
  ctx.restore();

  // 3. Sci-Fi HUD Viewfinder Corner Brackets at 4 hand anchor points
  ctx.save();
  ctx.globalAlpha = opacity;
  drawCornerBracket(polygon[0].x, polygon[0].y, -1, -1); // Top-Left
  drawCornerBracket(polygon[1].x, polygon[1].y,  1, -1); // Top-Right
  drawCornerBracket(polygon[2].x, polygon[2].y,  1,  1); // Bottom-Right
  drawCornerBracket(polygon[3].x, polygon[3].y, -1,  1); // Bottom-Left
  ctx.restore();
}

/**
 * Draw a futuristic Sci-Fi Viewfinder Corner Bracket `[ ]` at a polygon vertex.
 */
function drawCornerBracket(x, y, dirX, dirY) {
  const len = 18;
  ctx.save();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'square';
  ctx.shadowColor = 'rgba(100, 210, 255, 0.8)';
  ctx.shadowBlur = 10;

  ctx.beginPath();
  ctx.moveTo(x + dirX * len, y);
  ctx.lineTo(x, y);
  ctx.lineTo(x, y + dirY * len);
  ctx.stroke();

  // Center glowing anchor dot
  ctx.fillStyle = 'rgba(100, 210, 255, 0.9)';
  ctx.beginPath();
  ctx.arc(x, y, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * The cloak animation loop — robust tracking with persistence.
 *
 * Strategy:
 * 1. If both hands tracked → compute fresh polygon, full opacity
 * 2. If one hand tracked → shift the last polygon using visible hand's delta
 * 3. If no hands → hold the last polygon, fade opacity over PERSIST_FRAMES
 * 4. Animate cloakOpacity smoothly toward target (no snapping)
 */
function animLoopCloak(w, h) {
  if (!hasBackground) {
    instructionText.textContent = 'Capturing background... step out of frame!';
    return;
  }

  const landmarks = currentLandmarks;
  let polygon = null;

  // --- Phase 1: Try to get a polygon from current tracking data ---

  if (landmarks && landmarks.length >= 2) {
    // BEST CASE: Both hands visible → compute fresh polygon
    polygon = getCloakPolygon(landmarks, w, h);

    if (polygon) {
      lastValidPolygon = polygon;
      framesSinceLastPolygon = 0;
      targetCloakOpacity = 1;
    }
  } else if (landmarks && landmarks.length === 1 && lastValidPolygon) {
    // FALLBACK: One hand visible → shift the cached polygon
    polygon = getShiftedPolygon(landmarks, w, h);
    framesSinceLastPolygon++;
    targetCloakOpacity = framesSinceLastPolygon < PERSIST_FRAMES ? 0.85 : 0;
  } else {
    // NO HANDS: Hold the last polygon, start fading
    framesSinceLastPolygon++;
    targetCloakOpacity = framesSinceLastPolygon < PERSIST_FRAMES ? 0 : 0;
  }

  // Use cached polygon if we don't have a fresh one and we're within persistence window
  if (!polygon && lastValidPolygon && framesSinceLastPolygon < PERSIST_FRAMES) {
    polygon = lastValidPolygon;
  }

  // --- Phase 2: Smoothly animate opacity ---
  // Fast fade-in (0.15), gradual fade-out (0.06) for a natural feel
  if (targetCloakOpacity > cloakOpacity) {
    cloakOpacity += (targetCloakOpacity - cloakOpacity) * 0.15;
  } else {
    cloakOpacity += (targetCloakOpacity - cloakOpacity) * 0.06;
  }

  // Clamp
  if (cloakOpacity < 0.01) cloakOpacity = 0;
  if (cloakOpacity > 1) cloakOpacity = 1;

  // --- Phase 3: Render the cloak snapshot FIRST ---
  if (polygon && cloakOpacity > 0.01) {
    renderCloakPolygon(polygon, w, h, cloakOpacity);
  }

  // --- Phase 4: Draw vibrant hand exoskeletons ON TOP of the cloak ---
  if (landmarks && landmarks.length > 0) {
    for (let hi = 0; hi < landmarks.length; hi++) {
      const pts = landmarks[hi].map(l => lmToScreen(l, w, h));
      const colors = HAND_COLORS[hi % 2];
      drawExoskeleton(pts, colors);
    }
  }

  // --- Phase 5: Update instruction text ---
  if (landmarks && landmarks.length >= 2 && cloakOpacity > 0.5) {
    instructionText.textContent = 'Invisibility cloak active! 🫥✨';
  } else if (landmarks && landmarks.length === 1) {
    instructionText.textContent = 'Show BOTH hands to frame the cloak 🖐️🖐️';
  } else if (cloakOpacity > 0.1) {
    instructionText.textContent = 'Holding cloak... show your hands again';
  } else {
    instructionText.textContent = 'Show both hands to activate cloak 🫥';
  }
}
