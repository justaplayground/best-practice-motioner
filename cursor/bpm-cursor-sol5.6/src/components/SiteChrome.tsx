import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger, useGSAP } from "../gsap-setup.ts";
import { useMagnetic } from "../useMagnetic.ts";
import { scrollState } from "../motion-state.ts";

const LINKS = [
  { href: "#plate", label: "Plate" },
  { href: "#momentum", label: "Momentum" },
  { href: "#calibrate", label: "Calibrate" },
  { href: "#press", label: "Press" },
  { href: "#specimens", label: "Specimens" },
  { href: "#signoff", label: "Sign-off" },
];

export function SiteChrome() {
  const fillRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const logoRef = useMagnetic<HTMLAnchorElement>(0.28, 40);

  useGSAP(() => {
    ScrollTrigger.create({
      trigger: document.body,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        if (fillRef.current) {
          gsap.set(fillRef.current, { scaleX: self.progress });
        }
      },
    });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const jump = (href: string) => {
    setOpen(false);
    const el = document.querySelector(href);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 64;
    gsap.to(window, {
      scrollTo: y,
      duration: 1.1,
      ease: "power3.inOut",
      onUpdate: () => {
        scrollState.y = window.scrollY;
      },
    });
  };

  return (
    <>
      <a className="skip" href="#plate">
        Skip to content
      </a>
      <header className="chrome">
        <a ref={logoRef} className="chrome__logo" href="#plate">
          <span className="chrome__mark" aria-hidden>
            <i className="c" />
            <i className="m" />
            <i className="y" />
            <i className="k" />
          </span>
          Register
        </a>
        <nav className={`chrome__nav${open ? " is-open" : ""}`} aria-label="Sections">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => {
                e.preventDefault();
                jump(link.href);
              }}
            >
              {link.label}
            </a>
          ))}
        </nav>
        <button
          type="button"
          className="chrome__toggle"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Close" : "Index"}
        </button>
      </header>
      <div
        id="mobile-nav"
        className={`chrome__drawer${open ? " is-open" : ""}`}
        hidden={!open}
      >
        {LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            onClick={(e) => {
              e.preventDefault();
              jump(link.href);
            }}
          >
            {link.label}
          </a>
        ))}
      </div>
      <div className="progress" aria-hidden>
        <div className="progress__fill" ref={fillRef} />
      </div>
    </>
  );
}
