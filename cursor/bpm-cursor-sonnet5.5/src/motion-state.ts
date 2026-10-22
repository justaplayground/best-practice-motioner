import { gsap, ScrollTrigger } from "./gsap-setup.ts";
import type { ScrollSmoother } from "gsap/ScrollSmoother";
import { Spring, clamp } from "./physics.ts";

/** Shared pointer state: position, smoothed velocity (px/s) and button state. */
export const pointer = {
  x: -1000,
  y: -1000,
  vx: 0,
  vy: 0,
  down: false,
  active: false,
  coarse: typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches,
};

/** Shared scroll state: smoothed position, velocity (px/s), progress and a spring-driven skew in degrees. */
export const scrollState = {
  y: 0,
  v: 0,
  progress: 0,
  skew: 0,
  smoother: null as ScrollSmoother | null,
};

let lastX = -1000;
let lastY = -1000;
let lastScroll = 0;
const skewSpring = new Spring(0, 140, 15, 1);
let lastSkew = 0;

if (typeof window !== "undefined") {
  window.addEventListener(
    "pointermove",
    (e) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
      if (lastX === -1000) {
        lastX = e.clientX;
        lastY = e.clientY;
      }
    },
    { passive: true },
  );
  window.addEventListener("pointerdown", () => (pointer.down = true));
  window.addEventListener("pointerup", () => (pointer.down = false));
  window.addEventListener("pointercancel", () => (pointer.down = false));
  document.documentElement.addEventListener("pointerleave", () => (pointer.active = false));

  gsap.ticker.add((_t, delta) => {
    const dt = Math.max(delta / 1000, 1 / 240);

    // pointer velocity, low-passed
    const rvx = (pointer.x - lastX) / dt;
    const rvy = (pointer.y - lastY) / dt;
    lastX = pointer.x;
    lastY = pointer.y;
    const a = 1 - Math.exp(-dt * 18);
    pointer.vx += (rvx - pointer.vx) * a;
    pointer.vy += (rvy - pointer.vy) * a;

    // scroll velocity from the *smoothed* position, so effects follow what the eye sees
    const sm = scrollState.smoother;
    const y = sm ? sm.scrollTop() : window.scrollY;
    const rv = (y - lastScroll) / dt;
    lastScroll = y;
    scrollState.y = y;
    scrollState.v += (rv - scrollState.v) * (1 - Math.exp(-dt * 10));
    const max = ScrollTrigger.maxScroll(window) || 1;
    scrollState.progress = clamp(y / max, 0, 1);

    skewSpring.target = clamp(-scrollState.v / 260, -9, 9);
    scrollState.skew = skewSpring.step(Math.min(dt, 0.05));
    if (Math.abs(scrollState.skew - lastSkew) > 0.004) {
      lastSkew = scrollState.skew;
      document.documentElement.style.setProperty("--skew", scrollState.skew.toFixed(3));
    }
  });
}
