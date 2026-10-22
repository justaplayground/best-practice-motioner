import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useMedia } from "../useMedia.ts";

const PLATES = [
  {
    id: "01",
    year: "1974",
    title: "North spit",
    copy: "Traced from the first sheet, while the sand still made an island at low water.",
  },
  {
    id: "02",
    year: "1998",
    title: "Ebb rose",
    copy: "The ebb sets southwest off the elbow. The wedge is the bearing the boat actually took.",
  },
  {
    id: "03",
    year: "1974",
    title: "June staff",
    copy: "A staff reading on the morning of the first survey. The water sat near the lower marks.",
  },
  {
    id: "04",
    year: "2026",
    title: "Six grabs",
    copy: "Samples from the sill, paler on the bar and dark where the dredge cut through.",
  },
];

export function Plates() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const reduced = useMedia("(prefers-reduced-motion: reduce)");

  const sync = () => {
    const el = scrollerRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft < 8);
    setAtEnd(el.scrollLeft + el.clientWidth > el.scrollWidth - 8);
  };

  useEffect(() => {
    sync();
    const el = scrollerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(sync);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const scrollByCard = (direction: number) => {
    const el = scrollerRef.current;
    const card = el?.querySelector("figure");
    if (!el || !card) return;
    const styles = window.getComputedStyle(el);
    const gap = Number.parseFloat(styles.columnGap || styles.gap || "16");
    el.scrollBy({
      left: direction * (card.getBoundingClientRect().width + gap),
      behavior: reduced ? "auto" : "smooth",
    });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      scrollByCard(1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      scrollByCard(-1);
    }
  };

  return (
    <section id="plates" className="plates" aria-labelledby="plates-title">
      <div className="plates-head">
        <div>
          <p className="index-no">03 — Plates</p>
          <h2 id="plates-title" className="section-title">
            Prints from the drawer
          </h2>
          <p className="intro">
            The room never trusted a lens in wet air. These are the plates:
            contour, current, staff, and the jars from the sill.
          </p>
        </div>
        <div className="plate-nav">
          <button
            type="button"
            onClick={() => scrollByCard(-1)}
            disabled={atStart}
          >
            Previous
          </button>
          <button type="button" onClick={() => scrollByCard(1)} disabled={atEnd}>
            Next
          </button>
        </div>
      </div>
      <div
        ref={scrollerRef}
        className="plate-row"
        tabIndex={0}
        aria-label="Field plates"
        onScroll={sync}
        onKeyDown={onKeyDown}
      >
        {PLATES.map((plate) => (
          <figure key={plate.id} className="plate">
            <PlateArt id={plate.id} />
            <figcaption>
              <p className="plate-id">
                {plate.id} · {plate.year}
              </p>
              <p className="plate-title">{plate.title}</p>
              <p className="plate-copy">{plate.copy}</p>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

function PlateArt({ id }: { id: string }) {
  if (id === "01") {
    return (
      <svg viewBox="0 0 320 380" aria-hidden="true">
        <rect width="320" height="380" fill="#d7e6f3" />
        {[0, 18, 36, 54, 72].map((offset) => (
          <path
            key={offset}
            d={`M 30 ${210 + offset} C 90 ${120 + offset * 0.3}, 140 ${150 - offset * 0.2}, 190 ${200 + offset * 0.4} S 280 ${250 + offset}, 300 ${230 + offset}`}
            fill="none"
            stroke="#173e72"
            strokeWidth={offset === 0 ? 2.4 : 1.1}
            opacity={1 - offset / 110}
          />
        ))}
        <circle cx="168" cy="168" r="4" fill="#173e72" />
        <text x="24" y="40" fill="#173e72" fontSize="14" fontFamily="IBM Plex Mono, monospace">
          N-04
        </text>
      </svg>
    );
  }

  if (id === "02") {
    const ticks = Array.from({ length: 24 }, (_, index) => {
      const angle = (index / 24) * Math.PI * 2;
      const inner = index % 6 === 0 ? 78 : 96;
      return {
        x1: 160 + Math.cos(angle) * inner,
        y1: 200 + Math.sin(angle) * inner,
        x2: 160 + Math.cos(angle) * 112,
        y2: 200 + Math.sin(angle) * 112,
      };
    });
    return (
      <svg viewBox="0 0 320 380" aria-hidden="true">
        <rect width="320" height="380" fill="#d7e6f3" />
        <circle cx="160" cy="200" r="112" fill="none" stroke="#173e72" strokeWidth="1.4" />
        {ticks.map((tick) => (
          <line key={`${tick.x2}-${tick.y2}`} {...tick} stroke="#173e72" strokeWidth="1.2" />
        ))}
        <path d="M160 200 L108 262 L86 214 Z" fill="#173e72" opacity="0.85" />
        <text x="24" y="40" fill="#173e72" fontSize="14" fontFamily="IBM Plex Mono, monospace">
          EBB SW
        </text>
      </svg>
    );
  }

  if (id === "03") {
    return (
      <svg viewBox="0 0 320 380" aria-hidden="true">
        <rect width="320" height="380" fill="#d7e6f3" />
        <rect x="146" y="48" width="28" height="290" fill="none" stroke="#173e72" strokeWidth="1.6" />
        <rect x="147" y="210" width="26" height="128" fill="#173e72" opacity="0.85" />
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((mark) => (
          <g key={mark}>
            <line
              x1="146"
              x2={mark % 2 === 0 ? 118 : 130}
              y1={62 + mark * 32}
              y2={62 + mark * 32}
              stroke="#173e72"
              strokeWidth="1.4"
            />
            {mark % 2 === 0 ? (
              <text
                x="78"
                y={68 + mark * 32}
                fill="#173e72"
                fontSize="13"
                fontFamily="IBM Plex Mono, monospace"
              >
                {8 - mark}
              </text>
            ) : null}
          </g>
        ))}
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 320 380" aria-hidden="true">
      <rect width="320" height="380" fill="#d7e6f3" />
      {[0, 1, 2, 3, 4, 5].map((jar) => {
        const column = jar % 3;
        const row = Math.floor(jar / 3);
        const x = 48 + column * 86;
        const y = 78 + row * 140;
        const level = [0.35, 0.48, 0.62, 0.7, 0.84, 0.95][jar];
        return (
          <g key={jar}>
            <rect x={x} y={y} width="58" height="96" fill="none" stroke="#173e72" strokeWidth="1.5" />
            <rect
              x={x + 1}
              y={y + 96 - 90 * level}
              width="56"
              height={90 * level}
              fill="#173e72"
              opacity={0.35 + level * 0.6}
            />
            <text
              x={x}
              y={y + 116}
              fill="#173e72"
              fontSize="13"
              fontFamily="IBM Plex Mono, monospace"
            >
              S{jar + 1}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
