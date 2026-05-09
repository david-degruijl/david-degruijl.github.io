import gsap from "gsap";
import "./MicroscopeIntro.css";
import { mountSiteLensReveal } from "./SiteLensOverlay.js";

const INTRO_QUOTE =
  "In 1674, Antonie van Leeuwenhoek adjusted his lens and saw the invisible.";

/** Last index of each line before a break (line 3 begins with “the invisible.”). */
const TYPE_BRK_LINE1_END = 32;
const TYPE_BRK_LINE2_END = 58;

const INVISIBLE_START = INTRO_QUOTE.indexOf("invisible");

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** HUD field width (meters): low magnification (large field) → high mag (small field), p ∈ [0, 1]. */
const HUD_FIELD_START_M = 500e-6;
const HUD_FIELD_END_M = 40e-6;

function lengthMetersFromHudP(p) {
  const t = Math.min(1, Math.max(0, p));
  return HUD_FIELD_START_M * Math.pow(HUD_FIELD_END_M / HUD_FIELD_START_M, t);
}

/** Field width readout — always micrometres (microscope HUD range). */
function formatHudLengthMeters(L) {
  const um = L * 1e6;
  if (!Number.isFinite(um) || um <= 0) return "—";
  if (um >= 50) return `${um.toFixed(0)} μm`;
  return `${um.toFixed(1)} μm`;
}

function formatTypedHtml(charCount) {
  if (charCount <= 0) return "";
  const end1 = Math.min(charCount, TYPE_BRK_LINE1_END + 1);
  let out = escapeHtml(INTRO_QUOTE.slice(0, end1));
  if (charCount <= TYPE_BRK_LINE1_END + 1) return out;
  out += '<br class="microscope-intro__brk" aria-hidden="true" />';
  const end2 = Math.min(charCount, TYPE_BRK_LINE2_END + 1);
  out += escapeHtml(INTRO_QUOTE.slice(TYPE_BRK_LINE1_END + 1, end2));
  if (charCount <= TYPE_BRK_LINE2_END + 1) return out;
  out += '<br class="microscope-intro__brk" aria-hidden="true" />';
  out += escapeHtml(INTRO_QUOTE.slice(TYPE_BRK_LINE2_END + 1, charCount));
  return out;
}

/**
 * Full-screen “microscope lens” intro. Dismiss with Adjust or Skip; removes itself from the DOM.
 */
export function mountMicroscopeIntro() {
  const page = document.querySelector(".page");
  if (!page) return;

  const root = document.createElement("div");
  root.id = "intro-overlay";
  root.className = "microscope-intro";
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-modal", "true");
  root.setAttribute("aria-labelledby", "microscope-intro-title-sr");

  root.innerHTML = `
    <div class="microscope-intro__shake">
    <div class="microscope-intro__stage">
    <div class="microscope-intro__turret-pack">
    <div class="microscope-intro__lens-carousel" aria-hidden="true">
      <div class="microscope-intro__lens-turret-pivot">
      <div class="microscope-intro__lens-carousel-track">
        <div class="microscope-intro__lens-panel" aria-hidden="true"></div>
        <div class="microscope-intro__lens-panel microscope-intro__lens-panel--zoomed" aria-hidden="true"></div>
      </div>
    <div class="microscope-intro__ring-blur-bed" aria-hidden="true"></div>
    <div class="microscope-intro__lens-aperture-lock" aria-hidden="true"></div>
    <div class="microscope-intro__veil" aria-hidden="true"></div>
    <div class="microscope-intro__rim-dark-overlay" aria-hidden="true"></div>
    <div class="microscope-intro__post-carousel-still-blur" aria-hidden="true"></div>
    <div class="microscope-intro__content-pivot">
    <div class="microscope-intro__content">
      <span id="microscope-intro-title-sr" class="microscope-intro__sr-only">${escapeHtml(INTRO_QUOTE)}</span>
      <p class="microscope-intro__quote" aria-hidden="true">
        <span class="microscope-intro__typed"></span><span class="microscope-intro__caret" aria-hidden="true"></span>
      </p>
      <button type="button" class="microscope-intro__enter">Adjust lens</button>
    </div>
    </div>
    </div>
    </div>
    </div>
    </div>
    <a href="#" class="microscope-intro__skip">Skip intro</a>
    <div class="microscope-intro__exit-blackout" aria-hidden="true"></div>
    <div class="microscope-intro__hud" aria-hidden="true">
      <div class="microscope-intro__hud-status" aria-live="polite"></div>
      <div class="microscope-intro__hud-scale-row">
        <span class="microscope-intro__hud-label-scale">Scale</span>
        <span class="microscope-intro__hud-length">500 μm</span>
      </div>
      <div class="microscope-intro__hud-scalebar" aria-hidden="true">
        <span class="microscope-intro__hud-scalebar-fill"></span>
      </div>
    </div>
    <div class="microscope-intro__ca-ring" aria-hidden="true"></div>
    </div>
  `;

  const shakeEl = root.querySelector(".microscope-intro__shake");
  const stage = root.querySelector(".microscope-intro__stage");
  const turretPack = root.querySelector(".microscope-intro__turret-pack");
  const lensCarousel = root.querySelector(".microscope-intro__lens-carousel");
  const turretPivot = root.querySelector(".microscope-intro__lens-turret-pivot");
  const lensTrack = root.querySelector(".microscope-intro__lens-carousel-track");
  const veil = root.querySelector(".microscope-intro__veil");
  const rimDarkOverlayEl = root.querySelector(".microscope-intro__rim-dark-overlay");
  const ringBlurBed = root.querySelector(".microscope-intro__ring-blur-bed");
  const apertureLock = root.querySelector(".microscope-intro__lens-aperture-lock");
  const postCarouselStillBlurEl = root.querySelector(".microscope-intro__post-carousel-still-blur");
  const contentPivot = root.querySelector(".microscope-intro__content-pivot");
  const enter = root.querySelector(".microscope-intro__enter");
  const skip = root.querySelector(".microscope-intro__skip");
  const hud = root.querySelector(".microscope-intro__hud");
  const hudLength = root.querySelector(".microscope-intro__hud-length");
  const hudBarFill = root.querySelector(".microscope-intro__hud-scalebar-fill");
  const hudStatus = root.querySelector(".microscope-intro__hud-status");
  const caRing = root.querySelector(".microscope-intro__ca-ring");
  const exitBlackoutEl = root.querySelector(".microscope-intro__exit-blackout");
  const contentEl = root.querySelector(".microscope-intro__content");
  const typedEl = root.querySelector(".microscope-intro__typed");
  const caretEl = root.querySelector(".microscope-intro__caret");
  const quoteEl = root.querySelector(".microscope-intro__quote");

  /** Veil blur value during post-lens “focus hunt” tweens. */
  const focusBlurDrive = { b: 20 };
  /** Turret “unlock” blur on the optical stack (px). */
  const turretUnlockBlur = { px: 0 };
  /** Field brightness during nosepiece sweep (turret-pack only — HUD/skip sit outside it on shake). */
  const turretBright = { v: 1 };
  /** HUD scale bar progress during turret segments. */
  const hudTurretDrive = { p: 0 };
  /** Master timeline: quote → carousel → focus → (repeat) → carousel to site → fade. */
  let exitTimeline = null;

  enter.setAttribute("aria-hidden", "true");
  enter.setAttribute("tabindex", "-1");

  /* Set the lens image as a custom property on root so every descendant layer that consumes
     var(--microscope-lens-image) inherits it (lens panels, ring-blur-bed, aperture-lock,
     post-carousel-still-blur). Per-element setters previously gated on `isConnected`
     silently failed because root is not in the document until the insertBefore call below,
     so those layers painted nothing in the annulus. */
  const lensUrl = `${import.meta.env.BASE_URL}bacterialimage1.png`;
  root.style.setProperty("--microscope-lens-image", `url("${lensUrl}")`);

  document.body.insertBefore(root, page);
  if (hudBarFill) {
    hudBarFill.style.transform = "scaleX(1)";
  }

  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  page.setAttribute("aria-hidden", "true");

  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight / 2;
  let rafId = 0;
  let exiting = false;
  let typewriterTimeoutId = null;
  let typewriterStopped = false;

  function delayAfterChar(ch, index) {
    const inInvisible = INVISIBLE_START >= 0 && index >= INVISIBLE_START;
    if (inInvisible) {
      if (".!?".includes(ch)) return 560;
      return 95;
    }
    if (INVISIBLE_START > 0 && index === INVISIBLE_START - 1 && ch === " ") {
      return 320;
    }
    if (".!?".includes(ch)) return 420;
    if (",;:".includes(ch)) return 240;
    if (ch === " ") return 38;
    return 30;
  }

  function revealAdjustButton() {
    enter.removeAttribute("aria-hidden");
    enter.removeAttribute("tabindex");
    window.setTimeout(() => {
      requestAnimationFrame(() => {
        if (!enter.isConnected) return;
        enter.classList.add("microscope-intro__enter--revealed");
        requestAnimationFrame(() => {
          if (enter.isConnected) enter.focus({ preventScroll: true });
        });
      });
    }, 280);
  }

  function runTypewriter() {
    const reduced =
      typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      typedEl.innerHTML = formatTypedHtml(INTRO_QUOTE.length);
      caretEl?.classList.add("microscope-intro__caret--off");
      revealAdjustButton();
      return;
    }

    function tick(index) {
      if (exiting || typewriterStopped || !typedEl.isConnected) return;
      if (index >= INTRO_QUOTE.length) {
        typedEl.innerHTML = formatTypedHtml(INTRO_QUOTE.length);
        caretEl?.classList.add("microscope-intro__caret--off");
        revealAdjustButton();
        return;
      }
      typedEl.innerHTML = formatTypedHtml(index + 1);
      const ch = INTRO_QUOTE[index];
      const wait = index + 1 < INTRO_QUOTE.length ? delayAfterChar(ch, index) : 0;
      typewriterTimeoutId = window.setTimeout(() => tick(index + 1), wait);
    }

    typewriterTimeoutId = window.setTimeout(() => tick(0), 320);
  }

  function applyLensPosition() {
    rafId = 0;
    if (!veil.isConnected || exiting) return;
    root.style.setProperty("--mx", `${targetX}px`);
    root.style.setProperty("--my", `${targetY}px`);
  }

  function onPointer(e) {
    if (exiting) return;
    if (pointerIsOverAdjust(e.clientX, e.clientY)) return;
    targetX = e.clientX;
    targetY = e.clientY;
    if (!rafId) {
      rafId = requestAnimationFrame(applyLensPosition);
    }
  }

  function syncLensCenter() {
    targetX = window.innerWidth / 2;
    targetY = window.innerHeight / 2;
    root.style.setProperty("--mx", `${targetX}px`);
    root.style.setProperty("--my", `${targetY}px`);
  }

  syncLensCenter();
  window.addEventListener("pointermove", onPointer, { passive: true });
  window.addEventListener("resize", syncLensCenter, { passive: true });

  function onKeydown(e) {
    if (e.key === "Escape") dismissFast(e);
  }
  document.addEventListener("keydown", onKeydown);

  function teardown() {
    typewriterStopped = true;
    if (typewriterTimeoutId != null) {
      window.clearTimeout(typewriterTimeoutId);
      typewriterTimeoutId = null;
    }
    document.removeEventListener("keydown", onKeydown);
    window.removeEventListener("pointermove", onPointer);
    window.removeEventListener("resize", syncLensCenter);
    if (rafId) cancelAnimationFrame(rafId);
    document.body.style.overflow = prevOverflow;
    page.removeAttribute("aria-hidden");
    root.remove();
    // Fallback if lens was not mounted earlier (e.g. timeline interrupted); skip when reduced motion.
    if (
      typeof matchMedia !== "undefined" &&
      !matchMedia("(prefers-reduced-motion: reduce)").matches &&
      !document.getElementById("site-lens-overlay")
    ) {
      mountSiteLensReveal(page, {
        startX: targetX,
        startY: targetY,
        duration: SITE_LENS_REVEAL_DURATION,
      });
    }
  }

  let finished = false;

  function prefersReducedMotion() {
    return typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  /**
   * Focal point for the exit zoom: last specimen lens position from pointer, or viewport center (Escape).
   */
  function zoomOriginFromEvent(ev) {
    if (ev?.type === "keydown" && ev.key === "Escape") {
      return [window.innerWidth / 2, window.innerHeight / 2];
    }
    return [targetX, targetY];
  }

  /** Keep last “on-slide” origin when the user moves the cursor onto Adjust to click (don’t snap mask to the button). */
  function pointerIsOverAdjust(clientX, clientY) {
    if (!enter?.isConnected) return false;
    const r = enter.getBoundingClientRect();
    return clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom;
  }

  function finishExit() {
    if (finished) return;
    finished = true;
    exitTimeline?.kill();
    exitTimeline = null;
    gsap.killTweensOf([
      root,
      shakeEl,
      stage,
      turretPack,
      lensTrack,
      turretPivot,
      contentPivot,
      quoteEl,
      focusBlurDrive,
      turretUnlockBlur,
      turretBright,
      hudTurretDrive,
      hud,
      contentEl,
      skip,
      veil,
      caRing,
      enter,
      exitBlackoutEl,
      rimDarkOverlayEl,
      apertureLock,
      postCarouselStillBlurEl,
    ]);
    if (exitBlackoutEl?.isConnected) {
      gsap.set(exitBlackoutEl, { opacity: 0, clearProps: "opacity" });
    }
    if (rimDarkOverlayEl?.isConnected) {
      gsap.set(rimDarkOverlayEl, { opacity: 0, clearProps: "opacity" });
    }
    if (apertureLock?.isConnected) {
      gsap.set(apertureLock, { opacity: 0, clearProps: "opacity" });
      apertureLock.style.visibility = "hidden";
    }
    if (postCarouselStillBlurEl?.isConnected) {
      gsap.set(postCarouselStillBlurEl, { opacity: 0, clearProps: "opacity" });
    }
    if (veil?.isConnected) {
      veil.style.removeProperty("background");
    }
    if (stage?.isConnected) {
      stage.style.removeProperty("will-change");
    }
    if (shakeEl?.isConnected) {
      shakeEl.style.removeProperty("will-change");
    }
    if (lensCarousel?.isConnected) {
      lensCarousel.style.removeProperty("will-change");
    }
    teardown();
  }

  /** Shared prep: stop typing & lens tracking, lock focal point. Idempotent while exiting (e.g. Skip during Adjust hide). */
  function prepareExit(ev) {
    if (exiting) {
      return { ox: targetX, oy: targetY };
    }
    exiting = true;
    typewriterStopped = true;
    if (typewriterTimeoutId != null) {
      window.clearTimeout(typewriterTimeoutId);
      typewriterTimeoutId = null;
    }
    window.removeEventListener("pointermove", onPointer);
    window.removeEventListener("resize", syncLensCenter);
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
    const [ox, oy] = zoomOriginFromEvent(ev);
    targetX = ox;
    targetY = oy;
    root.style.setProperty("--mx", `${ox}px`);
    root.style.setProperty("--my", `${oy}px`);
    return { ox, oy };
  }

  /** Quote → nosepiece turret → focus → focus → turret to site → fade (no scale-into-page). Higher = slower. */
  const INTRO_EXIT_TIME_SCALE = 2;
  const TURRET_BREAK = 0.14 * INTRO_EXIT_TIME_SCALE;
  const TURRET_SWEEP_OUT = 0.3 * INTRO_EXIT_TIME_SCALE;
  const TURRET_SWEEP_IN = 0.34 * INTRO_EXIT_TIME_SCALE;
  const TURRET_LIGHT = 0.06 * INTRO_EXIT_TIME_SCALE;
  const LENS_CAROUSEL_DURATION = TURRET_BREAK + TURRET_SWEEP_OUT + TURRET_SWEEP_IN + TURRET_LIGHT;
  const LENS_CAROUSEL_2_DURATION = LENS_CAROUSEL_DURATION;
  const FOCUS_PHASE_DURATION = 0.52 * INTRO_EXIT_TIME_SCALE;
  const FIRST_FOCUS_START = LENS_CAROUSEL_DURATION;
  const SECOND_FOCUS_START = FIRST_FOCUS_START + FOCUS_PHASE_DURATION;
  const CAROUSEL2_START = SECOND_FOCUS_START + FOCUS_PHASE_DURATION;
  const SITE_FADE_OVERLAP = 0.38;
  const SITE_FADE_DURATION = 0.48 * INTRO_EXIT_TIME_SCALE;
  const SITE_LENS_REVEAL_DURATION = 0.95 * INTRO_EXIT_TIME_SCALE;
  const LENS_R0 = 125;
  /** Full-screen black: fade in mid outgoing rotation (after break), fade out when higher-mag slot is nearly seated. */
  const EXIT_BLACK_IN_AT = TURRET_BREAK + TURRET_SWEEP_OUT * 0.48;
  const EXIT_BLACK_IN_DURATION = 0.1 * INTRO_EXIT_TIME_SCALE;
  /* Earlier = more zoomed specimen visible in the pupil while black lifts (incoming still moving). */
  const EXIT_BLACK_REVEAL_AT = TURRET_BREAK + TURRET_SWEEP_OUT + TURRET_SWEEP_IN * 0.22;
  const EXIT_BLACK_OUT_DURATION = 0.28 * INTRO_EXIT_TIME_SCALE;
  /**
   * Ring darkening: `.microscope-intro__rim-dark-overlay` opacity 0→1 only (no per-frame style writes).
   * Long duration caps the whole Adjust exit timeline until other tweens catch up.
   */
  const ADJUST_RIM_WASH_DURATION = 10 * INTRO_EXIT_TIME_SCALE;
  /** Wide-field aperture plate: ease #f1f1f2 ring on (was instant tl.set). */
  const APERTURE_LOCK_FADE_IN_DURATION = 0.52 * INTRO_EXIT_TIME_SCALE;
  const APERTURE_LOCK_FADE_OUT_DURATION = 0.34 * INTRO_EXIT_TIME_SCALE;

  function resetLensPanelsToIntro() {
    const panels = root.querySelectorAll(".microscope-intro__lens-panel");
    const a = panels[0];
    const b = panels[1];
    if (!a || !b) return;
    const alreadyIntro =
      !a.classList.contains("microscope-intro__lens-panel--zoomed") &&
      !a.classList.contains("microscope-intro__lens-panel--site") &&
      !b.classList.contains("microscope-intro__lens-panel--site") &&
      b.classList.contains("microscope-intro__lens-panel--zoomed");
    if (alreadyIntro) return;
    a.classList.remove("microscope-intro__lens-panel--zoomed", "microscope-intro__lens-panel--site");
    b.classList.remove("microscope-intro__lens-panel--site");
    b.classList.add("microscope-intro__lens-panel--zoomed");
  }

  function swapPanelsForSiteHandoff() {
    const panels = root.querySelectorAll(".microscope-intro__lens-panel");
    const a = panels[0];
    const b = panels[1];
    if (!a || !b) return;
    a.classList.add("microscope-intro__lens-panel--zoomed");
    b.classList.remove("microscope-intro__lens-panel--zoomed");
    b.classList.add("microscope-intro__lens-panel--site");
  }

  /** Objective stack for turret handoff #2: site on panel A (incoming), zoomed specimen on B (outgoing). */
  function prepareSiteTurretForHandoff2() {
    const panels = root.querySelectorAll(".microscope-intro__lens-panel");
    const p0 = panels[0];
    const p1 = panels[1];
    if (!p0 || !p1) return;
    p0.classList.remove("microscope-intro__lens-panel--zoomed");
    p0.classList.add("microscope-intro__lens-panel--site");
    p1.classList.remove("microscope-intro__lens-panel--site");
    p1.classList.add("microscope-intro__lens-panel--zoomed");
  }

  /**
   * Microscope nosepiece: break (quiet) → sweep out (0→20°) + unlock blur on track during sweep → blackout mid-sweep → sweep in → light.
   * Unlock blur is deferred until rotation starts so the specimen doesn’t “flash” before the nosepiece moves.
   * opts.syncQuoteWithOut: fade the quote out so it’s gone when rotation starts (not during the quiet break).
   * opts.liftBrightnessAt: if set, ramp turret-pack brightness back up here (sync with full-screen black lift so the pupil isn’t still dim).
   */
  function appendTurretHandoff(tl, tStart, dBreak, dOut, dIn, dLight, opts) {
    const panels = root.querySelectorAll(".microscope-intro__lens-panel");
    const p0 = panels[0];
    const p1 = panels[1];
    if (!p0 || !p1) return;

    const mid = tStart + dBreak + dOut * 0.5;
    const outgoingEnd = tStart + dBreak + dOut;
    const tLight = tStart + dBreak + dOut + dIn;
    const tEnd = tLight + dLight;

    const outPanel = opts.outPanelEl || p0;
    const outTargets = [outPanel];

    if (opts.syncQuoteWithOut && quoteEl?.isConnected) {
      const dQuoteFade = Math.max(0.12, dBreak * 0.72);
      const quoteInAt = Math.max(tStart, tStart + dBreak - dQuoteFade);
      tl.to(quoteEl, { opacity: 0, duration: dQuoteFade, ease: "power2.out" }, quoteInAt);
    }

    const syncHudBar = () => {
      const pScale = hudTurretDrive.p;
      const L = lengthMetersFromHudP(pScale);
      if (hudLength) hudLength.textContent = formatHudLengthMeters(L);
      if (hudBarFill?.isConnected) {
        const w = L / HUD_FIELD_START_M;
        hudBarFill.style.transform = `scaleX(${Math.max(0, Math.min(1, w))})`;
      }
    };

    tl.set(hudTurretDrive, { p: opts.hudFrom }, tStart);

    if (opts.apertureLockEl?.isConnected) {
      tl.set(opts.apertureLockEl, { visibility: "visible", opacity: 0 }, tStart);
      tl.to(
        opts.apertureLockEl,
        {
          opacity: 1,
          duration: APERTURE_LOCK_FADE_IN_DURATION,
          ease: "power1.out",
        },
        tStart,
      );
    }

    tl.to(
      turretUnlockBlur,
      {
        px: 2.75,
        duration: dBreak,
        ease: "power2.out",
        onUpdate() {
          /* Blur the specimen track only — not turretPivot (veil + backdrop-filter live there). */
          if (lensTrack?.isConnected) {
            lensTrack.style.filter = `blur(${turretUnlockBlur.px}px)`;
          }
        },
      },
      tStart + dBreak,
    );

    tl.add(() => {
      if (hudStatus) {
        hudStatus.textContent = "Lens switching…";
        hudStatus.classList.add("microscope-intro__hud-status--on");
      }
    }, tStart + dBreak + Math.min(0.08 * INTRO_EXIT_TIME_SCALE, dOut * 0.12));

    tl.fromTo(
      outTargets,
      {
        rotation: 0,
        transformOrigin: "50% -150%",
        force3D: true,
        immediateRender: false,
      },
      {
        rotation: 20,
        duration: dOut,
        ease: "power2.in",
        transformOrigin: "50% -150%",
        force3D: true,
      },
      tStart + dBreak,
    );

    const syncTurretPackBrightness = () => {
      if (turretPack?.isConnected) {
        turretPack.style.filter = `brightness(${turretBright.v})`;
      }
    };

    tl.to(
      turretBright,
      {
        v: 0,
        duration: dOut * 0.52,
        ease: "power2.in",
        onUpdate: syncTurretPackBrightness,
      },
      tStart + dBreak + dOut * 0.2,
    );

    if (opts.liftBrightnessAt != null) {
      tl.to(
        turretBright,
        {
          v: 1,
          duration: opts.liftBrightnessDuration ?? dIn * 0.55,
          ease: "power2.out",
          onUpdate: syncTurretPackBrightness,
        },
        opts.liftBrightnessAt,
      );
    }

    tl.add(() => {
      if (typeof opts.onMidBlack === "function") opts.onMidBlack();
    }, mid);

    tl.add(() => {
      if (opts.incomingPanel === "p1") {
        if (p0?.isConnected) p0.style.zIndex = "1";
        gsap.set(p1, { zIndex: 4, transformOrigin: "50% -150%", force3D: true });
      } else {
        if (p1?.isConnected) p1.style.zIndex = "1";
        gsap.set(p0, { zIndex: 4, transformOrigin: "50% -150%", force3D: true });
      }
    }, outgoingEnd);

    const incomingEl = opts.incomingPanel === "p1" ? p1 : p0;
    /* fromTo defaults immediateRender true — keep false on fromVars so -20° is not applied until sweep-in. */
    tl.fromTo(
      incomingEl,
      {
        rotation: -20,
        transformOrigin: "50% -150%",
        force3D: true,
        immediateRender: false,
      },
      {
        rotation: 0,
        duration: dIn,
        ease: "back.out(1.55)",
        transformOrigin: "50% -150%",
        force3D: true,
      },
      outgoingEnd,
    );

    if (opts.apertureLockEl?.isConnected) {
      const span = tLight - tStart;
      const dApertureFadeOut = Math.min(
        APERTURE_LOCK_FADE_OUT_DURATION,
        Math.max(0.12 * INTRO_EXIT_TIME_SCALE, span * 0.35),
      );
      const fadeOutStart = Math.max(tStart, tLight - dApertureFadeOut);
      tl.to(
        opts.apertureLockEl,
        {
          opacity: 0,
          duration: tLight - fadeOutStart,
          ease: "power2.in",
          onComplete() {
            if (opts.apertureLockEl?.isConnected) {
              opts.apertureLockEl.style.visibility = "hidden";
            }
          },
        },
        fadeOutStart,
      );
    }

    tl.add(() => {
      turretBright.v = 1;
      if (turretPack?.isConnected) turretPack.style.removeProperty("filter");
      if (lensTrack?.isConnected) lensTrack.style.removeProperty("filter");
      turretUnlockBlur.px = 0;
      if (hudStatus) {
        hudStatus.classList.remove("microscope-intro__hud-status--on");
        hudStatus.textContent = "";
      }
    }, tLight);

    tl.to(hudTurretDrive, { p: opts.hudTo, duration: dBreak + dOut + dIn + dLight, ease: "none", onUpdate: syncHudBar }, tStart);

    tl.add(() => {
      gsap.set([p0, p1, contentPivot].filter(Boolean), {
        rotation: 0,
        transformOrigin: "50% -150%",
        clearProps: "zIndex",
        force3D: true,
      });
      if (p0?.isConnected) p0.style.zIndex = "1";
      if (p1?.isConnected) p1.style.zIndex = "2";
      if (opts.hideQuoteAfter && quoteEl?.isConnected) {
        quoteEl.style.visibility = "hidden";
      }
    }, tEnd);
  }

  function appendFocusHunt(tl, tStart) {
    const k = INTRO_EXIT_TIME_SCALE;
    const dShake = 0.035 * k;
    const dBright = 0.055 * k;
    const dBlur1 = 0.13 * k;
    const dBlur2 = 0.24 * k;
    const dBlur3 = 0.15 * k;
    tl.to(
      shakeEl,
      {
        keyframes: [
          { x: 2.4, y: -1.8, duration: dShake },
          { x: -2.8, y: 2.2, duration: dShake },
          { x: 2.2, y: 1.4, duration: dShake },
          { x: -1.6, y: -2, duration: dShake },
          { x: 1.2, y: 0.8, duration: dShake },
          { x: -0.8, y: -1, duration: dShake },
          { x: 0, y: 0, duration: dShake },
        ],
        ease: "none",
      },
      tStart,
    );
    tl.fromTo(
      shakeEl,
      { filter: "brightness(1)" },
      {
        filter: "brightness(1.1)",
        duration: dBright,
        ease: "power2.out",
        yoyo: true,
        repeat: 2,
      },
      tStart,
    );
    const syncVeilBlur = () => {
      if (veil?.isConnected) veil.style.setProperty("--veil-blur", String(focusBlurDrive.b));
    };
    tl.fromTo(
      focusBlurDrive,
      { b: 20 },
      {
        b: 29,
        duration: dBlur1,
        ease: "power1.out",
        onUpdate: syncVeilBlur,
      },
      tStart,
    );
    tl.to(
      focusBlurDrive,
      {
        b: 13,
        duration: dBlur2,
        ease: "power2.inOut",
        onUpdate: syncVeilBlur,
      },
      tStart + dBlur1,
    );
    tl.to(
      focusBlurDrive,
      {
        b: 20,
        duration: dBlur3,
        ease: "power2.out",
        onUpdate: syncVeilBlur,
      },
      tStart + dBlur1 + dBlur2,
    );
  }

  function cleanupZoomState() {
    root.classList.remove("microscope-intro--zooming");
    root.classList.remove("microscope-intro--turret-field");
    root.classList.remove("microscope-intro--breakthrough");
    root.style.removeProperty("--lens-r");
    root.style.removeProperty("--lens-ca-intensity");
    root.style.removeProperty("--lens-ca-split");
    root.style.removeProperty("--ca-strength");
    veil.style.removeProperty("--veil-blur");
    if (hudBarFill) hudBarFill.style.removeProperty("transform");
    if (shakeEl?.isConnected) gsap.set(shakeEl, { x: 0, y: 0, clearProps: "filter" });
    if (turretPack?.isConnected) turretPack.style.removeProperty("filter");
    if (lensTrack?.isConnected) {
      lensTrack.style.removeProperty("will-change");
      lensTrack.style.removeProperty("filter");
      gsap.set(lensTrack, { xPercent: 0, clearProps: "transform" });
    }
    if (turretPivot?.isConnected) {
      turretPivot.style.removeProperty("will-change");
      turretPivot.style.removeProperty("filter");
    }
    if (apertureLock?.isConnected) {
      apertureLock.style.opacity = "0";
      apertureLock.style.visibility = "hidden";
    }
    if (lensCarousel?.isConnected) lensCarousel.style.removeProperty("will-change");
    root.querySelectorAll(".microscope-intro__lens-panel").forEach((el) => {
      gsap.set(el, { clearProps: "transform" });
      el.style.removeProperty("z-index");
    });
    if (contentPivot?.isConnected) {
      gsap.set(contentPivot, { clearProps: "transform" });
      contentPivot.style.removeProperty("visibility");
    }
    if (hudStatus) {
      hudStatus.classList.remove("microscope-intro__hud-status--on");
      hudStatus.textContent = "";
    }
    turretUnlockBlur.px = 0;
    turretBright.v = 1;
    hudTurretDrive.p = 0;
    focusBlurDrive.b = 20;
    if (veil?.isConnected) {
      veil.style.setProperty("--veil-blur", "20");
      veil.style.removeProperty("background");
    }
    if (rimDarkOverlayEl?.isConnected) {
      gsap.set(rimDarkOverlayEl, { opacity: 0, clearProps: "opacity" });
    }
    if (postCarouselStillBlurEl?.isConnected) {
      gsap.killTweensOf(postCarouselStillBlurEl);
      gsap.set(postCarouselStillBlurEl, { opacity: 0, clearProps: "opacity" });
    }
    if (exitBlackoutEl?.isConnected) {
      gsap.killTweensOf(exitBlackoutEl);
      gsap.set(exitBlackoutEl, { opacity: 0, clearProps: "opacity" });
    }
    resetLensPanelsToIntro();
  }

  /**
   * Quote out → specimen carousel → focus hunt → second focus → site carousel → overlay fade.
   */
  function runExitPhysics(ev) {
    if (!exiting) {
      const prep = prepareExit(ev);
      if (!prep) return;
    }
    const ox = targetX;
    const oy = targetY;

    if (prefersReducedMotion()) {
      gsap.killTweensOf([
        root,
        shakeEl,
        stage,
        turretPack,
        lensTrack,
        turretPivot,
        contentPivot,
        quoteEl,
        focusBlurDrive,
        turretUnlockBlur,
        turretBright,
        hudTurretDrive,
        hud,
        contentEl,
        skip,
        veil,
        caRing,
        exitBlackoutEl,
        rimDarkOverlayEl,
        apertureLock,
        postCarouselStillBlurEl,
      ]);
      if (exitBlackoutEl?.isConnected) {
        gsap.set(exitBlackoutEl, { opacity: 0, clearProps: "opacity" });
      }
      if (rimDarkOverlayEl?.isConnected) {
        gsap.set(rimDarkOverlayEl, { opacity: 0, clearProps: "opacity" });
      }
      if (postCarouselStillBlurEl?.isConnected) {
        gsap.set(postCarouselStillBlurEl, { opacity: 0, clearProps: "opacity" });
      }
      if (veil?.isConnected) {
        veil.style.removeProperty("background");
      }
      if (turretPack?.isConnected) turretPack.style.removeProperty("filter");
      if (lensTrack?.isConnected) lensTrack.style.removeProperty("filter");
      if (apertureLock?.isConnected) {
        gsap.killTweensOf(apertureLock);
        gsap.set(apertureLock, { opacity: 0, clearProps: "opacity" });
        apertureLock.style.visibility = "hidden";
      }
      if (hudLength) hudLength.textContent = formatHudLengthMeters(HUD_FIELD_START_M);
      gsap.to(root, {
        opacity: 0,
        duration: 0.4 * INTRO_EXIT_TIME_SCALE,
        ease: "power2.inOut",
        onComplete: finishExit,
      });
      return;
    }

    exitTimeline?.kill();
    gsap.killTweensOf([
      root,
      shakeEl,
      stage,
      turretPack,
      lensTrack,
      turretPivot,
      contentPivot,
      quoteEl,
      focusBlurDrive,
      turretUnlockBlur,
      turretBright,
      hudTurretDrive,
      hud,
      contentEl,
      skip,
      veil,
      caRing,
      exitBlackoutEl,
      rimDarkOverlayEl,
      apertureLock,
      postCarouselStillBlurEl,
    ]);

    focusBlurDrive.b = 20;
    turretUnlockBlur.px = 0;
    turretBright.v = 1;
    hudTurretDrive.p = 0;
    resetLensPanelsToIntro();
    if (turretPack?.isConnected) turretPack.style.removeProperty("filter");
    if (lensTrack?.isConnected) lensTrack.style.removeProperty("filter");
    if (apertureLock?.isConnected) {
      apertureLock.style.opacity = "0";
      apertureLock.style.visibility = "hidden";
    }
    gsap.set(shakeEl, { x: 0, y: 0 });
    gsap.set(lensTrack, { xPercent: 0, force3D: true });
    const panelsInit = root.querySelectorAll(".microscope-intro__lens-panel");
    const panel0 = panelsInit[0];
    const panel1 = panelsInit[1];
    if (panel0 && panel1) {
      gsap.set(panel0, {
        rotation: 0,
        zIndex: 2,
        transformOrigin: "50% -150%",
        force3D: true,
      });
      /* Rear objective at 0 until incoming tween applies -20 at outgoingEnd (immediateRender: false). */
      gsap.set(panel1, {
        rotation: 0,
        zIndex: 1,
        transformOrigin: "50% -150%",
        force3D: true,
      });
    }
    if (contentPivot?.isConnected) {
      contentPivot.style.removeProperty("visibility");
      gsap.set(contentPivot, {
        rotation: 0,
        transformOrigin: "50% -150%",
        force3D: true,
      });
    }
    if (quoteEl?.isConnected) {
      quoteEl.style.removeProperty("visibility");
      gsap.set(quoteEl, { opacity: 1, y: 0 });
    }
    root.classList.add("microscope-intro--zooming");
    root.style.setProperty("--lens-r", String(LENS_R0));
    root.style.removeProperty("--ca-strength");
    root.style.setProperty("--lens-ca-intensity", "0");
    root.style.setProperty("--lens-ca-split", "0");
    /* Defer will-change / stage GPU hints until rotation: early promotion can retarget backdrop-filter
       so the frosted ring suddenly samples flat grey instead of the specimen — rim blur then has no effect. */
    gsap.set(shakeEl, { filter: "brightness(1)" });
    gsap.set(root, { opacity: 1 });
    gsap.set([hud, contentEl, skip], { opacity: 1 });
    if (hudLength) hudLength.textContent = formatHudLengthMeters(lengthMetersFromHudP(0));
    if (hudBarFill?.isConnected) hudBarFill.style.transform = "scaleX(1)";

    if (exitBlackoutEl?.isConnected) {
      gsap.set(exitBlackoutEl, { opacity: 0 });
    }

    if (veil?.isConnected) {
      gsap.set(veil, { "--veil-blur": 20 });
    }
    if (rimDarkOverlayEl?.isConnected) {
      gsap.set(rimDarkOverlayEl, { opacity: 0 });
    }
    if (postCarouselStillBlurEl?.isConnected) {
      gsap.set(postCarouselStillBlurEl, { opacity: 0 });
    }

    exitTimeline = gsap.timeline({
      onComplete: () => {
        exitTimeline = null;
        cleanupZoomState();
        finishExit();
      },
    });

    if (rimDarkOverlayEl?.isConnected) {
      // Rim wash fades in over the rotation (covers the lens swap as a "switching" cue),
      // then dissolves away as the incoming objective seats so it doesn't fight the
      // post-carousel blurred-figure beat that follows.
      exitTimeline.fromTo(
        rimDarkOverlayEl,
        { opacity: 0, immediateRender: false },
        { opacity: 1, duration: 0.8 * INTRO_EXIT_TIME_SCALE, ease: "power2.out" },
        TURRET_BREAK,
      );
      const RIM_FADE_OUT_DURATION = Math.max(
        0.32 * INTRO_EXIT_TIME_SCALE,
        LENS_CAROUSEL_DURATION - EXIT_BLACK_REVEAL_AT,
      );
      exitTimeline.to(
        rimDarkOverlayEl,
        { opacity: 0, duration: RIM_FADE_OUT_DURATION, ease: "power2.inOut" },
        EXIT_BLACK_REVEAL_AT,
      );
    }

    /* Post-carousel "blurred zoomed figure" beat: once the new objective has seated and the
       lens is standing still, fade in a full-annulus blurred copy of the zoomed specimen
       (z-index above rim-dark-overlay), hold through the two focus hunts, and ease it out
       just before the second nosepiece sweep begins. This is the explicit "blurred image
       comes back after the turret swings" the user asked for. */
    if (postCarouselStillBlurEl?.isConnected) {
      const POST_STILL_BLUR_IN_AT = LENS_CAROUSEL_DURATION;
      const POST_STILL_BLUR_IN_DURATION = 0.36 * INTRO_EXIT_TIME_SCALE;
      const POST_STILL_BLUR_OUT_DURATION = 0.3 * INTRO_EXIT_TIME_SCALE;
      const POST_STILL_BLUR_OUT_AT = Math.max(
        POST_STILL_BLUR_IN_AT + POST_STILL_BLUR_IN_DURATION,
        CAROUSEL2_START - POST_STILL_BLUR_OUT_DURATION,
      );
      exitTimeline.fromTo(
        postCarouselStillBlurEl,
        { opacity: 0, immediateRender: false },
        { opacity: 1, duration: POST_STILL_BLUR_IN_DURATION, ease: "power2.out" },
        POST_STILL_BLUR_IN_AT,
      );
      exitTimeline.to(
        postCarouselStillBlurEl,
        { opacity: 0, duration: POST_STILL_BLUR_OUT_DURATION, ease: "power2.in" },
        POST_STILL_BLUR_OUT_AT,
      );
    }

    if (exitBlackoutEl?.isConnected) {
      exitTimeline.fromTo(
        exitBlackoutEl,
        { opacity: 0 },
        { opacity: 1, duration: EXIT_BLACK_IN_DURATION, ease: "power2.in" },
        EXIT_BLACK_IN_AT,
      );
      exitTimeline.to(
        exitBlackoutEl,
        {
          opacity: 0,
          duration: EXIT_BLACK_OUT_DURATION,
          ease: "power2.out",
        },
        EXIT_BLACK_REVEAL_AT,
      );
      exitTimeline.fromTo(
        exitBlackoutEl,
        { opacity: 0 },
        {
          opacity: 1,
          duration: EXIT_BLACK_IN_DURATION,
          ease: "power2.in",
        },
        CAROUSEL2_START + EXIT_BLACK_IN_AT,
      );
      exitTimeline.to(
        exitBlackoutEl,
        {
          opacity: 0,
          duration: EXIT_BLACK_OUT_DURATION,
          ease: "power2.out",
        },
        CAROUSEL2_START + EXIT_BLACK_REVEAL_AT,
      );
    }

    exitTimeline.add(() => {
      gsap.set(stage, {
        transformOrigin: `${ox}px ${oy}px`,
        scale: 1,
      });
      shakeEl.style.willChange = "transform";
      lensCarousel.style.willChange = "transform";
      lensTrack.style.willChange = "transform";
      if (turretPivot?.isConnected) turretPivot.style.willChange = "transform";
      if (contentPivot?.isConnected) contentPivot.style.willChange = "transform";
      root.classList.add("microscope-intro--turret-field");
    }, TURRET_BREAK);

    /* Static plate above objectives: ring shows non-tilted cover (tilting plates stay underneath); pupil stays clear. */
    appendTurretHandoff(exitTimeline, 0, TURRET_BREAK, TURRET_SWEEP_OUT, TURRET_SWEEP_IN, TURRET_LIGHT, {
      syncQuoteWithOut: true,
      outPanelEl: panel0,
      incomingPanel: "p1",
      apertureLockEl: apertureLock,
      onMidBlack: () => {},
      hudFrom: 0,
      hudTo: 0.52,
      hideQuoteAfter: true,
      liftBrightnessAt: EXIT_BLACK_REVEAL_AT,
      liftBrightnessDuration: EXIT_BLACK_OUT_DURATION,
    });

    appendFocusHunt(exitTimeline, FIRST_FOCUS_START);
    appendFocusHunt(exitTimeline, SECOND_FOCUS_START);

    exitTimeline.add(() => {
      /* Stop outgoing sweep only; incoming p0 tween starts at outgoingEnd and must stay live. */
      gsap.killTweensOf(panel1);
      prepareSiteTurretForHandoff2();
      if (contentPivot?.isConnected) {
        contentPivot.style.visibility = "hidden";
      }
      gsap.set(panel0, {
        rotation: -20,
        zIndex: 1,
        transformOrigin: "50% -150%",
        force3D: true,
      });
      gsap.set(panel1, {
        rotation: 0,
        zIndex: 2,
        transformOrigin: "50% -150%",
        force3D: true,
      });
    }, CAROUSEL2_START + EXIT_BLACK_IN_AT + EXIT_BLACK_IN_DURATION);

    appendTurretHandoff(
      exitTimeline,
      CAROUSEL2_START,
      TURRET_BREAK,
      TURRET_SWEEP_OUT,
      TURRET_SWEEP_IN,
      TURRET_LIGHT,
      {
        syncQuoteWithOut: false,
        outPanelEl: panel1,
        incomingPanel: "p0",
        onMidBlack: () => {},
        hudFrom: 0.52,
        hudTo: 1,
        hideQuoteAfter: false,
      },
    );

    const fadeStart = CAROUSEL2_START + LENS_CAROUSEL_2_DURATION * SITE_FADE_OVERLAP;

    // Mount site lens under the intro (z-index) so the first frames through the fade are already frosted + orbit, not a flash of sharp content.
    exitTimeline.call(
      () => {
        if (!prefersReducedMotion()) {
          mountSiteLensReveal(page, {
            startX: targetX,
            startY: targetY,
            duration: SITE_LENS_REVEAL_DURATION,
          });
        }
      },
      null,
      fadeStart,
    );

    exitTimeline.to(
      root,
      {
        opacity: 0,
        duration: SITE_FADE_DURATION,
        ease: "power2.inOut",
      },
      fadeStart,
    );
  }

  function executeAdjustExit(ev) {
    runExitPhysics(ev);
  }

  function dismissFast(ev) {
    const prep = prepareExit(ev);
    if (!prep) return;
    const { ox, oy } = prep;

    if (prefersReducedMotion()) {
      gsap.killTweensOf([
        root,
        shakeEl,
        stage,
        turretPack,
        lensTrack,
        turretPivot,
        contentPivot,
        quoteEl,
        focusBlurDrive,
        turretUnlockBlur,
        turretBright,
        hudTurretDrive,
        hud,
        contentEl,
        skip,
        veil,
        caRing,
        exitBlackoutEl,
        rimDarkOverlayEl,
        apertureLock,
        postCarouselStillBlurEl,
      ]);
      if (exitBlackoutEl?.isConnected) {
        gsap.set(exitBlackoutEl, { opacity: 0, clearProps: "opacity" });
      }
      if (rimDarkOverlayEl?.isConnected) {
        gsap.set(rimDarkOverlayEl, { opacity: 0, clearProps: "opacity" });
      }
      if (postCarouselStillBlurEl?.isConnected) {
        gsap.set(postCarouselStillBlurEl, { opacity: 0, clearProps: "opacity" });
      }
      if (veil?.isConnected) {
        veil.style.removeProperty("background");
      }
      if (turretPack?.isConnected) turretPack.style.removeProperty("filter");
      if (lensTrack?.isConnected) lensTrack.style.removeProperty("filter");
      if (apertureLock?.isConnected) {
        gsap.killTweensOf(apertureLock);
        gsap.set(apertureLock, { opacity: 0, clearProps: "opacity" });
        apertureLock.style.visibility = "hidden";
      }
      if (hudLength) hudLength.textContent = formatHudLengthMeters(HUD_FIELD_START_M);
      gsap.to(root, {
        opacity: 0,
        duration: 0.35 * INTRO_EXIT_TIME_SCALE,
        onComplete: finishExit,
      });
      return;
    }

    exitTimeline?.kill();
    exitTimeline = null;
    gsap.killTweensOf([
      root,
      shakeEl,
      stage,
      turretPack,
      lensTrack,
      turretPivot,
      contentPivot,
      quoteEl,
      focusBlurDrive,
      turretUnlockBlur,
      turretBright,
      hudTurretDrive,
      hud,
      contentEl,
      skip,
      veil,
      caRing,
      exitBlackoutEl,
      rimDarkOverlayEl,
      apertureLock,
      postCarouselStillBlurEl,
    ]);
    if (exitBlackoutEl?.isConnected) {
      gsap.set(exitBlackoutEl, { opacity: 0, clearProps: "opacity" });
    }
    if (rimDarkOverlayEl?.isConnected) {
      gsap.set(rimDarkOverlayEl, { opacity: 0, clearProps: "opacity" });
    }
    if (postCarouselStillBlurEl?.isConnected) {
      gsap.set(postCarouselStillBlurEl, { opacity: 0, clearProps: "opacity" });
    }
    if (veil?.isConnected) {
      veil.style.removeProperty("background");
    }
    if (turretPack?.isConnected) turretPack.style.removeProperty("filter");
    if (lensTrack?.isConnected) lensTrack.style.removeProperty("filter");
    if (apertureLock?.isConnected) {
      gsap.killTweensOf(apertureLock);
      gsap.set(apertureLock, { opacity: 0, clearProps: "opacity" });
      apertureLock.style.visibility = "hidden";
    }
    gsap.set(shakeEl, { x: 0, y: 0 });
    if (lensTrack?.isConnected) gsap.set(lensTrack, { xPercent: 0, force3D: true });
    if (contentPivot?.isConnected) {
      gsap.set(contentPivot, { rotation: 0, clearProps: "transform" });
      contentPivot.style.removeProperty("visibility");
    }
    turretUnlockBlur.px = 0;
    turretBright.v = 1;
    hudTurretDrive.p = 0;
    focusBlurDrive.b = 20;
    if (veil?.isConnected) veil.style.setProperty("--veil-blur", "20");
    resetLensPanelsToIntro();
    if (!prefersReducedMotion()) {
      mountSiteLensReveal(page, {
        startX: targetX,
        startY: targetY,
        duration: SITE_LENS_REVEAL_DURATION,
      });
    }
    gsap.set(stage, {
      transformOrigin: `${ox}px ${oy}px`,
      scale: 1,
      force3D: true,
    });
    gsap.set(root, {
      opacity: 1,
    });
    if (hudLength) hudLength.textContent = formatHudLengthMeters(HUD_FIELD_START_M);
    gsap.to(root, {
      opacity: 0,
      duration: 0.34 * INTRO_EXIT_TIME_SCALE,
      ease: "power2.in",
      onComplete: finishExit,
    });
  }

  /** Hide Adjust first so the zoom never reads as “into the button”. */
  function beginEnterDismiss(ev) {
    if (exiting || enter.disabled) return;
    const prep = prepareExit(ev);
    if (!prep) return;
    enter.blur();
    enter.disabled = true;

    let proceeded = false;
    let fallbackId = null;

    function onHideEnd(e) {
      if (e.target !== enter) return;
      if (e.propertyName !== "opacity" && e.propertyName !== "transform") return;
      enter.removeEventListener("transitionend", onHideEnd);
      if (fallbackId != null) window.clearTimeout(fallbackId);
      proceed();
    }

    function proceed() {
      if (proceeded) return;
      if (!enter.isConnected) return;
      proceeded = true;
      enter.removeEventListener("transitionend", onHideEnd);
      if (fallbackId != null) window.clearTimeout(fallbackId);
      void executeAdjustExit(ev);
    }

    requestAnimationFrame(() => {
      enter.classList.add("microscope-intro__enter--hide");
      enter.addEventListener("transitionend", onHideEnd);
      fallbackId = window.setTimeout(proceed, Math.round(380 * INTRO_EXIT_TIME_SCALE));
    });
  }

  enter.addEventListener("click", (e) => beginEnterDismiss(e));
  skip.addEventListener("click", (e) => {
    e.preventDefault();
    dismissFast(e);
  });

  runTypewriter();
}
