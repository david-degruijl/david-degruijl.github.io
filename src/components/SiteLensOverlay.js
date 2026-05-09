import gsap from "gsap";
import "./SiteLensOverlay.css";

/**
 * Mounts a brief, "lens-pulls-back" reveal that bridges the microscope intro and
 * the homepage. A small circular blurred lens is placed over the page at the
 * caller-supplied coordinates, then expanded outward (with chromatic aberration
 * and veil blur both decaying to zero) until the underlying site is fully
 * revealed. The overlay tracks the pointer until the animation completes, then
 * cleanly removes itself.
 *
 * The element is inserted *after* the host (typically `.page`) so that it sits
 * above the page content but below any microscope intro overlay still in the
 * DOM.
 */
export function mountSiteLensReveal(host, options = {}) {
  if (!(host && host.isConnected)) return;
  if (
    typeof matchMedia !== "undefined" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return;
  }
  if (document.getElementById("site-lens-overlay")) return;

  const startX = options.startX ?? window.innerWidth / 2;
  const startY = options.startY ?? window.innerHeight / 2;

  const root = document.createElement("div");
  root.id = "site-lens-overlay";
  root.className = "site-lens";
  root.setAttribute("aria-hidden", "true");
  root.innerHTML = `
    <div class="site-lens__veil" aria-hidden="true"></div>
    <div class="site-lens__ca-ring" aria-hidden="true"></div>
  `;
  host.insertAdjacentElement("afterend", root);

  const veil = root.querySelector(".site-lens__veil");

  let mx = startX;
  let my = startY;
  let rafId = 0;

  // Force an initial layout so the very first paint already has the lens
  // positioned at the caller-supplied coordinates.
  // eslint-disable-next-line no-unused-expressions
  root.offsetHeight;

  function applyMouse() {
    rafId = 0;
    if (!root.isConnected) return;
    root.style.setProperty("--mx", `${mx}px`);
    root.style.setProperty("--my", `${my}px`);
  }

  function onPointerMove(event) {
    mx = event.clientX;
    my = event.clientY;
    if (!rafId) rafId = requestAnimationFrame(applyMouse);
  }

  applyMouse();
  window.addEventListener("pointermove", onPointerMove, { passive: true });

  // Expand to comfortably beyond the viewport diagonal so the lens fully
  // dissolves regardless of aspect ratio.
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const targetR = Math.min(3000, Math.hypot(vw, vh) * 0.62);

  const state = {
    lensR: 125,
    blurV: 20,
    caIntensity: 0.52,
    caSplit: 3.4,
  };

  function applyState() {
    root.style.setProperty("--lens-r", String(state.lensR));
    root.style.setProperty("--lens-ca-intensity", String(state.caIntensity));
    root.style.setProperty("--lens-ca-split", String(state.caSplit));
    if (veil) veil.style.setProperty("--veil-blur", String(state.blurV));
  }
  applyState();

  gsap.to(state, {
    lensR: targetR,
    blurV: 0,
    caIntensity: 0,
    caSplit: 0,
    duration: options.duration ?? 0.95,
    ease: "expo.inOut",
    onUpdate: applyState,
    onComplete: () => {
      window.removeEventListener("pointermove", onPointerMove);
      if (rafId) cancelAnimationFrame(rafId);
      if (root.isConnected) root.remove();
    },
  });
}
