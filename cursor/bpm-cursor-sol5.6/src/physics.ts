import { useEffect, useRef } from "react";
import { gsap } from "./gsap-setup.ts";

/** Damped harmonic oscillator: m·x'' = −k(x − target) − c·x'. Sub-stepped for stability. */
export class Spring {
  x: number;
  v = 0;
  target: number;
  k: number;
  c: number;
  m: number;

  constructor(x = 0, k = 170, c = 18, m = 1) {
    this.x = x;
    this.target = x;
    this.k = k;
    this.c = c;
    this.m = m;
  }

  step(dt: number) {
    let t = dt;
    const h = 1 / 240;
    while (t > 1e-6) {
      const s = Math.min(h, t);
      const a = (-this.k * (this.x - this.target) - this.c * this.v) / this.m;
      this.v += a * s;
      this.x += this.v * s;
      t -= s;
    }
    return this.x;
  }
}

export const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

export function useTick(cb: (dt: number) => void) {
  const ref = useRef(cb);
  useEffect(() => {
    ref.current = cb;
  });
  useEffect(() => {
    const f = (_t: number, delta: number) =>
      ref.current(Math.min(delta / 1000, 0.05));
    gsap.ticker.add(f);
    return () => gsap.ticker.remove(f);
  }, []);
}
