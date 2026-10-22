import { Fragment, useRef } from "react";
import type { ElementType } from "react";
import { gsap, useGSAP } from "../gsap-setup.ts";

/**
 * Kinetic heading: characters spring in from below when scrolled into view,
 * lean with scroll velocity (CSS --skew) and spring back when poked by the pointer.
 */
export default function Kinetic({
  text,
  as: Tag = "h2",
  className = "",
  delay = 0,
}: {
  text: string;
  as?: ElementType;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const chars = gsap.utils.toArray<HTMLElement>(".kc", ref.current);
      gsap.from(chars, {
        yPercent: 110,
        rotation: () => gsap.utils.random(-16, 16),
        opacity: 0,
        duration: 1.5,
        delay,
        ease: "elastic.out(1, 0.5)",
        stagger: { each: 0.028, from: "start" },
        scrollTrigger: { trigger: ref.current, start: "top 88%", once: true },
      });
    },
    { scope: ref },
  );

  const poke = (e: React.PointerEvent) => {
    const c = (e.target as HTMLElement).closest<HTMLElement>(".kc");
    if (!c || c.dataset.busy) return;
    c.dataset.busy = "1";
    gsap
      .timeline({ onComplete: () => void delete c.dataset.busy })
      .to(c, { y: -44, rotation: gsap.utils.random(-18, 18), duration: 0.16, ease: "power2.out" })
      .to(c, { y: 0, rotation: 0, duration: 1.5, ease: "elastic.out(1.1, 0.28)" });
  };

  return (
    <Tag ref={ref} className={`kinetic ${className}`} aria-label={text} onPointerOver={poke}>
      {text.split(" ").map((w, i) => (
        <Fragment key={i}>
          <span className="kw" aria-hidden>
            {[...w].map((ch, j) => (
              <span className="kc" key={j}>
                {ch}
              </span>
            ))}
          </span>{" "}
        </Fragment>
      ))}
    </Tag>
  );
}
