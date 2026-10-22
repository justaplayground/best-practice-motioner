import { useEffect, useRef } from "react";
import { pointer } from "../../motion-state.ts";
import { clamp, useTick } from "../../physics.ts";

const COLS = 15;

export default function MagnetField() {
  const cv = useRef<HTMLCanvasElement>(null);
  const st = useRef({
    w: 0,
    h: 0,
    dpr: 1,
    hx: new Float32Array(COLS * COLS),
    hy: new Float32Array(COLS * COLS),
    x: new Float32Array(COLS * COLS),
    y: new Float32Array(COLS * COLS),
    vx: new Float32Array(COLS * COLS),
    vy: new Float32Array(COLS * COLS),
  });

  useEffect(() => {
    const el = cv.current!;
    const c = st.current;
    const fit = () => {
      c.dpr = Math.min(window.devicePixelRatio || 1, 2);
      c.w = el.clientWidth;
      c.h = el.clientHeight;
      el.width = c.w * c.dpr;
      el.height = c.h * c.dpr;
      const pad = 22;
      for (let j = 0; j < COLS; j++)
        for (let i = 0; i < COLS; i++) {
          const k = j * COLS + i;
          c.hx[k] = c.x[k] = pad + ((c.w - pad * 2) * i) / (COLS - 1);
          c.hy[k] = c.y[k] = pad + ((c.h - pad * 2) * j) / (COLS - 1);
        }
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useTick((dt) => {
    const el = cv.current;
    const c = st.current;
    if (!el || !c.w) return;
    const ctx = el.getContext("2d")!;
    const r = el.getBoundingClientRect();
    const px = ((pointer.x - r.left) / r.width) * c.w;
    const py = ((pointer.y - r.top) / r.height) * c.h;
    const inside = pointer.active && px > -40 && px < c.w + 40 && py > -40 && py < c.h + 40;
    const R = c.w * 0.3;
    const pol = pointer.down ? -0.8 : 1; // holding the button flips the field into attraction
    const sub = 3;
    const h = dt / sub;
    for (let s = 0; s < sub; s++) {
      for (let k = 0; k < COLS * COLS; k++) {
        let fx = -140 * (c.x[k] - c.hx[k]);
        let fy = -140 * (c.y[k] - c.hy[k]);
        if (inside) {
          const dx = c.x[k] - px;
          const dy = c.y[k] - py;
          const d = Math.hypot(dx, dy) || 1;
          if (d < R) {
            const f = (1 - d / R) ** 2 * 26000 * pol;
            fx += (dx / d) * f;
            fy += (dy / d) * f;
          }
        }
        c.vx[k] = (c.vx[k] + fx * h) * (1 - 5.5 * h);
        c.vy[k] = (c.vy[k] + fy * h) * (1 - 5.5 * h);
        c.x[k] += c.vx[k] * h;
        c.y[k] += c.vy[k] * h;
      }
    }
    ctx.setTransform(c.dpr, 0, 0, c.dpr, 0, 0);
    ctx.clearRect(0, 0, c.w, c.h);
    for (let k = 0; k < COLS * COLS; k++) {
      const disp = Math.hypot(c.x[k] - c.hx[k], c.y[k] - c.hy[k]);
      const t = clamp(disp / 46, 0, 1);
      const sp = Math.hypot(c.vx[k], c.vy[k]);
      const rad = 2.6 + t * 4 + clamp(sp / 400, 0, 2);
      ctx.fillStyle = t > 0.06 ? `rgb(255, ${Math.round(74 + (1 - t) * 90)}, ${Math.round(28 + (1 - t) * 100)})` : "#15130f";
      ctx.beginPath();
      ctx.arc(c.x[k], c.y[k], rad, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  return <canvas ref={cv} className="demo demo--canvas" role="img" aria-label="A field of dots tethered by springs; the pointer repels them" />;
}
