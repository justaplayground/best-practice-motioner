import { useRef } from "react";
import { clamp, toSvg, useTick } from "../../physics.ts";

const PIVOT = { x: 150, y: 40 };
const L = 170; // 1.7 m at 100 px/m → ω₀² = g/L ≈ 5.8 (period ≈ 2.6 s)
const G_OVER_L = 9.81 / 1.7;

export default function Pendulum() {
  const svg = useRef<SVGSVGElement>(null);
  const rod = useRef<SVGLineElement>(null);
  const bob = useRef<SVGGElement>(null);
  const trail = useRef<(SVGCircleElement | null)[]>([]);
  const s = useRef({ th: 1.1, w: 0, held: false, lastTh: 1.1, rest: 0, hist: [] as { x: number; y: number }[], t: 0 });

  const grab = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture(e.pointerId);
    s.current.held = true;
  };
  const move = (e: React.PointerEvent) => {
    const c = s.current;
    if (!c.held || !svg.current) return;
    const p = toSvg(svg.current, e.clientX, e.clientY);
    c.th = clamp(Math.atan2(p.x - PIVOT.x, p.y - PIVOT.y), -2.7, 2.7);
  };
  const release = () => (s.current.held = false);

  useTick((dt) => {
    const c = s.current;
    if (c.held) {
      // angular velocity while held is measured, so letting go transfers the swing
      c.w += ((c.th - c.lastTh) / Math.max(dt, 1e-3) - c.w) * 0.35;
    } else {
      let t = dt;
      while (t > 0) {
        const h = Math.min(t, 1 / 240);
        c.w += (-G_OVER_L * Math.sin(c.th) - 0.16 * c.w) * h; // θ'' = −(g/L) sin θ − c θ'
        c.th += c.w * h;
        t -= h;
      }
      // when it comes to rest, it gets a small knock so the demo never sits dead
      c.rest = Math.abs(c.th) < 0.03 && Math.abs(c.w) < 0.05 ? c.rest + dt : 0;
      if (c.rest > 1.4) c.w = 2.4 * (Math.random() > 0.5 ? 1 : -1);
    }
    c.lastTh = c.th;
    const x = PIVOT.x + Math.sin(c.th) * L;
    const y = PIVOT.y + Math.cos(c.th) * L;
    rod.current?.setAttribute("x2", x.toFixed(2));
    rod.current?.setAttribute("y2", y.toFixed(2));
    bob.current?.setAttribute("transform", `translate(${x.toFixed(2)} ${y.toFixed(2)})`);
    c.hist.unshift({ x, y });
    if (c.hist.length > 14) c.hist.pop();
    trail.current.forEach((el, i) => {
      const h = c.hist[(i + 1) * 1] ?? c.hist[c.hist.length - 1];
      if (el && h) {
        el.setAttribute("cx", h.x.toFixed(1));
        el.setAttribute("cy", h.y.toFixed(1));
      }
    });
  });

  return (
    <svg ref={svg} className="demo" viewBox="0 0 300 300" role="img" aria-label="Drag the pendulum bob and let go">
      <path d="M 70 40 H 230" className="demo__stroke" strokeWidth="3" />
      {Array.from({ length: 12 }, (_, i) => (
        <circle
          key={i}
          ref={(el) => {
            trail.current[i] = el;
          }}
          r={18 - i * 1.3}
          className="demo__ghost"
          opacity={0.2 - i * 0.015}
        />
      ))}
      <line ref={rod} x1={PIVOT.x} y1={PIVOT.y} x2={PIVOT.x} y2={PIVOT.y + L} className="demo__stroke" strokeWidth="2" />
      <circle cx={PIVOT.x} cy={PIVOT.y} r="5" className="demo__fill" />
      <g ref={bob}>
        <circle
          r="42"
          fill="transparent"
          className="demo__hit"
          data-cursor="grab"
          onPointerDown={grab}
          onPointerMove={move}
          onPointerUp={release}
          onPointerCancel={release}
        />
        <circle r="21" className="demo__signal" pointerEvents="none" />
        <circle r="6" className="demo__paper" pointerEvents="none" />
      </g>
    </svg>
  );
}
