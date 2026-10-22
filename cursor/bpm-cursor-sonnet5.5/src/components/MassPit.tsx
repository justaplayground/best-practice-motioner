import { useEffect, useRef, useState } from "react";
import Matter from "matter-js";
import { gsap, ScrollTrigger } from "../gsap-setup.ts";
import { useMagnetic } from "../useMagnetic.ts";
import Kinetic from "./Kinetic.tsx";

const { Engine, Bodies, Body, Composite, Constraint } = Matter;

// [label, size 1–3 (heavier = bigger = denser), style]
const WORDS: [string, 1 | 2 | 3, string][] = [
  ["Inertia", 3, "ink"],
  ["Momentum", 3, "signal"],
  ["Gravity", 3, "paper"],
  ["Damping", 2, "butter"],
  ["Stiffness", 2, "cobalt"],
  ["Friction", 2, "ink"],
  ["Elasticity", 3, "butter"],
  ["Torque", 2, "paper"],
  ["Mass", 3, "signal"],
  ["Drag", 1, "ink"],
  ["Settle", 1, "paper"],
  ["Spring", 2, "cobalt"],
  ["Impulse", 2, "signal"],
  ["Rebound", 2, "ink"],
  ["Decay", 1, "butter"],
  ["Tension", 2, "paper"],
  ["Weight", 3, "ink"],
  ["Lag", 1, "cobalt"],
  ["Overshoot", 2, "butter"],
  ["Resonance", 2, "signal"],
  ["Slip", 1, "paper"],
  ["Kick", 1, "ink"],
];

type Item = { el: HTMLElement; body: Matter.Body; w: number; h: number };

export default function MassPit() {
  const pit = useRef<HTMLDivElement>(null);
  const pills = useRef<(HTMLButtonElement | null)[]>([]);
  const api = useRef<{ flip: () => void; shake: () => void; reset: () => void } | null>(null);
  const [up, setUp] = useState(false);
  const bFlip = useMagnetic<HTMLButtonElement>(0.35, 40);
  const bShake = useMagnetic<HTMLButtonElement>(0.35, 40);
  const bReset = useMagnetic<HTMLButtonElement>(0.35, 40);

  useEffect(() => {
    const host = pit.current!;
    const engine = Engine.create({ gravity: { x: 0, y: 1.15, scale: 0.0011 } });
    const world = engine.world;
    let items: Item[] = [];
    let walls: Matter.Body[] = [];
    let ceiling: Matter.Body | null = null;
    let running = false;
    let acc = 0;
    let gravityUp = false;
    let dead = false;

    const size = () => ({ W: host.clientWidth, H: host.clientHeight });

    const buildWalls = () => {
      Composite.remove(world, walls);
      const { W, H } = size();
      const t = 400;
      const opts = { isStatic: true, friction: 0.4, restitution: 0.3 };
      walls = [
        Bodies.rectangle(W / 2, H + t / 2, W + t * 2, t, opts), // floor
        Bodies.rectangle(-t / 2, H / 2 - 600, t, H + 1800, opts), // left
        Bodies.rectangle(W + t / 2, H / 2 - 600, t, H + 1800, opts), // right
      ];
      Composite.add(world, walls);
      if (ceiling) {
        Composite.remove(world, ceiling);
        ceiling = Bodies.rectangle(W / 2, -t / 2, W + t * 2, t, opts);
        Composite.add(world, ceiling);
      }
    };

    const spawn = () => {
      const { W } = size();
      items.forEach((i) => Composite.remove(world, i.body));
      items = pills.current.filter(Boolean).map((el, idx) => {
        const e = el as HTMLElement;
        const w = e.offsetWidth;
        const h = e.offsetHeight;
        const sz = WORDS[idx][1];
        const body = Bodies.rectangle(
          w / 2 + 20 + Math.random() * Math.max(10, W - w - 40),
          -60 - idx * 78,
          w,
          h,
          {
            chamfer: { radius: h / 2 },
            restitution: 0.32 + 0.1 * (3 - sz),
            friction: 0.35,
            frictionAir: 0.008,
            density: 0.0011 * (0.6 + sz * 0.7),
            angle: (Math.random() - 0.5) * 1.2,
          },
        );
        Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.12);
        e.style.transform = `translate3d(${body.position.x - w / 2}px,${body.position.y - h / 2}px,0)`;
        return { el: e, body, w, h };
      });
      Composite.add(world, items.map((i) => i.body));
    };

    // ——— drag: a soft spring joins the pointer to the grab point on the body, so throws keep their momentum
    const holders = new Map<number, Matter.Constraint>();
    const cleanups: (() => void)[] = [];
    const bind = () => {
      items.forEach((it) => {
        const down = (e: PointerEvent) => {
          e.preventDefault();
          it.el.setPointerCapture(e.pointerId);
          const r = host.getBoundingClientRect();
          const px = e.clientX - r.left;
          const py = e.clientY - r.top;
          const a = -it.body.angle;
          const dx = px - it.body.position.x;
          const dy = py - it.body.position.y;
          const c = Constraint.create({
            pointA: { x: px, y: py },
            bodyB: it.body,
            pointB: { x: dx * Math.cos(a) - dy * Math.sin(a), y: dx * Math.sin(a) + dy * Math.cos(a) },
            stiffness: 0.07,
            damping: 0.12,
            length: 0,
          });
          Composite.add(world, c);
          holders.set(e.pointerId, c);
          it.el.classList.add("is-held");
          running = true;
        };
        const move = (e: PointerEvent) => {
          const c = holders.get(e.pointerId);
          if (!c) return;
          const r = host.getBoundingClientRect();
          c.pointA = { x: e.clientX - r.left, y: e.clientY - r.top };
        };
        const up = (e: PointerEvent) => {
          const c = holders.get(e.pointerId);
          if (!c) return;
          Composite.remove(world, c);
          holders.delete(e.pointerId);
          it.el.classList.remove("is-held");
        };
        it.el.addEventListener("pointerdown", down);
        it.el.addEventListener("pointermove", move);
        it.el.addEventListener("pointerup", up);
        it.el.addEventListener("pointercancel", up);
        cleanups.push(() => {
          it.el.removeEventListener("pointerdown", down);
          it.el.removeEventListener("pointermove", move);
          it.el.removeEventListener("pointerup", up);
          it.el.removeEventListener("pointercancel", up);
        });
      });
    };

    const tick = (_t: number, delta: number) => {
      if (!running) return;
      acc += Math.min(delta, 50);
      let n = 0;
      while (acc >= 1000 / 120 && n++ < 6) {
        Engine.update(engine, 1000 / 120);
        acc -= 1000 / 120;
      }
      for (const it of items) {
        const { x, y } = it.body.position;
        it.el.style.transform = `translate3d(${x - it.w / 2}px,${y - it.h / 2}px,0) rotate(${it.body.angle}rad)`;
      }
    };

    api.current = {
      flip: () => {
        gravityUp = !gravityUp;
        setUp(gravityUp);
        const { W } = size();
        if (!ceiling) {
          ceiling = Bodies.rectangle(W / 2, -200, W + 800, 400, { isStatic: true });
          Composite.add(world, ceiling);
        }
        // anything still falling in from above the pit is placed inside it first
        items.forEach((it) => {
          if (it.body.position.y < it.h) Body.setPosition(it.body, { x: it.body.position.x, y: it.h + 10 });
        });
        engine.gravity.y = gravityUp ? -1.15 : 1.15;
        items.forEach((it) => Body.setAngularVelocity(it.body, (Math.random() - 0.5) * 0.2));
      },
      shake: () => {
        items.forEach((it) =>
          Body.setVelocity(it.body, {
            x: (Math.random() - 0.5) * 34,
            y: (gravityUp ? 1 : -1) * (14 + Math.random() * 26),
          }),
        );
      },
      reset: () => {
        if (gravityUp) api.current?.flip();
        spawn();
        bind();
      },
    };

    let ro: ResizeObserver | null = null;
    document.fonts.ready.then(() => {
      if (dead) return;
      buildWalls();
      spawn();
      bind();
      ro = new ResizeObserver(() => {
        buildWalls();
        const { W } = size();
        items.forEach((it) => {
          if (it.body.position.x > W - it.w / 2) Body.setPosition(it.body, { x: W - it.w / 2 - 4, y: it.body.position.y });
        });
      });
      ro.observe(host);
      gsap.ticker.add(tick);
    });

    const st = ScrollTrigger.create({
      trigger: host,
      start: "top 88%",
      end: "bottom top",
      onEnter: () => (running = true),
      onToggle: (self) => {
        if (!self.isActive && !holders.size) running = false;
        else running = true;
      },
    });

    return () => {
      dead = true;
      st.kill();
      ro?.disconnect();
      gsap.ticker.remove(tick);
      cleanups.forEach((c) => c());
      Composite.clear(world, false);
      Engine.clear(engine);
    };
  }, []);

  return (
    <section className="mass" id="mass">
      <div className="mass__head">
        <p className="eyebrow">02 — Weight</p>
        <Kinetic text="Everything here has weight." className="h2" />
        <div className="mass__side">
        <p className="mass__copy">
          Real rigid bodies: bigger words are heavier, denser and harder to move. Grab one — the spring that holds it
          is soft, so a flick becomes a throw.
        </p>
        <div className="mass__tools">
          <button ref={bFlip} className="btn btn--ghost" data-cursor="link" onClick={() => api.current?.flip()}>
            Gravity: {up ? "up ↑" : "down ↓"}
          </button>
          <button ref={bShake} className="btn btn--ghost" data-cursor="link" onClick={() => api.current?.shake()}>
            Shake
          </button>
          <button ref={bReset} className="btn btn--ghost" data-cursor="link" onClick={() => api.current?.reset()}>
            Re-drop
          </button>
        </div>
        </div>
      </div>

      <div ref={pit} className="pit" role="group" aria-label="Physics pit: draggable words">
        {WORDS.map(([w, s, tone], i) => (
          <button
            key={w}
            ref={(el) => {
              pills.current[i] = el;
            }}
            className={`pill pill--${tone} pill--s${s}`}
            data-cursor="grab"
            tabIndex={-1}
            aria-hidden
          >
            {w}
          </button>
        ))}
      </div>
    </section>
  );
}
