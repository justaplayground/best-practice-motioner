import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { gsap } from "../gsap-setup.ts";
import { pointer } from "../motion-state.ts";
import { Spring, clamp, useTick } from "../physics.ts";
import Kinetic from "./Kinetic.tsx";

const WORK = [
  { n: "01", title: "Ballast", kind: "Navigation", year: "2026", bg: "#ff4a1c", fg: "#15130f", shape: "circle" },
  { n: "02", title: "Slingshot", kind: "Onboarding", year: "2026", bg: "#2f3cff", fg: "#eee9dd", shape: "arc" },
  { n: "03", title: "Pendant", kind: "Product page", year: "2025", bg: "#f6d557", fg: "#15130f", shape: "pendulum" },
  { n: "04", title: "Tilt Deck", kind: "Dashboard", year: "2025", bg: "#15130f", fg: "#eee9dd", shape: "bars" },
  { n: "05", title: "Rubber Hour", kind: "Scheduling", year: "2024", bg: "#eee9dd", fg: "#15130f", shape: "wave" },
] as const;

function Shape({ kind }: { kind: (typeof WORK)[number]["shape"] }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 6, strokeLinecap: "round" as const };
  return (
    <svg viewBox="0 0 120 120" className="preview__shape" aria-hidden>
      {kind === "circle" && <circle cx="60" cy="60" r="38" fill="currentColor" />}
      {kind === "arc" && <path d="M 14 94 Q 60 -40 106 94" {...common} />}
      {kind === "pendulum" && (
        <>
          <line x1="60" y1="8" x2="84" y2="80" {...common} />
          <circle cx="86" cy="88" r="16" fill="currentColor" />
        </>
      )}
      {kind === "bars" && [20, 44, 68, 92].map((x, i) => <rect key={x} x={x - 8} y={90 - (i + 1) * 20} width="16" height={(i + 1) * 20} rx="8" fill="currentColor" />)}
      {kind === "wave" && <path d="M 8 60 C 26 10, 40 110, 60 60 S 94 10, 112 60" {...common} />}
    </svg>
  );
}

export default function Index() {
  const [active, setActive] = useState(0);
  const [shown, setShown] = useState(false);
  const card = useRef<HTMLDivElement>(null);
  const sp = useRef({
    x: new Spring(0, 170, 17),
    y: new Spring(0, 170, 17),
    rot: new Spring(0, 90, 6), // swings like something hung from the pointer
    sc: new Spring(0, 260, 15),
  });

  useTick((dt) => {
    const c = sp.current;
    c.x.target = pointer.x;
    c.y.target = pointer.y;
    c.rot.target = clamp(pointer.vx / 55, -22, 22);
    c.sc.target = shown ? 1 : 0;
    const x = c.x.step(dt);
    const y = c.y.step(dt);
    const r = c.rot.step(dt);
    const s = Math.max(0, c.sc.step(dt));
    if (card.current)
      card.current.style.transform = `translate3d(${x}px,${y}px,0) translate(-50%,-50%) rotate(${r}deg) scale(${s})`;
  });

  const enter = (i: number, el: HTMLElement) => {
    setActive(i);
    setShown(true);
    gsap.to(el.querySelector(".row__title"), { x: 36, duration: 1, ease: "elastic.out(1, 0.45)", overwrite: true });
  };
  const leave = (el: HTMLElement) => {
    setShown(false);
    gsap.to(el.querySelector(".row__title"), { x: 0, duration: 1.1, ease: "elastic.out(1, 0.4)", overwrite: true });
  };

  const w = WORK[active];

  return (
    <section className="index" id="index">
      <div className="index__head">
        <p className="eyebrow">05 — Index</p>
        <Kinetic text="Selected experiments" className="h2" />
      </div>

      <ul className="rows">
        {WORK.map((r, i) => (
          <li
            key={r.n}
            className="row"
            tabIndex={0}
            data-cursor="link"
            onPointerEnter={(e) => enter(i, e.currentTarget)}
            onPointerLeave={(e) => leave(e.currentTarget)}
            onFocus={(e) => {
              enter(i, e.currentTarget);
              const b = e.currentTarget.getBoundingClientRect();
              pointer.x = b.left + b.width * 0.6;
              pointer.y = b.top + b.height / 2;
            }}
            onBlur={(e) => leave(e.currentTarget)}
          >
            <span className="row__n">{r.n}</span>
            <span className="row__title">{r.title}</span>
            <span className="row__kind">{r.kind}</span>
            <span className="row__year">{r.year}</span>
          </li>
        ))}
      </ul>

      {createPortal(
        <div ref={card} className="preview" style={{ background: w.bg, color: w.fg }} aria-hidden>
          <span className="preview__n">{w.n}</span>
          <Shape kind={w.shape} />
          <span className="preview__t">{w.title}</span>
        </div>,
        document.body,
      )}
    </section>
  );
}
