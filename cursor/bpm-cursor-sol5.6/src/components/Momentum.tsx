import { useRef } from "react";
import { gsap, useGSAP } from "../gsap-setup.ts";
import { scrollState } from "../motion-state.ts";
import { Spring, useTick } from "../physics.ts";

const TOKENS = [
  "inertia",
  "overshoot",
  "settle",
  "mass",
  "damping",
  "magnetic",
  "elastic",
  "momentum",
  "follow-through",
  "compression",
];

export function Momentum() {
  const root = useRef<HTMLElement>(null);
  const trackA = useRef<HTMLDivElement>(null);
  const trackB = useRef<HTMLDivElement>(null);
  const speed = useRef(new Spring(40, 40, 8));
  const skew = useRef(new Spring(0, 60, 10));
  const posA = useRef(0);
  const posB = useRef(0);

  useGSAP(
    () => {
      gsap.from(".momentum__label", {
        y: 30,
        autoAlpha: 0,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: { trigger: root.current, start: "top 80%" },
      });
    },
    { scope: root },
  );

  useTick((dt) => {
    const vy = Math.abs(scrollState.vy);
    speed.current.target = 36 + Math.min(vy * 0.045, 160);
    skew.current.target = Math.max(-14, Math.min(14, scrollState.vy * 0.008));
    const s = speed.current.step(dt);
    const k = skew.current.step(dt);

    posA.current -= s * dt;
    posB.current += s * dt * 0.72;
    const w = trackA.current?.scrollWidth ?? 2000;
    if (posA.current < -w / 2) posA.current += w / 2;
    if (posB.current > 0) posB.current -= w / 2;

    if (trackA.current) {
      trackA.current.style.transform = `translate3d(${posA.current.toFixed(1)}px,0,0) skewX(${k.toFixed(2)}deg)`;
    }
    if (trackB.current) {
      trackB.current.style.transform = `translate3d(${posB.current.toFixed(1)}px,0,0) skewX(${(-k * 0.7).toFixed(2)}deg)`;
    }
  });

  const row = (key: string) =>
    [...TOKENS, ...TOKENS].map((t, i) => (
      <span key={`${key}-${i}`} className="momentum__token">
        {t}
        <i aria-hidden>●</i>
      </span>
    ));

  return (
    <section ref={root} className="momentum" id="momentum">
      <p className="momentum__label eyebrow">01 · Velocity field</p>
      <div className="momentum__rail" aria-hidden>
        <div className="momentum__track" ref={trackA}>
          {row("a")}
        </div>
      </div>
      <div className="momentum__rail momentum__rail--rev" aria-hidden>
        <div className="momentum__track" ref={trackB}>
          {row("b")}
        </div>
      </div>
      <p className="momentum__hint">
        Scroll faster — the ticker gains mass and leans into the turn.
      </p>
    </section>
  );
}
