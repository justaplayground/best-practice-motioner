import { useRef, useState } from "react";
import { gsap, Flip, useGSAP } from "../gsap-setup.ts";

type Spec = {
  id: string;
  title: string;
  code: string;
  blurb: string;
  demo: "stagger" | "overshoot" | "handoff" | "lag";
};

const SPECS: Spec[] = [
  {
    id: "s1",
    title: "Stagger cascade",
    code: "stagger: { each: 0.06, from: 'center' }",
    blurb: "Overlapping entrances keep spatial continuity — nothing pops in isolation.",
    demo: "stagger",
  },
  {
    id: "s2",
    title: "Overshoot trim",
    code: "ease: elastic.out(1, 0.4)",
    blurb: "A controlled ring past the target, then settle. Mass without chaos.",
    demo: "overshoot",
  },
  {
    id: "s3",
    title: "Momentum handoff",
    code: "inertia → spring.target",
    blurb: "Velocity from one gesture becomes the initial condition of the next.",
    demo: "handoff",
  },
  {
    id: "s4",
    title: "Lag follow",
    code: "quickTo + lag 0.18–0.4",
    blurb: "Heavier channels trail the pointer. Weight reads as delay, not blur.",
    demo: "lag",
  },
];

export function Specimens() {
  const root = useRef<HTMLElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  useGSAP(
    () => {
      gsap.from(".spec__card", {
        y: 48,
        autoAlpha: 0,
        stagger: 0.1,
        duration: 0.85,
        ease: "power3.out",
        scrollTrigger: { trigger: root.current, start: "top 70%" },
      });
    },
    { scope: root },
  );

  const toggle = (id: string) => {
    const gridEl = grid.current;
    if (!gridEl) return;
    const state = Flip.getState(".spec__card, .spec__demo");
    setOpenId((prev) => (prev === id ? null : id));
    requestAnimationFrame(() => {
      Flip.from(state, {
        duration: 0.75,
        ease: "power3.inOut",
        absolute: false,
        nested: true,
        onComplete: () => playDemo(id),
      });
    });
  };

  const playDemo = (id: string) => {
    const card = root.current?.querySelector(`[data-id="${id}"]`);
    if (!card) return;
    const demo = card.getAttribute("data-demo") as Spec["demo"];
    const dots = card.querySelectorAll(".spec__dot");
    const bar = card.querySelector(".spec__bar");
    gsap.killTweensOf([dots, bar]);

    if (demo === "stagger") {
      gsap.fromTo(
        dots,
        { y: 24, scale: 0.6, autoAlpha: 0 },
        {
          y: 0,
          scale: 1,
          autoAlpha: 1,
          stagger: { each: 0.06, from: "center" },
          duration: 0.55,
          ease: "back.out(1.6)",
        },
      );
    } else if (demo === "overshoot") {
      gsap.fromTo(
        bar,
        { x: -80, scaleX: 0.4 },
        { x: 0, scaleX: 1, duration: 1.1, ease: "elastic.out(1, 0.4)" },
      );
    } else if (demo === "handoff") {
      const tl = gsap.timeline();
      tl.fromTo(dots[0], { x: -40 }, { x: 0, duration: 0.35, ease: "power2.in" })
        .fromTo(
          dots[1],
          { x: -20, autoAlpha: 0.3 },
          { x: 0, autoAlpha: 1, duration: 0.55, ease: "power3.out" },
          "-=0.08",
        )
        .fromTo(
          dots[2],
          { x: -10, autoAlpha: 0.2 },
          { x: 0, autoAlpha: 1, duration: 0.7, ease: "elastic.out(1, 0.5)" },
          "-=0.2",
        );
    } else {
      const xTo = gsap.quickTo(dots[1] as Element, "x", { duration: 0.45, ease: "power3" });
      const yTo = gsap.quickTo(dots[1] as Element, "y", { duration: 0.55, ease: "power3" });
      let t = 0;
      const tick = () => {
        t += 1;
        xTo(Math.sin(t * 0.18) * 28);
        yTo(Math.cos(t * 0.14) * 12);
        if (t < 40) requestAnimationFrame(tick);
        else gsap.to(dots[1], { x: 0, y: 0, duration: 0.8, ease: "elastic.out(1, 0.35)" });
      };
      tick();
    }
  };

  return (
    <section ref={root} className="spec" id="specimens">
      <div className="spec__intro">
        <p className="eyebrow">04 · Motion specimens</p>
        <h2>Flip a plate. Watch the rule.</h2>
        <p className="lede">
          Four specimens — each a calibrated physical idea, not a preset bounce.
        </p>
      </div>
      <div className="spec__grid" ref={grid}>
        {SPECS.map((s) => {
          const open = openId === s.id;
          return (
            <article
              key={s.id}
              className={`spec__card${open ? " is-open" : ""}`}
              data-id={s.id}
              data-demo={s.demo}
            >
              <button
                type="button"
                className="spec__face"
                aria-expanded={open}
                onClick={() => toggle(s.id)}
              >
                <span className="spec__idx">{s.id.toUpperCase()}</span>
                <h3>{s.title}</h3>
                <code>{s.code}</code>
                <span className="spec__cta">{open ? "Collapse" : "Open specimen"}</span>
              </button>
              <div className="spec__demo" hidden={!open}>
                <p>{s.blurb}</p>
                <div className="spec__stage" aria-hidden>
                  <span className="spec__dot" />
                  <span className="spec__dot" />
                  <span className="spec__dot" />
                  <span className="spec__bar" />
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
