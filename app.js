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
let currentLandmarks = []; // Store latest detected hand landmarks

// DOM Elements
const landingScreen = document.getElementById('landing-screen');
const appEl = document.getElementById('app');
const videoEl = document.getElementById('video');
const canvas = document.getElementById('overlay-canvas');
const ctx = canvas.getContext('2d');
const instructionText = document.getElementById('instruction-text');
const startBtn = document.getElementById('start-btn');

let hands, camera, videoReady = false, isProcessingFrame = false;

// ===== RESPONSIVE CANVAS RESIZING =====
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
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

  let sx = lm.x * vw * displayScale + offsetX;
  let sy = lm.y * vh * displayScale + offsetY;
  sx = sw - sx; // Mirror horizontally to match CSS scaleX(-1)

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
        modelComplexity: 0,           // 0 = lite model (fastest)
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.3
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

  let anyPointing = false;
  let anyOpen = false;

  if (currentLandmarks && currentLandmarks.length > 0) {
    for (let hi = 0; hi < currentLandmarks.length; hi++) {
      const lm = currentLandmarks[hi];
      const pts = lm.map(l => lmToScreen(l, w, h));
      const colors = HAND_COLORS[hi % 2];

      drawExoskeleton(pts, colors);
      const g = detectGesture(lm);

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

function detectGesture(lm) {
  const indexRatio  = getFingerExtensionRatio(lm, 8, 5);
  const middleRatio = getFingerExtensionRatio(lm, 12, 9);
  const ringRatio   = getFingerExtensionRatio(lm, 16, 13);
  const pinkyRatio  = getFingerExtensionRatio(lm, 20, 17);
  const thumbRatio  = getFingerExtensionRatio(lm, 4, 2);

  // POINTING: Index finger is extended noticeably more than middle, ring, & pinky fingers
  // Relative ratio diff (indexRatio - otherRatios > 0.12) is 100% invariant to corner lens distortion
  const isIndexPointing = (indexRatio > 1.18) &&
                          (indexRatio - middleRatio > 0.12) &&
                          (indexRatio - ringRatio > 0.12) &&
                          (indexRatio - pinkyRatio > 0.12);

  if (isIndexPointing) {
    openHandFrameCount = 0;
    return 'pointing';
  }

  // OPEN PALM SHATTER: All 5 fingers fully extended (index, middle, ring, pinky, thumb)
  const indexExt  = indexRatio > 1.3;
  const middleExt = middleRatio > 1.3;
  const ringExt   = ringRatio > 1.3;
  const pinkyExt  = pinkyRatio > 1.3;
  const thumbExt  = thumbRatio > 1.2;

  let isCutOffAtEdge = false;
  for (let i = 0; i < lm.length; i++) {
    if (lm[i].x < 0.02 || lm[i].x > 0.98 || lm[i].y < 0.02 || lm[i].y > 0.98) {
      isCutOffAtEdge = true;
      break;
    }
  }

  if (!isCutOffAtEdge && indexExt && middleExt && ringExt && pinkyExt && thumbExt) {
    openHandFrameCount++;
    if (openHandFrameCount >= 3) {
      return 'open';
    }
  } else {
    openHandFrameCount = 0;
  }

  return 'neutral';
}

function getFingerExtensionRatio(lm, tipIdx, mcpIdx) {
  const wrist = lm[0];
  const tip   = lm[tipIdx];
  const mcp   = lm[mcpIdx];

  const distWristTip = Math.hypot(tip.x - wrist.x, tip.y - wrist.y, tip.z - wrist.z);
  const distWristMcp = Math.hypot(mcp.x - wrist.x, mcp.y - wrist.y, mcp.z - wrist.z);

  return distWristMcp > 0 ? distWristTip / distWristMcp : 0;
}

// ===== EXOSKELETON DRAWING =====
function drawExoskeleton(pts, c) {
  for (const [a, b] of HAND_CONNECTIONS) {
    ctx.beginPath();
    ctx.moveTo(pts[a].x, pts[a].y);
    ctx.lineTo(pts[b].x, pts[b].y);
    ctx.strokeStyle = c.line;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  for (let i = 0; i < pts.length; i++) {
    const { x, y } = pts[i];
    if (i === INDEX_TIP) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, 16);
      g.addColorStop(0, c.glow);
      g.addColorStop(0.5, c.mid);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, 16, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
    } else if (i === WRIST) {
      ctx.fillStyle = c.wrist;
      ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
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
    const angle = baseAngle + (Math.random() - 0.5) * 1.2;
    const force = 10 + Math.random() * 18;

    f.vx = Math.cos(angle) * force;
    f.vy = Math.sin(angle) * force - 5;
    f.rotSpeed = (Math.random() - 0.5) * 25;

    for (let i = 0; i < 2; i++) {
      sparkles.push({
        x: f.x, y: f.y,
        vx: Math.cos(angle + (Math.random() - 0.5)) * (4 + Math.random() * 8),
        vy: Math.sin(angle + (Math.random() - 0.5)) * (4 + Math.random() * 8) - 3,
        size: 1.5 + Math.random() * 3,
        color: `hsl(${Math.random() * 60 + 300}, 80%, 75%)`,
        life: 1,
        decay: 0.02 + Math.random() * 0.02
      });
    }
  }

  setTimeout(() => { isScattering = false; }, 2000);
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
      f.vx *= 0.97;
      f.vy += 0.25;
      f.vy *= 0.99;
      f.x += f.vx;
      f.y += f.vy;
      f.rotation += f.rotSpeed;
      f.opacity -= 0.006;
      f.scale *= 0.998;

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
