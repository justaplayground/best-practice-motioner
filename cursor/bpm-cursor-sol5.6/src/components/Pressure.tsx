import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "../gsap-setup.ts";
import { useMedia } from "../useMedia.ts";

export function Pressure() {
  const root = useRef<HTMLElement>(null);
  const pin = useRef<HTMLDivElement>(null);
  const platen = useRef<HTMLDivElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const ink = useRef<HTMLDivElement>(null);
  const gauge = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const narrow = useMedia("(max-width: 759px)");

  useGSAP(
    () => {
      const pinEl = pin.current;
      if (!pinEl) return;

      const labels = ["APPROACH", "CONTACT", "COMPRESS", "IMPRESSION", "RELEASE"];

      if (narrow) {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: root.current,
            start: "top 60%",
            end: "bottom 20%",
            scrub: 0.6,
          },
        });
        tl.fromTo(platen.current, { yPercent: -40 }, { yPercent: 0, ease: "none" }, 0)
          .fromTo(
            sheet.current,
            { scaleX: 1, scaleY: 1 },
            { scaleX: 1.08, scaleY: 0.82, ease: "press-compress" },
            0.15,
          )
          .fromTo(
            ink.current,
            { scale: 0.2, autoAlpha: 0 },
            { scale: 1, autoAlpha: 1, ease: "ink-spread" },
            0.35,
          )
          .to(sheet.current, { scaleX: 1, scaleY: 1, ease: "plate-settle" }, 0.7)
          .to(platen.current, { yPercent: -18, ease: "none" }, 0.75);
        return;
      }

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: pinEl,
          start: "top top",
          end: "+=160%",
          pin: true,
          scrub: 0.85,
          anticipatePin: 1,
          onUpdate: (self) => {
            const i = Math.min(labels.length - 1, Math.floor(self.progress * labels.length));
            if (label.current) label.current.textContent = labels[i];
            if (gauge.current) {
              gsap.set(gauge.current, { scaleX: self.progress });
            }
          },
        },
      });

      tl.fromTo(
        platen.current,
        { yPercent: -55 },
        { yPercent: 0, duration: 1, ease: "none" },
        0,
      )
        .fromTo(
          ".press__shadow",
          { scale: 0.7, autoAlpha: 0.15 },
          { scale: 1.05, autoAlpha: 0.45, duration: 0.8, ease: "none" },
          0.2,
        )
        .fromTo(
          sheet.current,
          { scaleX: 1, scaleY: 1, rotationX: 0 },
          {
            scaleX: 1.12,
            scaleY: 0.72,
            rotationX: 4,
            duration: 0.9,
            ease: "press-compress",
            transformOrigin: "50% 100%",
          },
          0.35,
        )
        .fromTo(
          ink.current,
          { scale: 0.15, autoAlpha: 0 },
          { scale: 1.05, autoAlpha: 1, duration: 0.7, ease: "ink-spread" },
          0.55,
        )
        .to(
          ".press__type span",
          {
            y: (i: number) => (i % 2 === 0 ? 6 : -4),
            scaleY: 0.88,
            stagger: 0.02,
            duration: 0.4,
            ease: "power2.in",
          },
          0.6,
        )
        .to(
          sheet.current,
          {
            scaleX: 1,
            scaleY: 1,
            rotationX: 0,
            duration: 0.7,
            ease: "elastic.out(1, 0.45)",
          },
          1.15,
        )
        .to(
          ".press__type span",
          { y: 0, scaleY: 1, duration: 0.6, ease: "elastic.out(1, 0.4)", stagger: 0.015 },
          1.15,
        )
        .to(platen.current, { yPercent: -28, duration: 0.55, ease: "none" }, 1.25)
        .to(".press__shadow", { scale: 0.85, autoAlpha: 0.2, duration: 0.45 }, 1.25);

      ScrollTrigger.create({
        trigger: root.current,
        start: "top bottom",
        end: "bottom top",
        onUpdate: (self) => {
          const v = Math.min(Math.abs(self.getVelocity()) / 2200, 1);
          document.documentElement.style.setProperty("--press-vel", String(v));
        },
      });
    },
    { scope: root, dependencies: [narrow], revertOnUpdate: true },
  );

  return (
    <section ref={root} className="press" id="press">
      <div className="press__pin" ref={pin}>
        <div className="press__header">
          <p className="eyebrow">03 · Impression cycle</p>
          <div className="press__status">
            <span ref={label}>APPROACH</span>
            <div className="press__gauge">
              <div ref={gauge} className="press__gauge-fill" />
            </div>
          </div>
        </div>

        <div className="press__machine">
          <div className="press__platen" ref={platen}>
            <span>PLATEN</span>
            <div className="press__platen-face" />
          </div>
          <div className="press__shadow" aria-hidden />
          <div className="press__sheet" ref={sheet}>
            <div className="press__ink" ref={ink} aria-hidden />
            <p className="press__type" aria-hidden>
              {"PRESSURE".split("").map((ch, i) => (
                <span key={i}>{ch}</span>
              ))}
            </p>
            <p className="press__caption">
              Scroll drives compression. Release restores form with elastic recovery.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
