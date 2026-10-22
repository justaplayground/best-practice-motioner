import { useEffect, useRef, useState } from "react";
import { useMedia } from "../useMedia.ts";

const LINKS = [
  { href: "#chart", id: "chart", label: "Chart" },
  { href: "#stations", id: "stations", label: "Stations" },
  { href: "#plates", id: "plates", label: "Plates" },
  { href: "#ledger", id: "ledger", label: "Ledger" },
];

export function SiteChrome() {
  const narrow = useMedia("(max-width: 759px)");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("chart");
  const toggleRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const opened = useRef(false);

  useEffect(() => {
    const nodes = LINKS.map((link) => document.getElementById(link.id)).filter(
      (node): node is HTMLElement => Boolean(node),
    );
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActive(visible.target.id);
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: [0.1, 0.25, 0.5] },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onPointer = (event: PointerEvent) => {
      if (!navRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  useEffect(() => {
    if (!narrow) return;
    if (open) {
      opened.current = true;
      firstLinkRef.current?.focus();
    } else if (opened.current) {
      toggleRef.current?.focus();
    }
  }, [open, narrow]);

  return (
    <>
      <a className="skip" href="#chart">
        Skip to chart
      </a>
      <header className="nav-wrap">
        <nav ref={navRef} className="nav" aria-label="Primary">
          <a className="wordmark" href="#chart">
            <Mark />
            Sounding
          </a>
          <button
            ref={toggleRef}
            type="button"
            className="nav-toggle"
            aria-expanded={open}
            aria-controls="site-index"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? "Close" : "Index"}
          </button>
          <div id="site-index" className={open ? "nav-links is-open" : "nav-links"}>
            {LINKS.map((link, index) => (
              <a
                key={link.id}
                ref={index === 0 ? firstLinkRef : undefined}
                href={link.href}
                aria-current={active === link.id ? "true" : undefined}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </div>
        </nav>
      </header>
    </>
  );
}

function Mark() {
  return (
    <svg className="mark" viewBox="0 0 28 28" aria-hidden="true">
      <circle cx="14" cy="14" r="12" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M14 4v12" stroke="#7a2e16" strokeWidth="1.6" />
      <circle cx="14" cy="17" r="2" fill="#7a2e16" />
    </svg>
  );
}
