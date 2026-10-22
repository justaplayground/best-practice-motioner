import { gsap } from "./gsap-setup.ts";

export const pointer = {
  x: typeof window !== "undefined" ? window.innerWidth / 2 : 0,
  y: typeof window !== "undefined" ? window.innerHeight / 2 : 0,
  vx: 0,
  vy: 0,
  active: false,
  coarse: typeof window !== "undefined" && matchMedia("(pointer: coarse)").matches,
};

export const scrollState = {
  y: 0,
  vy: 0,
  progress: 0,
};

let lastX = pointer.x;
let lastY = pointer.y;
let lastScroll = 0;

if (typeof window !== "undefined") {
  window.addEventListener(
    "pointermove",
    (e) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
    },
    { passive: true },
  );
  window.addEventListener(
    "pointerleave",
    () => {
      pointer.active = false;
    },
    { passive: true },
  );
  window.addEventListener(
    "scroll",
    () => {
      scrollState.y = window.scrollY;
    },
    { passive: true },
  );

  gsap.ticker.add((_t, delta) => {
    const dt = Math.max(delta / 1000, 0.001);
    pointer.vx = (pointer.x - lastX) / dt;
    pointer.vy = (pointer.y - lastY) / dt;
    lastX = pointer.x;
    lastY = pointer.y;
    scrollState.vy = (scrollState.y - lastScroll) / dt;
    lastScroll = scrollState.y;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    scrollState.progress = max > 0 ? scrollState.y / max : 0;
  });
}
