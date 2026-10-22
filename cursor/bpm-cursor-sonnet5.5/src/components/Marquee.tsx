import { useEffect, useRef } from "react";
import { gsap } from "../gsap-setup.ts";
import { scrollState } from "../motion-state.ts";
import { Spring, clamp } from "../physics.ts";

const WORDS = ["Inertia", "Damping", "Stiffness", "Momentum", "Gravity", "Friction", "Elasticity", "Tension"];

function Band({ dir, className }: { dir: 1 | -1; className: string }) {
  const band = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = track.current!;
    const b = band.current!;
    let x = 0;
    let w = el.scrollWidth / 2;
    const skew = new Spring(0, 160, 14);
    const speed = new Spring(70, 40, 8); // px/s of base drift, driven by scroll velocity
    const measure = () => (w = el.scrollWidth / 2);
    document.fonts.ready.then(measure);
    window.addEventListener("resize", measure);

    const tick = (_t: number, delta: number) => {
      const dt = Math.min(delta / 1000, 0.05);
      // scroll momentum feeds the band: it accelerates with scrolling and eases back to its drift
      // (signed, so scrolling back up brakes, passes through zero and reverses the band)
      speed.target = 70 + clamp(scrollState.v, -3000, 3000) * 0.55;
      const s = speed.step(dt);
      x -= dir * s * dt;
      x = gsap.utils.wrap(-w, 0, x);
      skew.target = clamp(-scrollState.v / 140, -14, 14) * dir;
      gsap.set(el, { x });
      b.style.setProperty("--band-skew", `${skew.step(dt).toFixed(2)}deg`);
    };
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      window.removeEventListener("resize", measure);
    };
  }, [dir]);

  const row = WORDS.map((w) => (
    <span className="band__item" key={w}>
      {w}
      <i aria-hidden />
    </span>
  ));

  return (
    <div ref={band} className={`band ${className}`} aria-hidden>
      <div ref={track} className="band__track">
        {row}
        {row}
      </div>
    </div>
  );
}

export default function Marquee() {
  return (
    <section className="marquee" aria-label="Vocabulary">
      <Band dir={1} className="band--signal" />
      <Band dir={-1} className="band--ink" />
    </section>
  );
}
