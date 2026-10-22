import { useEffect, useRef } from "react";
import { gsap } from "../gsap-setup.ts";
import { pointer, scrollState } from "../motion-state.ts";
import { Spring, clamp, critical, useTick } from "../physics.ts";
import { useMagnetic } from "../useMagnetic.ts";

/* ───────────── Cursor: a dot that is tight, a ring that trails and stretches along its velocity ───────────── */

export function Cursor() {
  const ring = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const s = useRef({
    rx: new Spring(-100, 150, 19),
    ry: new Spring(-100, 150, 19),
    dx: new Spring(-100, 1200, critical(1200)),
    dy: new Spring(-100, 1200, critical(1200)),
    scale: new Spring(1, 320, 17),
    kind: "",
  });

  useEffect(() => {
    if (pointer.coarse) return;
    document.body.classList.add("has-cursor");
    const over = (e: PointerEvent) => {
      const t = (e.target as Element | null)?.closest("[data-cursor]");
      const kind = t?.getAttribute("data-cursor") ?? "";
      s.current.kind = kind;
      const sizes: Record<string, number> = { link: 2.1, grab: 2.6, pull: 2.6, "": 1 };
      s.current.scale.target = sizes[kind] ?? 1;
      if (label.current) label.current.textContent = kind === "grab" ? "drag" : kind === "pull" ? "pull" : "";
      ring.current?.setAttribute("data-kind", kind);
    };
    const down = () => (s.current.scale.target = (s.current.scale.target || 1) * 0.72);
    const up = () => {
      const sizes: Record<string, number> = { link: 2.1, grab: 2.6, pull: 2.6, "": 1 };
      s.current.scale.target = sizes[s.current.kind] ?? 1;
    };
    window.addEventListener("pointerover", over, { passive: true });
    window.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    return () => {
      document.body.classList.remove("has-cursor");
      window.removeEventListener("pointerover", over);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
    };
  }, []);

  useTick((dt) => {
    if (pointer.coarse || !ring.current || !dot.current || !label.current) return;
    const c = s.current;
    c.rx.target = c.dx.target = pointer.x;
    c.ry.target = c.dy.target = pointer.y;
    const x = c.rx.step(dt);
    const y = c.ry.step(dt);
    const sc = c.scale.step(dt);
    const speed = Math.hypot(pointer.vx, pointer.vy);
    const stretch = 1 + clamp(speed / 2600, 0, 0.75);
    const angle = Math.atan2(pointer.vy, pointer.vx);
    ring.current.style.transform = `translate3d(${x}px,${y}px,0) rotate(${angle}rad) scale(${sc * stretch},${sc / Math.sqrt(stretch)})`;
    dot.current.style.transform = `translate3d(${c.dx.step(dt)}px,${c.dy.step(dt)}px,0)`;
    label.current.style.transform = `translate3d(${x}px,${y}px,0)`;
  });

  return (
    <>
      <div ref={ring} className="cursor-ring" aria-hidden />
      <div ref={dot} className="cursor-dot" aria-hidden />
      <span ref={label} className="cursor-label" aria-hidden />
    </>
  );
}

/* ───────────── Nav ───────────── */

const LINKS = [
  { id: "mass", label: "Mass" },
  { id: "principles", label: "Principles" },
  { id: "tuner", label: "Tuner" },
  { id: "index", label: "Index" },
];

function NavLink({ id, label }: { id: string; label: string }) {
  const ref = useMagnetic<HTMLAnchorElement>(0.45, 36);
  return (
    <a
      ref={ref}
      href={`#${id}`}
      className="nav__link"
      data-cursor="link"
      onClick={(e) => {
        e.preventDefault();
        scrollState.smoother?.scrollTo(`#${id}`, true, "top 70px");
      }}
    >
      {label}
    </a>
  );
}

export function Nav() {
  const logo = useRef<HTMLAnchorElement>(null);
  const ball = useRef<HTMLSpanElement>(null);
  const cta = useMagnetic<HTMLAnchorElement>(0.4, 48);

  // the logo ball is dropped on hover and squashes on landing
  const drop = () => {
    const b = ball.current;
    if (!b || gsap.isTweening(b)) return;
    gsap.fromTo(b, { y: -18 }, { y: 0, duration: 1.2, ease: "heft-drop" });
    gsap.fromTo(
      b,
      { scaleX: 1, scaleY: 1 },
      { scaleX: 1.5, scaleY: 0.5, duration: 1.2, ease: "heft-drop-squash", transformOrigin: "50% 100%" },
    );
  };

  return (
    <header className="nav">
      <a
        ref={logo}
        href="#top"
        className="nav__logo"
        data-cursor="link"
        onPointerEnter={drop}
        onClick={(e) => {
          e.preventDefault();
          scrollState.smoother?.scrollTo(0, true);
        }}
      >
        <span ref={ball} className="nav__ball" aria-hidden />
        Heft
      </a>
      <nav className="nav__links" aria-label="Sections">
        {LINKS.map((l) => (
          <NavLink key={l.id} {...l} />
        ))}
      </nav>
      <a
        ref={cta}
        href="#contact"
        className="nav__cta"
        data-cursor="link"
        onClick={(e) => {
          e.preventDefault();
          scrollState.smoother?.scrollTo("#contact", true, "top top");
        }}
      >
        Say hello
      </a>
    </header>
  );
}

/* ───────────── Scroll bead: hangs from a thread, lags the scroll, stretches with velocity ───────────── */

export function ScrollBead() {
  const bead = useRef<HTMLSpanElement>(null);
  const thread = useRef<HTMLSpanElement>(null);
  const pos = useRef(new Spring(0, 70, 7, 1));

  useTick((dt) => {
    if (!bead.current || !thread.current) return;
    const track = window.innerHeight * 0.64;
    pos.current.target = scrollState.progress * track;
    const y = pos.current.step(dt);
    const stretch = 1 + clamp(Math.abs(pos.current.v) / 900, 0, 1.4);
    bead.current.style.transform = `translate3d(-50%,${y}px,0) scale(${1 / Math.sqrt(stretch)},${stretch})`;
    thread.current.style.transform = `scaleY(${clamp(y / track, 0, 1)})`;
  });

  return (
    <div className="bead" aria-hidden>
      <span className="bead__rail" />
      <span ref={thread} className="bead__thread" />
      <span ref={bead} className="bead__ball" />
    </div>
  );
}
