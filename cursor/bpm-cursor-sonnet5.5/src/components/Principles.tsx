import { useRef } from "react";
import { gsap, useGSAP } from "../gsap-setup.ts";
import Kinetic from "./Kinetic.tsx";
import Pendulum from "./demos/Pendulum.tsx";
import Bounce from "./demos/Bounce.tsx";
import StringDemo from "./demos/StringDemo.tsx";
import MagnetField from "./demos/MagnetField.tsx";

const CARDS = [
  {
    n: "01",
    title: "Restoring force",
    demo: <Pendulum />,
    eq: "θ″ = −(g/L)·sin θ − c·θ′",
    copy: "Pull the bob and let go. Gravity returns it, momentum carries it past centre, damping slowly takes the energy. Period depends on length — never on mass.",
  },
  {
    n: "02",
    title: "Squash & stretch",
    demo: <Bounce />,
    eq: "v′ = −0.79·v   on impact",
    copy: "Stretched in flight, flattened on contact, volume conserved. Throw the ball: how hard it lands decides how much it deforms.",
  },
  {
    n: "03",
    title: "Tension",
    demo: <StringDemo />,
    eq: "ÿᵢ = k(yᵢ₋₁ + yᵢ₊₁ − 2yᵢ) − c·ẏᵢ",
    copy: "Thirty point masses joined by tension. Sweep the pointer through the string — it catches, bends, and slips off the pick.",
  },
  {
    n: "04",
    title: "Fields",
    demo: <MagnetField />,
    eq: "F = −k·x  +  q·(1 − d/R)²",
    copy: "Every dot is tethered home by a spring, and your pointer is a charge. Hold the button to flip it from repelling to pulling.",
  },
];

export default function Principles() {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const count = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const t = track.current!;
      const dist = () => t.scrollWidth - window.innerWidth;
      gsap.to(t, {
        x: () => -dist(),
        ease: "none",
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: () => `+=${dist() * 1.15}`,
          pin: true,
          scrub: true,
          invalidateOnRefresh: true,
          anticipatePin: 1,
          onUpdate: (self) => {
            if (bar.current) bar.current.style.transform = `scaleX(${self.progress})`;
            if (count.current) {
              const idx = Math.min(CARDS.length, 1 + Math.floor(self.progress * CARDS.length * 0.999));
              count.current.textContent = `0${idx}`;
            }
          },
        },
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} className="principles" id="principles">
      <div ref={track} className="principles__track">
        <div className="principles__intro">
          <p className="eyebrow">03 — Principles</p>
          <Kinetic text="Four small physics, one language." className="h2" />
          <p className="principles__sub">Keep scrolling → then touch everything.</p>
        </div>

        {CARDS.map((c) => (
          <article className="pcard" key={c.n}>
            <header className="pcard__head">
              <span className="pcard__n">{c.n}</span>
              <h3>{c.title}</h3>
            </header>
            <div className="pcard__demo">{c.demo}</div>
            <code className="pcard__eq">{c.eq}</code>
            <p className="pcard__copy">{c.copy}</p>
          </article>
        ))}
        <div className="principles__end" aria-hidden />
      </div>

      <div className="principles__progress" aria-hidden>
        <span ref={count} className="principles__count">
          01
        </span>
        <div className="principles__rail">
          <div ref={bar} className="principles__bar" />
        </div>
        <span>04</span>
      </div>
    </section>
  );
}
