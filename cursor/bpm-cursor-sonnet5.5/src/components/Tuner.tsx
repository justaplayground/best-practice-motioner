import { useEffect, useRef, useState } from "react";
import { ScrollTrigger } from "../gsap-setup.ts";
import { Spring, clamp, toSvg, useTick } from "../physics.ts";
import Kinetic from "./Kinetic.tsx";

const REST = 340; // block rest x
const WALL = 56;
const BLOCK_R = 38;
const HIST = 280;

const PRESETS = [
  { name: "Snappy", k: 420, c: 30, m: 1 },
  { name: "Gentle", k: 120, c: 20, m: 1 },
  { name: "Wobbly", k: 180, c: 3.5, m: 1 },
  { name: "Heavy", k: 160, c: 24, m: 4 },
  { name: "Jelly", k: 280, c: 2.2, m: 1.6 },
];

function regime(z: number) {
  if (z < 0.05) return "almost undamped — rings for ages";
  if (z < 0.6) return "under-damped — overshoots and wobbles";
  if (z < 0.95) return "lightly under-damped — one soft overshoot";
  if (z < 1.08) return "critically damped — fastest, no overshoot";
  return "over-damped — slow, never overshoots";
}

export default function Tuner() {
  const root = useRef<HTMLElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const coil = useRef<SVGPathElement>(null);
  const block = useRef<SVGGElement>(null);
  const graph = useRef<SVGPolylineElement>(null);
  const [p, setP] = useState(PRESETS[2]);
  const params = useRef(p);
  const sp = useRef(new Spring(0, p.k, p.c, p.m));
  const held = useRef(false);
  const hist = useRef<number[]>(Array(HIST).fill(0));
  const kickTimer = useRef<number>(0);

  useEffect(() => {
    params.current = p;
    const s = sp.current;
    s.k = p.k;
    s.c = p.c;
    s.m = p.m;
  }, [p]);

  const kick = (delay = 200) => {
    window.clearTimeout(kickTimer.current);
    kickTimer.current = window.setTimeout(() => {
      sp.current.x = 170;
      sp.current.v = 0;
    }, delay);
  };

  useEffect(() => {
    const st = ScrollTrigger.create({
      trigger: root.current,
      start: "top 60%",
      once: true,
      onEnter: () => kick(300),
    });
    return () => {
      st.kill();
      window.clearTimeout(kickTimer.current);
    };
  }, []);

  const onDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture(e.pointerId);
    held.current = true;
    window.clearTimeout(kickTimer.current);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!held.current || !svg.current) return;
    const pt = toSvg(svg.current, e.clientX, e.clientY);
    const x = clamp(pt.x - REST, -170, 240);
    const s = sp.current;
    s.v = (x - s.x) * 55; // finger velocity is what carries over on release
    s.x = x;
  };
  const onUp = () => (held.current = false);

  useTick((dt) => {
    const s = sp.current;
    if (!held.current) s.step(dt);
    else s.v *= Math.exp(-dt * 14); // a held block carries only the velocity of the latest movement
    const x = REST + s.x;
    block.current?.setAttribute("transform", `translate(${x.toFixed(2)} 150)`);

    // coil: amplitude shrinks as it stretches, widens as it compresses
    const x0 = WALL + 8;
    const x1 = x - BLOCK_R;
    const len = Math.max(20, x1 - x0);
    const amp = clamp(26 * Math.sqrt(150 / len), 8, 46);
    const turns = 11;
    let d = `M ${WALL} 150 L ${x0} 150`;
    for (let i = 0; i < turns; i++) {
      const a = x0 + ((i + 0.25) / turns) * len;
      const b = x0 + ((i + 0.75) / turns) * len;
      d += ` L ${a.toFixed(1)} ${150 - amp} L ${b.toFixed(1)} ${150 + amp}`;
    }
    d += ` L ${x1.toFixed(1)} 150`;
    coil.current?.setAttribute("d", d);

    const h = hist.current;
    h.push(s.x);
    h.shift();
    const pts = h
      .map((v, i) => `${((i / (HIST - 1)) * 620 + 30).toFixed(1)},${(318 - clamp(v, -170, 240) * 0.2).toFixed(1)}`)
      .join(" ");
    graph.current?.setAttribute("points", pts);
  });

  const zeta = p.c / (2 * Math.sqrt(p.k * p.m));
  const hz = Math.sqrt(p.k / p.m) / (2 * Math.PI);
  const settle = zeta < 1 ? 4 / (zeta * Math.sqrt(p.k / p.m)) : 4 / ((zeta - Math.sqrt(zeta * zeta - 1)) * Math.sqrt(p.k / p.m));

  const slider = (key: "k" | "c" | "m", label: string, min: number, max: number, step: number, unit: string) => (
    <label className="slider">
      <span className="slider__top">
        <span>{label}</span>
        <output>
          {p[key]} {unit}
        </output>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={p[key]}
        data-cursor="grab"
        onChange={(e) => {
          setP({ ...p, name: "Custom", [key]: Number(e.target.value) } as typeof p);
          kick();
        }}
      />
    </label>
  );

  return (
    <section ref={root} className="tuner" id="tuner">
      <div className="tuner__panel">
        <p className="eyebrow">04 — Tuner</p>
        <Kinetic text="Tune the feel." className="h2" />
        <p className="tuner__copy">
          The same block, three numbers. Drag it, release it, and move the sliders — every time you let go of one the
          block is thrown so you can read the response.
        </p>

        <div className="chips" role="group" aria-label="Presets">
          {PRESETS.map((pr) => (
            <button
              key={pr.name}
              className={`chip${p.name === pr.name ? " is-on" : ""}`}
              data-cursor="link"
              onClick={() => {
                setP(pr);
                kick(60);
              }}
            >
              {pr.name}
            </button>
          ))}
        </div>

        {slider("k", "Stiffness k", 20, 800, 10, "N/m")}
        {slider("c", "Damping c", 0.5, 60, 0.5, "N·s/m")}
        {slider("m", "Mass m", 0.2, 6, 0.1, "kg")}

        <dl className="readout">
          <div>
            <dt>ζ damping ratio</dt>
            <dd>{zeta.toFixed(2)}</dd>
          </div>
          <div>
            <dt>Natural freq.</dt>
            <dd>{hz.toFixed(2)} Hz</dd>
          </div>
          <div>
            <dt>Settles in ≈</dt>
            <dd>{settle.toFixed(1)} s</dd>
          </div>
        </dl>
        <p className="tuner__regime">{regime(zeta)}</p>
      </div>

      <div className="tuner__stage">
        <svg ref={svg} viewBox="0 0 680 360" role="img" aria-label="A block on a spring, drag it and release">
          <rect x={WALL - 14} y="70" width="14" height="160" rx="4" className="t-fill" />
          {Array.from({ length: 7 }, (_, i) => (
            <line key={i} x1={WALL - 14} y1={82 + i * 24} x2={WALL - 28} y2={96 + i * 24} className="t-line" />
          ))}
          <line x1={WALL} y1="262" x2="640" y2="262" className="t-line" strokeDasharray="2 8" />
          <line x1={REST} y1="236" x2={REST} y2="270" className="t-line" />
          <path ref={coil} className="t-coil" fill="none" strokeLinejoin="round" strokeLinecap="round" />
          <g ref={block}>
            <rect
              x={-BLOCK_R}
              y={-BLOCK_R}
              width={BLOCK_R * 2}
              height={BLOCK_R * 2}
              rx="20"
              className="t-block"
              data-cursor="grab"
              onPointerDown={onDown}
              onPointerMove={onMove}
              onPointerUp={onUp}
              onPointerCancel={onUp}
            />
            <circle r="5" className="t-dot" pointerEvents="none" />
          </g>
          <text x="650" y="296" textAnchor="end" className="t-label">
            x(t) — last {(HIST / 60).toFixed(0)} s
          </text>
          <line x1="30" y1="318" x2="650" y2="318" className="t-line" strokeDasharray="2 6" />
          <polyline ref={graph} className="t-graph" fill="none" strokeLinejoin="round" />
        </svg>
      </div>
    </section>
  );
}
