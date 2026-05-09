# Personal Website — David de Gruijl

A small Vite-powered static site that opens with an interactive "microscope
intro" animation, then unveils the homepage with a brief lens-pulls-back
reveal.

## Stack

- [Vite](https://vitejs.dev/) for dev server and bundling
- [GSAP](https://gsap.com/) for the timeline-driven microscope animation
- Plain HTML/CSS/ES modules (no framework)

## Local development

```bash
npm install
npm run dev
```

The dev server opens at <http://localhost:5173>.

## Build & preview

```bash
npm run build      # writes static assets into dist/
npm run preview    # serves the built site locally
```

## Deployment

Pushed to `main` triggers `.github/workflows/deploy.yml`, which builds and
publishes to GitHub Pages. If the site is hosted as a project page
(`https://<user>.github.io/<repo>/`), set the `VITE_BASE` repo variable to
`/<repo>/` so asset URLs resolve correctly.

## Project layout

```
index.html                          Homepage shell
public/bacterialimage1.png          Microscope specimen image (loaded as the lens fill)
src/main.js                         Entry point — mounts the microscope intro
src/style.css                       Global tokens + homepage styles
src/components/MicroscopeIntro.js   Microscope intro animation (GSAP)
src/components/MicroscopeIntro.css  Styles for the microscope intro
src/components/SiteLensOverlay.js   Lens-pulls-back reveal that bridges intro → site
src/components/SiteLensOverlay.css  Styles for the bridging lens overlay
```

## Design tokens

Defined as CSS custom properties on `:root` in `src/style.css`.

| Token              | Value                                   | Usage                          |
| ------------------ | --------------------------------------- | ------------------------------ |
| `--color-cobalt`   | `#6993bc`                               | Cool secondary                 |
| `--color-carbon`   | `#103643`                               | Primary deep ink / background  |
| `--color-black`    | `#282828`                               | Soft black for shadows         |
| `--color-bismuth`  | `#92e0f4`                               | Soft accent (links / focus)    |
| `--color-tin`      | `#78808d`                               | Muted neutral                  |
| `--color-grey`     | `#f1f1f2`                               | Stage / specimen-rest neutral  |
| `--color-sodium`   | `#f7ef94`                               | Primary accent (CTA)           |
| `--color-silver`   | `#d1d9e5`                               | Lens rim / silver hardware     |
| `--color-white`    | `#ffffff`                               | Foreground / glow              |

Type:

- `--font-sans: "Switzer", system-ui, -apple-system, sans-serif`
- Quote display face: `Cormorant Garamond` (serif)
- HUD readouts: `JetBrains Mono`

Motion easing: `--ease-out: cubic-bezier(.22, 1, .36, 1)`.

## Notes

- The microscope intro respects `prefers-reduced-motion: reduce` and skips the
  bridging lens overlay when reduced motion is requested.
- The "Skip intro" link bypasses the animation and removes the intro overlay.
