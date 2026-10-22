import { useEffect, useRef } from "react";
import { gsap, useGSAP } from "../gsap-setup.ts";
import { pointer, scrollState } from "../motion-state.ts";
import { Spring, clamp, useTick } from "../physics.ts";
import { useMagnetic } from "../useMagnetic.ts";

const LETTERS = ["H", "E", "F", "T"];

type Phys = { ox: Spring; oy: Spring; rot: Spring; wght: Spring; wdth: Spring };

export default function Hero() {
  const root = useRef<HTMLElement>(null);
  const outer = useRef<(HTMLSpanElement | null)[]>([]);
  const inner = useRef<(HTMLSpanElement | null)[]>([]);
  const landed = useRef(false);
  const phys = useRef<Phys[]>(
    LETTERS.map(() => ({
      ox: new Spring(0, 130, 13),
      oy: new Spring(0, 130, 13),
      rot: new Spring(0, 110, 9),
      wght: new Spring(680, 90, 12),
      wdth: new Spring(90, 90, 12),
    })),
  );
  const cta = useMagnetic<HTMLButtonElement>(0.4, 60);

  useGSAP(
    (_ctx) => {
      const letters = outer.current.filter(Boolean) as HTMLElement[];
      let dead = false;

      document.fonts.ready.then(() => {
        if (dead) return;
        _ctx.add(() => {
          // 1 — letters fall from above and squash on landing; each has its own weight
          letters.forEach((el, i) => {
            const delay = 0.2 + i * 0.16;
            const dur = 1.9;
            gsap.set(el, { autoAlpha: 0 });
            gsap.from(el, {
              y: -(window.innerHeight * 1.15 + i * 120),
              rotation: [-14, 9, -6, 12][i],
              duration: dur,
              delay,
              ease: "heft-drop",
              onStart: () => void gsap.set(el, { autoAlpha: 1 }),
            });
            gsap.to(el, {
              scaleX: 1.1 + i * 0.012,
              scaleY: 0.66 + i * 0.03,
              transformOrigin: "50% 100%",
              duration: dur,
              delay,
              ease: "heft-drop-squash",
            });
          });
          gsap.delayedCall(2.3, () => (landed.current = true));

          // 2 — supporting copy follows through after the impact
          gsap.fromTo(
            ".hero__reveal",
            { y: 40, opacity: 0 },
            { y: 0, opacity: 1, duration: 1.4, delay: 1.1, stagger: 0.12, ease: "elastic.out(1, 0.6)" },
          );

          // 3 — scrolling peels the letters apart, each with its own inertia
          letters.forEach((el, i) => {
            gsap.to(el, {
              yPercent: [-18, -46, -12, -64][i],
              xPercent: [-24, -8, 8, 24][i],
              skewX: [-9, 7, -6, 11][i],
              ease: "none",
              scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true },
            });
          });
        });
      });

      return () => {
        dead = true;
      };
    },
    { scope: root },
  );

  // pointer field: letters swell, lean and get dragged along by the pointer
  useTick((dt) => {
    if (!landed.current) return;
    const vw = window.innerWidth;
    const R = Math.max(260, vw * 0.3);
    LETTERS.forEach((_, i) => {
      const o = outer.current[i];
      const n = inner.current[i];
      if (!o || !n) return;
      const p = phys.current[i];
      const r = o.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = cx - pointer.x;
      const dy = cy - pointer.y;
      const d = Math.hypot(dx, dy) || 1;
      const inf = pointer.active ? Math.exp(-((d / R) ** 2)) : 0;
      // repel + momentum transfer from the pointer
      p.ox.target = (dx / d) * 58 * inf;
      p.oy.target = (dy / d) * 40 * inf;
      const drag = clamp(inf * 7 * dt, 0, 1);
      p.ox.v += (pointer.vx * 0.5 - p.ox.v) * drag;
      p.oy.v += (pointer.vy * 0.5 - p.oy.v) * drag;
      p.rot.target = clamp(-dx / R, -1, 1) * 16 * inf;
      p.wght.target = 680 + 120 * inf;
      p.wdth.target = 82 + 18 * inf;
      n.style.transform = `translate3d(${p.ox.step(dt)}px,${p.oy.step(dt)}px,0) rotate(${p.rot.step(dt)}deg)`;
      n.style.fontVariationSettings = `"wght" ${clamp(p.wght.step(dt), 200, 800).toFixed(0)}, "wdth" ${clamp(p.wdth.step(dt), 75, 100).toFixed(1)}`;
    });
  });

  // click: shockwave
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      const el = root.current;
      if (!el || !landed.current) return;
      const r = el.getBoundingClientRect();
      if (e.clientY < r.top || e.clientY > r.bottom) return;
      if ((e.target as Element | null)?.closest?.("button, a")) return;
      LETTERS.forEach((_, i) => {
        const o = outer.current[i];
        if (!o) return;
        const b = o.getBoundingClientRect();
        const dx = b.left + b.width / 2 - e.clientX;
        const dy = b.top + b.height / 2 - e.clientY;
        const d = Math.hypot(dx, dy) || 1;
        const f = 2600 * Math.exp(-((d / (window.innerWidth * 0.32)) ** 2));
        const p = phys.current[i];
        p.ox.v += (dx / d) * f;
        p.oy.v += (dy / d) * f * 0.8;
        p.rot.v += (dx / d) * f * 0.06;
        p.wght.v += 3000;
      });
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, []);

  return (
    <section ref={root} className="hero" id="top">
      <div className="hero__meta hero__reveal">
        <span>Heft — motion lab</span>
        <span>Est. 2026</span>
        <span>Physics, live</span>
      </div>

      <h1 className="hero__title" aria-label="Heft">
        {LETTERS.map((l, i) => (
          <span
            key={l}
            className="hl"
            aria-hidden
            ref={(el) => {
              outer.current[i] = el;
            }}
          >
            <span
              className="hl__phys"
              ref={(el) => {
                inner.current[i] = el;
              }}
            >
              {l}
            </span>
          </span>
        ))}
      </h1>

      <div className="hero__foot">
        <p className="hero__lede hero__reveal">
          Interfaces with <em>mass</em>. Springs, inertia, gravity and tension — simulated live, tuned by hand.
        </p>
        <button
          ref={cta}
          className="btn hero__reveal"
          data-cursor="link"
          onClick={() => scrollState.smoother?.scrollTo("#mass", true, "top 60px")}
        >
          Drop in <span aria-hidden>↓</span>
        </button>
        <p className="hero__hint hero__reveal" aria-hidden>
          Move through the letters. Click to hit them.
        </p>
      </div>
    </section>
  );
}
