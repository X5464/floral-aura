# 🌸 Floral Aura — Interactive Web AR Hand Tracking Experience

> Point your index finger to grow a vibrant, blooming botanical garden in real-time. Open your palm to shatter them into a glowing physics explosion of sparkles and stardust.

Created by **Rajarshi Chakraborty**

---

## ✨ Features

- **⚡ Instant AI Hand Tracking**: Powered by MediaPipe Hands (60 FPS decoupled animation loop).
- **🌺 30+ Realistic Botanical Flowers**: Realistic orchids, blush roses, white lilies, lotus blossoms, frangipani, tropical hibiscuses, cherry blossoms, and blue pansies.
- **🍃 Natural Leaves & Garden Sprites**: Interspaced with lush leafy botanical accents.
- **✨ Living Pulse Bloom & Aura Glow**: Flowers feature spring elasticity and gentle breathing pulse animations.
- **💥 Open-Palm Shatter Physics**: Opening either palm triggers an outward physics explosion with glowing sparkles.
- **💫 Golden Stardust & Drifting Petals**: Ethereal particle effects drift dynamically as flowers spawn.
- **📱 100% Responsive & Cross-Device**: Optimized for Laptops, iPads, iPhones, and Android devices.
- **🚀 Sub-Millisecond Speed**: Service Worker caching (`sw.js`) and Vercel Edge CDN configuration for instant global loading.

---

## 📁 Repository Structure

```text
hand tracker/
├── index.html            # Main application HTML structure with OpenGraph & SEO metadata
├── style.css             # Glassmorphism UI, responsive layouts & animations
├── app.js                # Core Web AR logic, gesture recognition & 60 FPS Canvas rendering
├── sw.js                 # Service Worker for offline asset caching
├── vercel.json           # Vercel deployment & Edge CDN header configuration
├── og-preview.png        # Social share card preview image (1200x630)
├── README.md             # Project documentation & deployment guide
└── flowers/              # 30 Realistic Botanical Flower PNG Sprites
    ├── pink_0.png...pink_14.png
    └── vibrant_0.png...vibrant_14.png
```

---

## 🚀 How to Deploy on GitHub & Vercel

### Step 1: Create a GitHub Repository & Push Code

1. Go to [github.com/new](https://github.com/new).
2. Name your repository: `floral-aura` (or `hand-tracker`).
3. Keep it **Public** and **do NOT** check "Initialize with a README" (we already created one!).
4. Click **Create repository**.
5. Copy the repository URL (e.g. `https://github.com/YOUR_USERNAME/floral-aura.git`).

Run the following commands in your terminal:

```bash
cd "/Users/rajarshi/Documents/hand tracker"
git remote add origin https://github.com/YOUR_USERNAME/floral-aura.git
git push -u origin main
```

---

### Step 2: Deploy to Vercel (Instant 1-Click Setup)

1. Go to [vercel.com/new](https://vercel.com/new) and log in with your GitHub account.
2. Under **Import Git Repository**, select `floral-aura`.
3. Framework Preset: **Other** (or **HTML/CSS/JS**).
4. Root Directory: `./` (Leave as default).
5. Click **Deploy**.

🎉 Your app will be live in seconds with a custom `.vercel.app` URL!

---

## 🛠️ Built With

- **HTML5 Canvas & WebGL**
- **MediaPipe Hands** by Google
- **Vanilla CSS3** (Glassmorphic Design Tokens)
- **JavaScript (ES6+)**
- **Service Workers & Cache API**

---

© Created by Rajarshi Chakraborty. All rights reserved.
