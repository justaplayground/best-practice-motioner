import { useRef } from "react";
import { Spring, clamp, toSvg, useTick } from "../../physics.ts";

const FLOOR = 252;
const R = 22;
const G = 1500;

export default function Bounce() {
  const svg = useRef<SVGSVGElement>(null);
  const ball = useRef<SVGEllipseElement>(null);
  const shadow = useRef<SVGEllipseElement>(null);
  const s = useRef({
    x: 150,
    y: 40,
    vx: 60,
    vy: 0,
    held: false,
    track: [] as { x: number; y: number; t: number }[],
    rest: 0,
    squash: new Spring(0, 520, 15),
  });

  const down = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture(e.pointerId);
    s.current.held = true;
    s.current.track = [];
  };
  const move = (e: React.PointerEvent) => {
    const c = s.current;
    if (!c.held || !svg.current) return;
    const p = toSvg(svg.current, e.clientX, e.clientY);
    c.x = clamp(p.x, 20 + R, 280 - R);
    c.y = clamp(p.y, R, FLOOR - R);
    c.track.push({ x: c.x, y: c.y, t: performance.now() });
    if (c.track.length > 6) c.track.shift();
  };
  const up = () => {
    const c = s.current;
    c.held = false;
    // throw: velocity from the last few pointer samples
    const a = c.track[0];
    const b = c.track[c.track.length - 1];
    if (a && b && b.t - a.t > 8 && performance.now() - b.t < 120) {
      c.vx = clamp(((b.x - a.x) / (b.t - a.t)) * 1000, -1800, 1800);
      c.vy = clamp(((b.y - a.y) / (b.t - a.t)) * 1000, -2200, 2200);
    } else {
      c.vx = c.vy = 0;
    }
  };

  useTick((dt) => {
    const c = s.current;
    if (!c.held) {
      c.vy += G * dt;
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      if (c.x < 20 + R || c.x > 280 - R) {
        c.x = clamp(c.x, 20 + R, 280 - R);
        c.vx *= -0.82;
      }
      if (c.y < R) {
        c.y = R;
        c.vy *= -0.6;
      }
      if (c.y > FLOOR - R) {
        const impact = Math.abs(c.vy);
        c.y = FLOOR - R;
        if (impact > 90) {
          c.vy = -impact * 0.79;
          c.squash.v = clamp(impact / 95, 0, 15); // impact energy → squash velocity
        } else c.vy = 0;
        c.vx *= 0.97;
      }
      const grounded = c.y >= FLOOR - R - 0.5 && Math.abs(c.vy) < 40;
      c.rest = grounded ? c.rest + dt : 0;
      if (c.rest > 1.3) {
        c.vy = -1050 - Math.random() * 350;
        c.vx = (Math.random() - 0.5) * 380;
        c.rest = 0;
      }
    }
    const q = clamp(c.squash.step(dt), -0.25, 0.55);
    const air = clamp(Math.abs(c.vy) / 2600, 0, 0.3);
    const sy = clamp(1 - q * 0.75 + air, 0.35, 1.5);
    const sx = clamp(1 + q * 0.65 - air * 0.55, 0.7, 1.7);
    const cy = Math.min(c.y, FLOOR - R) + R - R * sy; // keep the base planted during a squash
    const e = ball.current;
    if (e) {
      e.setAttribute("cx", c.x.toFixed(2));
      e.setAttribute("cy", (c.held ? c.y : cy).toFixed(2));
      e.setAttribute("rx", (R * sx).toFixed(2));
      e.setAttribute("ry", (R * sy).toFixed(2));
    }
    const h = clamp((FLOOR - c.y) / 220, 0, 1);
    const sh = shadow.current;
    if (sh) {
      sh.setAttribute("cx", c.x.toFixed(2));
      sh.setAttribute("rx", (R * (1.25 - h * 0.7) * sx).toFixed(2));
      sh.setAttribute("opacity", (0.38 - h * 0.28).toFixed(3));
    }
  });

  return (
    <svg ref={svg} className="demo" viewBox="0 0 300 300" role="img" aria-label="Grab and throw the ball">
      <line x1="20" y1={FLOOR} x2="280" y2={FLOOR} className="demo__stroke" strokeWidth="3" />
      <ellipse ref={shadow} cy={FLOOR + 6} ry="5" className="demo__fill" />
      <ellipse
        ref={ball}
        className="demo__signal demo__hit"
        data-cursor="grab"
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
      />
    </svg>
  );
}
