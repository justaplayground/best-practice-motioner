import { useRef } from "react";
import { clamp, toSvg, useTick } from "../../physics.ts";

const N = 30;
const X0 = 24;
const X1 = 276;
const Y = 150;
const K = 22000; // tension / segment mass → fundamental ≈ 3 Hz
const C = 1.1; // global damping
const C2 = 36; // neighbour damping, kills the fizz at high modes
const MAX = 78; // beyond this the string slips off the pick

export default function StringDemo() {
  const svg = useRef<SVGSVGElement>(null);
  const path = useRef<SVGPathElement>(null);
  const s = useRef({
    y: new Float32Array(N + 1),
    v: new Float32Array(N + 1),
    grab: -1,
    gy: 0,
    prevPy: Y,
  });

  const pointerY = (e: React.PointerEvent) => {
    const p = toSvg(svg.current!, e.clientX, e.clientY);
    return p;
  };

  const handle = (e: React.PointerEvent, force: boolean) => {
    if (!svg.current) return;
    const c = s.current;
    const p = pointerY(e);
    const i = Math.round(((p.x - X0) / (X1 - X0)) * N);
    if (c.grab >= 0) {
      if (Math.abs(p.y - Y) > MAX || i <= 0 || i >= N) c.grab = -1;
      else c.gy = p.y - Y;
    } else if (i > 0 && i < N) {
      const cur = c.y[i] + Y;
      const crossed = (c.prevPy - cur) * (p.y - cur) <= 0; // the pointer just cut across the string
      if (force || crossed) {
        c.grab = i;
        c.gy = p.y - Y;
      }
    }
    c.prevPy = p.y;
  };
  const leave = () => (s.current.grab = -1);

  useTick((dt) => {
    const c = s.current;
    let t = dt;
    while (t > 1e-6) {
      const h = Math.min(t, 1 / 240);
      for (let i = 1; i < N; i++) {
        const a =
          K * (c.y[i - 1] + c.y[i + 1] - 2 * c.y[i]) -
          C * c.v[i] -
          C2 * (2 * c.v[i] - c.v[i - 1] - c.v[i + 1]);
        c.v[i] += a * h;
      }
      for (let i = 1; i < N; i++) c.y[i] += c.v[i] * h;
      if (c.grab > 0) {
        c.y[c.grab] = c.gy;
        c.v[c.grab] = 0;
      }
      t -= h;
    }
    // render as a smooth path through the nodes
    let d = "";
    for (let i = 0; i <= N; i++) {
      const x = X0 + ((X1 - X0) * i) / N;
      const y = Y + c.y[i];
      if (i === 0) d += `M ${x} ${y}`;
      else {
        const px = X0 + ((X1 - X0) * (i - 1)) / N;
        const py = Y + c.y[i - 1];
        d += ` Q ${px} ${py} ${(px + x) / 2} ${(py + y) / 2}`;
      }
    }
    d += ` L ${X1} ${Y}`;
    const amp = clamp(c.y.reduce((m, v) => Math.max(m, Math.abs(v)), 0) / 40, 0, 1);
    path.current?.setAttribute("d", d);
    path.current?.setAttribute("stroke-width", (3.2 - amp * 1.4).toFixed(2));
  });

  return (
    <svg
      ref={svg}
      className="demo"
      viewBox="0 0 300 300"
      role="img"
      aria-label="Sweep the pointer across the string to pluck it"
      onPointerMove={(e) => handle(e, false)}
      onPointerDown={(e) => handle(e, true)}
      onPointerLeave={leave}
      onPointerUp={leave}
    >
      <rect x="14" y={Y - 22} width="10" height="44" rx="3" className="demo__fill" />
      <rect x="276" y={Y - 22} width="10" height="44" rx="3" className="demo__fill" />
      <path ref={path} className="demo__signal-stroke" fill="none" strokeLinecap="round" d={`M ${X0} ${Y} L ${X1} ${Y}`} />
      <rect x="30" y={Y - 42} width="240" height="84" fill="transparent" className="demo__hit" data-cursor="grab" />
    </svg>
  );
}
