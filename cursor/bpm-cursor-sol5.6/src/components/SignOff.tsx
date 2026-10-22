import { useRef } from "react";
import { gsap, useGSAP } from "../gsap-setup.ts";
import { scrollState } from "../motion-state.ts";
import { useMagnetic } from "../useMagnetic.ts";

export function SignOff() {
  const root = useRef<HTMLElement>(null);
  const stamp = useRef<HTMLDivElement>(null);
  const path = useRef<SVGPathElement>(null);
  const trace = useRef<SVGPolylineElement>(null);
  const samples = useRef<number[]>([]);
  const btn = useMagnetic<HTMLAnchorElement>(0.3, 44);

  useGSAP(
    () => {
      const pathEl = path.current;
      const stampEl = stamp.current;
      if (!pathEl || !stampEl) return;

      gsap.set(stampEl, { xPercent: -50, yPercent: -50 });

      gsap.to(stampEl, {
        motionPath: {
          path: pathEl,
          align: pathEl,
          alignOrigin: [0.5, 0.5],
          autoRotate: true,
        },
        ease: "none",
        scrollTrigger: {
          trigger: root.current,
          start: "top 70%",
          end: "bottom bottom",
          scrub: 1.1,
        },
      });

      gsap.from(".sign__copy > *", {
        y: 28,
        autoAlpha: 0,
        stagger: 0.1,
        duration: 0.85,
        ease: "power3.out",
        scrollTrigger: { trigger: root.current, start: "top 75%" },
      });

      const pts: number[] = [];
      const drawTrace = () => {
        const poly = trace.current;
        if (!poly) return;
        const data = samples.current;
        if (data.length < 2) return;
        const w = 280;
        const h = 64;
        const step = w / Math.max(data.length - 1, 1);
        const d = data
          .map((v, i) => `${(i * step).toFixed(1)},${(h - v).toFixed(1)}`)
          .join(" ");
        poly.setAttribute("points", d);
      };

      gsap.timeline({
        scrollTrigger: {
          trigger: root.current,
          start: "top bottom",
          end: "top 40%",
          onUpdate: () => {
            pts.push(Math.min(120, Math.abs(scrollState.vy) * 0.04));
            if (pts.length > 48) pts.shift();
            samples.current = [...pts];
            drawTrace();
          },
        },
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} className="sign" id="signoff">
      <div className="sign__copy">
        <p className="eyebrow">05 · Signed off</p>
        <h2>In register.</h2>
        <p className="lede">
          Physical intent, tuned by hand. Springs, lag, compression, and settle —
          one language across the sheet.
        </p>
        <a ref={btn} className="btn" href="#plate">
          Back to plate
        </a>
      </div>

      <div className="sign__stage">
        <svg className="sign__path" viewBox="0 0 320 220" aria-hidden>
          <path
            ref={path}
            d="M40,180 C80,40 160,40 160,110 S240,200 280,60"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="4 6"
          />
        </svg>
        <div className="sign__stamp" ref={stamp} aria-hidden>
          APPROVED
        </div>
        <div className="sign__trace">
          <p className="eyebrow">Scroll velocity envelope</p>
          <svg viewBox="0 0 280 64" width="280" height="64" aria-hidden>
            <polyline
              ref={trace}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              points="0,64 280,64"
            />
          </svg>
        </div>
      </div>

      <footer className="colophon">
        <p>Register · bpm-cursor-sol5.6</p>
        <p>GSAP · React · press-proof motion</p>
      </footer>
    </section>
  );
}
