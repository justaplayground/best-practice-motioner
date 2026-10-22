import { useEffect, useRef, useState } from "react";
import { gsap } from "../gsap-setup.ts";
import { clamp } from "../physics.ts";
import { useMagnetic } from "../useMagnetic.ts";
import Kinetic from "./Kinetic.tsx";

const SEG = 15;
const GRAV = 2600;
const PULL = 70; // px of extra stretch needed to trip the switch

type P = { x: number; y: number; px: number; py: number };

export default function Footer() {
  const root = useRef<HTMLElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const rope = useRef<SVGPathElement>(null);
  const handle = useRef<SVGGElement>(null);
  const glow = useRef<HTMLDivElement>(null);
  const [lit, setLit] = useState(false);
  const litRef = useRef(false);
  const mail = useMagnetic<HTMLAnchorElement>(0.3, 70);
  const pts = useRef<P[]>([]);
  const grab = useRef<{ x: number; y: number } | null>(null);
  const restY = useRef(0);

  const toggle = () => {
    litRef.current = !litRef.current;
    setLit(litRef.current);
    const g = glow.current;
    if (!g) return;
    if (litRef.current) {
      gsap.killTweensOf(g);
      gsap.fromTo(g, { scale: 0.15 }, { scale: 1, duration: 1.8, ease: "elastic.out(1, 0.4)" });
      gsap.to(g, { keyframes: { opacity: [0, 0.5, 0.15, 1, 0.65, 1], easeEach: "none" }, duration: 0.6 });
    } else {
      gsap.killTweensOf(g);
      gsap.to(g, { opacity: 0, scale: 0.4, duration: 0.7, ease: "power3.in" });
    }
  };

  useEffect(() => {
    const el = root.current!;
    const anchor = () => ({ x: el.clientWidth * (el.clientWidth < 700 ? 0.82 : 0.84), y: 0 });
    const seg = () => clamp(el.clientHeight * 0.34 / SEG, 12, 22);
    const init = () => {
      const a = anchor();
      const L = seg();
      restY.current = SEG * L * 1.1;
      pts.current = Array.from({ length: SEG + 1 }, (_, i) => ({ x: a.x + i * 0.2, y: a.y + i * L, px: a.x + i * 0.2, py: a.y + i * L }));
    };
    init();

    let wasInView = false;
    const tick = () => {
      const r = el.getBoundingClientRect();
      const inView = r.bottom > 0 && r.top < window.innerHeight;
      if (!inView && !wasInView) return;
      wasInView = inView;
      const a = anchor();
      const L = seg();
      const P = pts.current;
      const sub = 2;
      const dt = 1 / 60 / sub;
      for (let s = 0; s < sub; s++) {
        for (let i = 1; i <= SEG; i++) {
          const p = P[i];
          const vx = (p.x - p.px) * 0.985;
          const vy = (p.y - p.py) * 0.985;
          p.px = p.x;
          p.py = p.y;
          p.x += vx;
          p.y += vy + GRAV * dt * dt;
        }
        P[0].x = P[0].px = a.x;
        P[0].y = P[0].py = a.y;
        if (grab.current) {
          const g = grab.current;
          const end = P[SEG];
          end.x = end.px = g.x - r.left;
          end.y = end.py = g.y - r.top;
        }
        // soft (stretchy) distance constraints → a cord that gives, then snaps back
        for (let it = 0; it < 5; it++) {
          for (let i = 0; i < SEG; i++) {
            const A = P[i];
            const B = P[i + 1];
            const dx = B.x - A.x;
            const dy = B.y - A.y;
            const d = Math.hypot(dx, dy) || 1;
            const diff = ((d - L) / d) * 0.5;
            const k = 0.9;
            if (i === 0) {
              B.x -= dx * diff * 2 * k;
              B.y -= dy * diff * 2 * k;
            } else {
              A.x += dx * diff * k;
              A.y += dy * diff * k;
              if (!(grab.current && i + 1 === SEG)) {
                B.x -= dx * diff * k;
                B.y -= dy * diff * k;
              }
            }
          }
        }
      }
      let d = `M ${P[0].x} ${P[0].y}`;
      for (let i = 1; i < SEG; i++) d += ` Q ${P[i].x} ${P[i].y} ${(P[i].x + P[i + 1].x) / 2} ${(P[i].y + P[i + 1].y) / 2}`;
      d += ` L ${P[SEG].x} ${P[SEG].y}`;
      rope.current?.setAttribute("d", d);
      const e = P[SEG];
      if (!grab.current && Math.abs(e.y - e.py) < 0.04) restY.current = e.y; // settled → remember where "rest" is
      const prev = P[SEG - 1];
      const ang = (Math.atan2(e.y - prev.y, e.x - prev.x) * 180) / Math.PI - 90;
      handle.current?.setAttribute("transform", `translate(${e.x.toFixed(1)} ${e.y.toFixed(1)}) rotate(${ang.toFixed(1)})`);
    };
    gsap.ticker.add(tick);
    window.addEventListener("resize", init);
    return () => {
      gsap.ticker.remove(tick);
      window.removeEventListener("resize", init);
    };
  }, []);

  const down = (e: React.PointerEvent) => {
    try {
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    } catch {
      /* synthetic pointer: nothing to capture */
    }
    grab.current = { x: e.clientX, y: e.clientY };
  };
  const move = (e: React.PointerEvent) => {
    if (grab.current) grab.current = { x: e.clientX, y: e.clientY };
  };
  const up = () => {
    if (!grab.current) return;
    const stretched = pts.current[SEG].y - restY.current;
    grab.current = null;
    if (stretched > PULL) toggle();
  };

  return (
    <footer ref={root} className="footer" id="contact" data-lit={lit}>
      <div ref={glow} className="footer__glow" aria-hidden />
      <svg ref={svg} className="footer__rope" aria-hidden>
        <path ref={rope} className="rope__line" fill="none" strokeLinecap="round" />
        <g ref={handle}>
          <circle r="34" fill="transparent" className="rope__hit" data-cursor="pull" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} />
          <rect x="-7" y="-4" width="14" height="30" rx="7" className="rope__bead" pointerEvents="none" />
        </g>
      </svg>

      <div className="footer__inner">
        <p className="eyebrow">06 — Contact</p>
        <Kinetic text="Say hello." className="footer__title" />
        <a ref={mail} className="footer__mail" href="mailto:hello@heft.studio" data-cursor="link">
          hello@heft.studio
        </a>
        <p className="footer__hint">
          {lit ? "Lights on. Pull again to turn them off." : "Pull the cord. Hard enough, and it clicks."}
        </p>
      </div>

      <div className="footer__base">
        <span>© 2026 Heft Motion Lab</span>
        <span>Everything on this page is simulated live — no pre-rendered clips.</span>
      </div>
    </footer>
  );
}
