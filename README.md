# Personal site — microscope intro

A static personal homepage with a full-screen **microscope-style opening sequence**: a circular “lens” over a specimen image, a Leeuwenhoek quote, a nosepiece-style rotation between two magnifications, focus “hunts,” and a final lens pull-back into the main site.

**Try it:** open the deployed site (or run locally — see below), wait for **“Adjust lens”**, then click it. Use **Skip intro** if you want the homepage without the animation. If your OS has “reduce motion” enabled, the intro short-circuits to a simple fade-out.

---

## Run it locally

Requirements: **Node 18+** (20 recommended).

```bash
npm install
npm run dev
```

Vite prints a local URL (usually `http://localhost:5173`). The intro mounts on top of the page defined in `index.html` (`.page`).

Build and preview the production bundle:

```bash
npm run build
npm run preview
```

---

## What the microscope visualization is doing

This is **not** WebGL or Canvas. It is **DOM + CSS + [GSAP](https://gsap.com/) timelines**: stacked full-screen layers, circular masks, and transforms timed like a microscope UI.

### 1. Circular lens and “specimen”

- The specimen is **`public/bacterialimage1.webp`**, referenced as a CSS variable `--microscope-lens-image` on the intro root so every layer that needs the same picture inherits one URL (`src/components/MicroscopeIntro.js`).
- The visible **pupil** is not a separate `<img>`: it is the **hole** in radial `mask-image` / `clip-path` gradients keyed off `--mx`, `--my`, and `--lens-r` (center and radius in CSS pixels). Moving the mouse before you click updates that focal point.

### 2. Two “objectives” (two panels)

Inside `.microscope-intro__lens-carousel-track` there are **two** full-screen divs (`.microscope-intro__lens-panel`):

- **Front (low mag):** `background-size: cover` — wide field.
- **Rear (high mag):** `.microscope-intro__lens-panel--zoomed` with a tighter `background-size` so the same image reads as **higher magnification**.

GSAP rotates the front panel away and brings the rear panel in, like a **nosepiece turret** swap, with blackout and rim washes for readability.

### 3. Ring vs pupil (layering)

Several elements only exist in the **annulus** (ring around the lens), not in the pupil: frosted **veil**, **rim** darkening, blurred **ring bed**, **aperture lock** blur, and a **post-carousel still blur** beat after the first rotation. Those are separate layers with the same radial mask so the center stays the sharp (or intentionally blurred) specimen while the ring feels like microscope hardware chrome + glass.

### 4. After the intro: bridge to the homepage

`src/components/SiteLensOverlay.js` mounts a short **lens-pulls-back** overlay: a small blurred circle at the click position expands and the veil / chromatic ring decay so the real homepage appears underneath.

### 5. Where to read the actual implementation

| Piece | Files |
|--------|--------|
| Intro DOM, timelines, pointer → lens center | `src/components/MicroscopeIntro.js` |
| Masks, z-index, typography, HUD | `src/components/MicroscopeIntro.css` |
| Post-intro lens reveal | `src/components/SiteLensOverlay.js`, `SiteLensOverlay.css` |
| Global page + tokens | `index.html`, `src/style.css` |
| Entry | `src/main.js` |

---

## Swap the specimen image

1. Add your image under **`public/`** (e.g. `public/my-specimen.webp`).
2. In `MicroscopeIntro.js`, change the `lensUrl` line to match your filename (keep `import.meta.env.BASE_URL` so GitHub Pages project URLs still resolve assets).

Prefer **WebP** (or AVIF) for size; very large images will still cost decode time on first paint.

---

## Deploy (GitHub Pages)

This repo includes **GitHub Actions** (`.github/workflows/deploy.yml`) that runs `npm ci`, `npm run build`, and publishes **`dist/`**.

- In the repo: **Settings → Pages → Source: GitHub Actions**.
- For a **user** site (`https://<user>.github.io/`), the default `base` `/` is correct.
- For a **project** site (`https://<user>.github.io/<repo>/`), set a repository variable **`VITE_BASE`** to `/<repo>/` (with trailing slash) and rebuild.

---

## License

All rights reserved unless you add a license file of your own.
