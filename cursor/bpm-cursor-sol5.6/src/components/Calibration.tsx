import { useRef, useState } from "react";
import { gsap, Draggable, useGSAP } from "../gsap-setup.ts";
import { useMedia } from "../useMedia.ts";

const TOLERANCE = 10;

export function Calibration() {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const handle = useRef<HTMLButtonElement>(null);
  const plateC = useRef<HTMLDivElement>(null);
  const plateM = useRef<HTMLDivElement>(null);
  const plateY = useRef<HTMLDivElement>(null);
  const plateK = useRef<HTMLDivElement>(null);
  const readX = useRef<HTMLSpanElement>(null);
  const readY = useRef<HTMLSpanElement>(null);
  const readErr = useRef<HTMLSpanElement>(null);
  const [locked, setLocked] = useState(false);
  const narrow = useMedia("(max-width: 759px)");

  useGSAP(
    (_ctx, contextSafe) => {
      const stageEl = stage.current;
      const handleEl = handle.current;
      if (!stageEl || !handleEl) return;

      const plates = [plateC.current, plateM.current, plateY.current, plateK.current].filter(
        Boolean,
      ) as HTMLElement[];

      const sync = (x: number, y: number, settling = false) => {
        const err = Math.hypot(x, y);
        const inTol = err <= TOLERANCE;
        if (readX.current) readX.current.textContent = `${x >= 0 ? "+" : ""}${x.toFixed(1)}`;
        if (readY.current) readY.current.textContent = `${y >= 0 ? "+" : ""}${y.toFixed(1)}`;
        if (readErr.current) {
          readErr.current.textContent = inTol ? "IN REGISTER" : `${err.toFixed(1)} px`;
          readErr.current.dataset.state = inTol ? "ok" : "off";
        }

        const couples = [
          { el: plates[0], mx: 1.0, my: 0.85 },
          { el: plates[1], mx: -0.9, my: 1.05 },
          { el: plates[2], mx: 0.75, my: -0.95 },
          { el: plates[3], mx: 0.15, my: 0.12 },
        ];
        couples.forEach(({ el, mx, my }) => {
          if (!el) return;
          gsap.to(el, {
            x: -x * mx,
            y: -y * my,
            duration: settling ? 0.85 : 0.12,
            ease: settling ? "elastic.out(1, 0.35)" : "power2.out",
            overwrite: "auto",
          });
        });

        if (!inTol) setLocked(false);
        else if (settling) setLocked(true);
      };

      const tryLock = () => {
        const x = Number(gsap.getProperty(handleEl, "x")) || 0;
        const y = Number(gsap.getProperty(handleEl, "y")) || 0;
        if (Math.hypot(x, y) > TOLERANCE) return;
        gsap.to(handleEl, {
          x: 0,
          y: 0,
          duration: 0.9,
          ease: "elastic.out(1, 0.32)",
          overwrite: "auto",
          onUpdate: () => {
            sync(
              Number(gsap.getProperty(handleEl, "x")) || 0,
              Number(gsap.getProperty(handleEl, "y")) || 0,
              true,
            );
          },
          onComplete: () => {
            setLocked(true);
            gsap.fromTo(
              ".cal__flash",
              { autoAlpha: 0.55, scale: 0.92 },
              { autoAlpha: 0, scale: 1.08, duration: 0.7, ease: "power2.out" },
            );
          },
        });
      };

      const [drag] = Draggable.create(handleEl, {
        type: "x,y",
        bounds: stageEl,
        edgeResistance: 0.72,
        inertia: true,
        throwResistance: 1800,
        onDrag() {
          sync(this.x, this.y);
        },
        onThrowUpdate() {
          sync(this.x, this.y);
        },
        onThrowComplete() {
          sync(this.x, this.y);
          tryLock();
        },
        onPress() {
          setLocked(false);
          handleEl.setAttribute("aria-pressed", "true");
        },
        onRelease() {
          handleEl.setAttribute("aria-pressed", "false");
          // If inertia won't run (near-zero velocity), attempt lock now
          if (!drag.isThrowing) tryLock();
        },
      });

      const safe = contextSafe ?? (<T extends unknown[]>(fn: (...args: T) => void) => fn);
      const nudge = safe((dx: number, dy: number) => {
        const x = (Number(gsap.getProperty(handleEl, "x")) || 0) + dx;
        const y = (Number(gsap.getProperty(handleEl, "y")) || 0) + dy;
        const max = narrow ? 70 : 110;
        const cx = gsap.utils.clamp(-max, max, x);
        const cy = gsap.utils.clamp(-max, max, y);
        gsap.to(handleEl, {
          x: cx,
          y: cy,
          duration: 0.45,
          ease: "power3.out",
          onUpdate: () => {
            sync(
              Number(gsap.getProperty(handleEl, "x")) || 0,
              Number(gsap.getProperty(handleEl, "y")) || 0,
            );
          },
        });
      });

      const onKey = (e: KeyboardEvent) => {
        const step = e.shiftKey ? 12 : 4;
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          nudge(-step, 0);
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          nudge(step, 0);
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          nudge(0, -step);
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          nudge(0, step);
        } else if (e.key === "Home" || e.key === "Enter") {
          e.preventDefault();
          gsap.to(handleEl, {
            x: 0,
            y: 0,
            duration: 0.85,
            ease: "elastic.out(1, 0.3)",
            onUpdate: () =>
              sync(
                Number(gsap.getProperty(handleEl, "x")) || 0,
                Number(gsap.getProperty(handleEl, "y")) || 0,
                true,
              ),
            onComplete: () => setLocked(true),
          });
        }
      };
      handleEl.addEventListener("keydown", onKey);

      // Start slightly misregistered so the interaction has a job
      gsap.set(handleEl, { x: narrow ? 36 : 52, y: narrow ? -28 : -40 });
      sync(narrow ? 36 : 52, narrow ? -28 : -40);

      gsap.from(".cal__intro > *", {
        y: 24,
        autoAlpha: 0,
        stagger: 0.08,
        duration: 0.7,
        ease: "power3.out",
        scrollTrigger: { trigger: root.current, start: "top 75%" },
      });

      return () => {
        handleEl.removeEventListener("keydown", onKey);
        drag.kill();
      };
    },
    { scope: root, dependencies: [narrow] },
  );

  return (
    <section ref={root} className="cal" id="calibrate">
      <div className="cal__intro">
        <p className="eyebrow">02 · Calibration table</p>
        <h2>Drag until the plates agree.</h2>
        <p className="lede">
          The handle is heavy. Edges resist. Sibling plates spring against your pull.
          Inside {TOLERANCE}px, elastic settle snaps them into register.
        </p>
      </div>

      <div className="cal__board">
        <div className="cal__readout" aria-live="polite">
          <div>
            <span className="cal__key">ΔX</span>
            <span ref={readX}>+0.0</span>
          </div>
          <div>
            <span className="cal__key">ΔY</span>
            <span ref={readY}>+0.0</span>
          </div>
          <div>
            <span className="cal__key">ERR</span>
            <span ref={readErr} data-state="off">
              —
            </span>
          </div>
          <div className={`cal__lock${locked ? " is-on" : ""}`}>
            {locked ? "LOCKED" : "OPEN"}
          </div>
        </div>

        <div className="cal__stage" ref={stage}>
          <div className="cal__flash" aria-hidden />
          <div className="cal__target" aria-hidden>
            <div ref={plateC} className="cal__plate cal__plate--c">
              C
            </div>
            <div ref={plateM} className="cal__plate cal__plate--m">
              M
            </div>
            <div ref={plateY} className="cal__plate cal__plate--y">
              Y
            </div>
            <div ref={plateK} className="cal__plate cal__plate--k">
              ●
            </div>
            <span className="cal__bullseye" />
          </div>
          <button
            ref={handle}
            type="button"
            className="cal__handle"
            aria-label="Registration handle. Arrow keys nudge. Enter centers."
            aria-pressed="false"
          >
            <span className="cal__handle-cross" aria-hidden />
            grab
          </button>
        </div>
      </div>
    </section>
  );
}
