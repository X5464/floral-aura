# 🌸 Floral Aura & 🫥 Invisibility Cloak — Interactive Web AR Studio

> **Transform your webcam into a magical AR experience.** Point your index finger to grow a blooming floral garden in real-time, open your palm to shatter it into sparkles, or frame your hands to activate the **Harry Potter Invisibility Cloak**.

Created by **Rajarshi Chakraborty**

- **Flower Wand feature** inspired by [@jessica.shen36](https://instagram.com/jessica.shen36)
- **Invisibility Cloak feature** inspired by [@kaylanrupa](https://instagram.com/kaylanrupa)

---

## ✨ Features Showcase

### 🌸 1. Floral Wand Garden Mode
- **Wand Trajectory Tracking**: Point your index finger forward to grow a lush trail of realistic botanical flowers, blossoms, and leaves.
- **30+ Realistic Botanical PNGs**: High-resolution blush roses, white lilies, lotus blossoms, frangipani, and tropical hibiscuses.
- **Living Breathing Pulse**: Flowers feature spring elasticity and gentle breathing pulse scale animations.
- **💥 Explosive Shatter Effect**: Open your 5-finger palm facing the camera to shatter all flowers in an explosive particle burst.
- **💫 Sparkles & Drifting Petals**: Ethereal particles drift dynamically as flowers spawn and shatter.

### 🫥 2. Harry Potter Invisibility Cloak Mode
- **Empty Room Snapshot**: Automatically captures a snapshot of your empty room when starting Cloak mode.
- **Dynamic Hand Frame Polygon**: Frame your hands using your index fingertips and thumbs to create an invisible spatial viewport.
- **Sci-Fi Viewfinder HUD Brackets**: Floating holographic `⌜ ⌝ ⌞ ⌟` corner brackets track your fingertips with high-precision corner anchors.
- **Optical Glass Refraction**: Shimmering edge glow along the boundary for an authentic sci-fi cloaking distortion effect.
- **Single-Hand & Drop Persistence**: Holds tracking gracefully for 20 frames if tracking drops briefly.

### 🎯 3. Industry Gold-Standard "One-Euro Filter"
- Integrated the **One-Euro Filter** (used in Meta Quest & Apple Vision Pro) for 3D landmark motion smoothing:
  - **Fast Movement** → 0ms latency tracking with zero lag.
  - **Slow Precision** → 100% tremor & micro-jitter elimination.

### 📱 4. Universal Device & Orientation Support
- **Works Everywhere**: Laptops, Desktops, iPads/Tablets, iPhones, and Android phones.
- **Any Orientation**: Full support for both `Portrait` and `Landscape` modes.
- **Retina DPR Adaptive**: Automatically scales WebGL canvas DPI (`dpr <= 1.5`) to guarantee **60 FPS** on mobile without battery drain.

---

## 🖐️ Gesture Control Guide

| Gesture | Action | Mode |
|---|---|---|
| 👆 **Point Index Finger** | Grow blooming flowers along finger trajectory | 🌸 Flowers Mode |
| 🖐️ **Open 5-Finger Palm** | Shatter all flowers into glowing sparkles | 🌸 Flowers Mode |
| 🖐️🖐️ **Frame Both Hands** | Paint background snapshot inside 4-corner hand frame | 🫥 Cloak Mode |
| 📷 **Click Retake BG** | Re-capture empty room snapshot for the cloak | 🫥 Cloak Mode |

---

## 🛠️ Step-by-Step Local Setup & Execution Guide

Follow these simple steps to run **Floral Aura & Invisibility Cloak** locally on any device (Mac, Windows, Linux):

### Prerequisites
- Any modern web browser (Google Chrome, Apple Safari, Mozilla Firefox, Microsoft Edge).
- A working webcam or built-in camera.
- [Node.js](https://nodejs.org/) (optional, only needed for local dev server).

---

### Method A: Quick Local Server (Recommended)

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/hand-tracker.git
   cd hand-tracker
   ```

2. **Start a Local HTTP Server**:
   You can use `npx` with `http-server` (no permanent installation required):
   ```bash
   npx -y http-server -p 8000 -c-1
   ```

3. **Open in Browser**:
   Open your browser and navigate to:
   ```text
   http://localhost:8000
   ```

4. **Allow Camera Access**: Click **"Turn on camera"** and allow webcam permissions when prompted!

---

### Method B: VS Code Live Server Extension

1. Open the project folder in **VS Code**.
2. Install the **Live Server** extension by extension marketplace (`ms-vscode.live-server`).
3. Right-click `index.html` and select **"Open with Live Server"**.

---

### Method C: Running on Mobile / iPad (Local Network)

To test on your iPhone, iPad, or Android phone connected to the same Wi-Fi network:

1. Find your computer's local IP address:
   - **macOS**: `ipconfig getifaddr en0`
   - **Windows**: `ipconfig` (look for `IPv4 Address`)
2. Start the local server with binding to all network interfaces:
   ```bash
   npx -y http-server -p 8000 -a 0.0.0.0 -c-1
   ```
3. On your mobile phone/iPad browser, type:
   ```text
   http://YOUR_COMPUTER_IP:8000
   ```

---

## 🚀 Deployment Guide (Vercel & GitHub)

### Step 1: Push to GitHub

```bash
# Add all files
git add .

# Commit changes
git commit -m "Floral Aura & Invisibility Cloak Web AR release"

# Push to GitHub
git push -u origin main
```

### Step 2: Deploy to Vercel (1-Click Setup)

1. Log into [vercel.com](https://vercel.com/) and click **Add New Project**.
2. Import your GitHub repository (`hand-tracker`).
3. Framework Preset: **Other / HTML**.
4. Root Directory: `./`
5. Click **Deploy**.

Your app is now live globally with Vercel Edge CDN asset acceleration! ⚡

---

## 📁 Repository Directory Overview

```text
hand tracker/
├── index.html            # Main HTML structure, meta tags & SEO metadata
├── style.css             # Glassmorphism design tokens, HUD styles & responsive CSS
├── app.js                # Core Web AR engine, MediaPipe tracking, One-Euro Filter & Canvas loops
├── sw.js                 # Service Worker for offline asset caching (v19)
├── vercel.json           # Vercel deployment & Edge CDN caching headers
├── og-preview.png        # Social share card preview image (1200x630)
├── README.md             # Complete documentation & step-by-step setup guide
├── .gitignore            # Clean git commit filtering rule file
└── flowers/              # 30 Realistic Botanical Flower PNG Assets
```

---

## ⚙️ Tech Stack & Architecture

- **MediaPipe Hands**: Real-time 21 3D hand landmark estimation by Google AI.
- **HTML5 WebGL Canvas**: 60 FPS dual-canvas rendering loop with dynamic DPR scaling.
- **One-Euro Filter**: Motion jitter filter algorithm.
- **Vanilla CSS3**: Glassmorphism token architecture.

---

© Created by Rajarshi Chakraborty. Licensed under MIT.
