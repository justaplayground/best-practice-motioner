import { useRef } from "react";
import { gsap, useGSAP } from "../gsap-setup.ts";
import { pointer } from "../motion-state.ts";
import { Spring, clamp, useTick } from "../physics.ts";
import { useMagnetic } from "../useMagnetic.ts";

const LAYERS = [
  { id: "c", label: "C", ox: -18, oy: -10 },
  { id: "m", label: "M", ox: 14, oy: -8 },
  { id: "y", label: "Y", ox: -10, oy: 14 },
  { id: "k", label: "K", ox: 0, oy: 0 },
] as const;

type LayerPhys = {
  x: Spring;
  y: Spring;
  rot: Spring;
};

export function Hero() {
  const root = useRef<HTMLElement>(null);
  const layerRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const locked = useRef(0);
  const cta = useMagnetic<HTMLButtonElement>(0.38, 56);
  const phys = useRef<LayerPhys[]>(
    LAYERS.map((l) => ({
      x: new Spring(l.ox, 90, 11),
      y: new Spring(l.oy, 90, 11),
      rot: new Spring(l.id === "k" ? 0 : l.id === "c" ? -2.2 : l.id === "m" ? 1.8 : 1.2, 70, 9),
    })),
  );

  useGSAP(
    () => {
      const layers = layerRefs.current.filter(Boolean) as HTMLElement[];
      gsap.from(layers, {
        y: 80,
        autoAlpha: 0,
        stagger: 0.08,
        duration: 1.1,
        ease: "power4.out",
        delay: 0.15,
      });
      gsap.from(".hero__meta > *", {
        y: 24,
        autoAlpha: 0,
        stagger: 0.1,
        duration: 0.9,
        delay: 0.55,
        ease: "power3.out",
      });
      gsap.from(".hero__copy", {
        y: 28,
        autoAlpha: 0,
        duration: 1,
        delay: 0.75,
        ease: "power3.out",
      });

      gsap.to(
        {},
        {
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: "bottom top",
            scrub: true,
            onUpdate: (self) => {
              locked.current = self.progress;
            },
          },
        },
      );
    },
    { scope: root },
  );

  useTick((dt) => {
    const lock = locked.current;
    const vw = window.innerWidth;
    const R = Math.max(220, vw * 0.28);

    LAYERS.forEach((layer, i) => {
      const el = layerRefs.current[i];
      if (!el) return;
      const p = phys.current[i];
      const restX = layer.ox * (1 - lock);
      const restY = layer.oy * (1 - lock);
      const restRot =
        (layer.id === "k" ? 0 : layer.id === "c" ? -2.2 : layer.id === "m" ? 1.8 : 1.2) *
        (1 - lock);

      if (pointer.active && pointer.coarse === false && lock < 0.95) {
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dx = pointer.x - cx;
        const dy = pointer.y - cy;
        const d = Math.hypot(dx, dy) || 1;
        const inf = Math.exp(-((d / R) ** 2)) * (1 - lock);
        const lag = 0.22 + i * 0.07;
        p.x.target = restX + dx * lag * inf;
        p.y.target = restY + dy * lag * inf;
        p.rot.target = restRot + clamp((-dx / R) * 6 * inf, -8, 8);
        p.x.v += pointer.vx * 0.012 * inf * dt;
        p.y.v += pointer.vy * 0.012 * inf * dt;
      } else {
        p.x.target = restX;
        p.y.target = restY;
        p.rot.target = restRot;
      }

      el.style.transform = `translate3d(${p.x.step(dt).toFixed(2)}px,${p.y.step(dt).toFixed(2)}px,0) rotate(${p.rot.step(dt).toFixed(2)}deg)`;
    });
  });

  return (
    <section ref={root} className="hero" id="plate">
      <div className="hero__meta">
        <span>Proof · 00</span>
        <span>CMYK lock</span>
        <span>Press sheet A</span>
      </div>

      <div className="hero__stage" aria-label="Register">
        <div className="hero__title" role="img" aria-label="Register">
          {LAYERS.map((layer, i) => (
            <span
              key={layer.id}
              className={`hero__layer hero__layer--${layer.id}`}
              aria-hidden
              ref={(el) => {
                layerRefs.current[i] = el;
              }}
            >
              REGISTER
            </span>
          ))}
        </div>
        <div className="reg-marks" aria-hidden>
          <span className="reg-marks__tl" />
          <span className="reg-marks__tr" />
          <span className="reg-marks__bl" />
          <span className="reg-marks__br" />
          <span className="reg-marks__cross" />
        </div>
      </div>

      <div className="hero__copy">
        <p>
          Misregistered plates find their seat. Scroll to lock layers. Move to feel
          the lag — each channel carries different mass.
        </p>
        <button
          ref={cta}
          type="button"
          className="btn"
          onClick={() => {
            const el = document.querySelector("#calibrate");
            if (!el) return;
            const y = el.getBoundingClientRect().top + window.scrollY - 48;
            gsap.to(window, { scrollTo: y, duration: 1.15, ease: "power3.inOut" });
          }}
        >
          Align the target
          <span aria-hidden>↓</span>
        </button>
      </div>
    </section>
  );
}
