import {
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type Ref,
} from "react";
import { gsap, ScrollTrigger, useGSAP } from "../gsap-setup.ts";
import { useMedia } from "../useMedia.ts";
import {
  CHART_H,
  CHART_W,
  EPOCHS,
  PROGRESS,
  PX_PER_M,
  STATIONS,
  bedAtProgress,
  bedName,
  clamp,
  depthMeters,
  epochFromProgress,
  formatDepth,
  formatKm,
  miniPoints,
  nearestStation,
  wavePath,
  type EpochId,
  type Unit,
} from "../survey.ts";

export type ChartHandle = {
  moveTo: (x: number, drop?: boolean) => void;
  reveal: () => void;
  isVisible: () => boolean;
};

type Props = {
  ref?: Ref<ChartHandle | null>;
  epoch: EpochId;
  unit: Unit;
  onUnit: (unit: Unit) => void;
  onEpoch: (epoch: EpochId) => void;
  onStation: (id: string | null) => void;
};

const WAVES = [
  wavePath(28, 5, 0.018),
  wavePath(58, 8, 0.012),
  wavePath(96, 6, 0.02),
];

export function ChartRoom({
  ref,
  epoch,
  unit,
  onUnit,
  onEpoch,
  onStation,
}: Props) {
  const rootRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const clipRef = useRef<SVGRectElement>(null);
  const tideLineRef = useRef<SVGLineElement>(null);
  const tideGroupRef = useRef<SVGGElement>(null);
  const ghostRef = useRef<SVGPathElement>(null);
  const leadRef = useRef<SVGGElement>(null);
  const leadLineRef = useRef<SVGLineElement>(null);
  const haloRef = useRef<SVGLineElement>(null);
  const weightRef = useRef<SVGCircleElement>(null);
  const dotRef = useRef<SVGCircleElement>(null);
  const progressRailRef = useRef<HTMLSpanElement>(null);
  const depthRef = useRef<HTMLSpanElement>(null);
  const kmRef = useRef<HTMLElement>(null);
  const bedRef = useRef<HTMLElement>(null);
  const nearRef = useRef<HTMLElement>(null);
  const markRef = useRef<SVGGElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const switchRef = useRef<gsap.core.Timeline | null>(null);
  const xRef = useRef(STATIONS[0].x);
  const progressRef = useRef(0);
  const epochRef = useRef(epoch);
  const unitRef = useRef(unit);
  const stationRef = useRef<string | null>(STATIONS[0].id);
  const readingRef = useRef("");
  const dropLock = useRef(false);
  const dragRef = useRef<{
    id: number;
    x: number;
    y: number;
    active: boolean;
  } | null>(null);
  const placeLeadRef = useRef<(x: number, drop: boolean) => void>(() => {});
  const onEpochRef = useRef(onEpoch);
  const onStationRef = useRef(onStation);

  const reduced = useMedia("(prefers-reduced-motion: reduce)");
  const narrow = useMedia("(max-width: 759px)");
  // Phones skip the pinned scroll. Reduced motion only drops the looping
  // wave — the tide itself is the page, and it has to move when you scroll.
  const staticMode = narrow;
  const reducedRef = useRef(reduced);
  const staticRef = useRef(staticMode);

  const [copyMsg, setCopyMsg] = useState("");
  const [announcement, setAnnouncement] = useState(
    "Lead at North Spit. Use the arrow keys to sound along the transect.",
  );

  const currentTide = () => {
    const raw = tideGroupRef.current
      ? Number(gsap.getProperty(tideGroupRef.current, "y"))
      : NaN;
    if (Number.isFinite(raw) && raw > 20) return raw;
    return EPOCHS.find((item) => item.id === epochRef.current)?.tide ?? 248;
  };

  const placeLead = (x: number, drop: boolean) => {
    const clamped = clamp(x, 16, CHART_W - 16);
    xRef.current = clamped;
    const tide = currentTide();
    const floor = bedAtProgress(progressRef.current, clamped);
    const depth = depthMeters(floor, tide);
    const km = formatKm(clamped);
    const bed = bedName(depth, epochRef.current);
    const nearest = nearestStation(clamped);
    const depthLabel = formatDepth(depth, unitRef.current);
    const sheet = epochRef.current;

    readingRef.current = `Chart Room 19, sheet ${sheet}. ${km} along the transect, ${depthLabel}, ${bed}. Nearest mark: ${nearest.label}.`;

    if (depthRef.current) depthRef.current.textContent = depthLabel;
    if (kmRef.current) kmRef.current.textContent = km;
    if (bedRef.current) bedRef.current.textContent = bed;
    if (nearRef.current) nearRef.current.textContent = nearest.label;

    const frame = frameRef.current;
    if (frame) {
      frame.setAttribute(
        "aria-valuenow",
        String(Math.round((clamped / CHART_W) * 240)),
      );
      frame.setAttribute("aria-valuetext", readingRef.current);
    }

    gsap.set(leadRef.current, { x: clamped });
    const animate = drop;
    if (animate) {
      dropLock.current = true;
      gsap.fromTo(
        weightRef.current,
        { attr: { cy: tide } },
        {
          attr: { cy: floor },
          duration: 0.9,
          ease: "power3.out",
          overwrite: "auto",
          onComplete: () => {
            dropLock.current = false;
          },
        },
      );
      gsap.fromTo(
        [leadLineRef.current, haloRef.current],
        { attr: { y1: tide, y2: tide } },
        {
          attr: { y1: tide, y2: floor },
          duration: 0.9,
          ease: "power3.out",
          overwrite: "auto",
        },
      );
    } else {
      gsap.set(weightRef.current, { attr: { cy: floor } });
      gsap.set([leadLineRef.current, haloRef.current], {
        attr: { y1: tide, y2: floor },
      });
    }

    const dotX = (clamped / CHART_W) * 280;
    const dotY = ((floor - 180) / 520) * 62 + 4;
    dotRef.current?.setAttribute("cx", String(dotX));
    dotRef.current?.setAttribute("cy", String(dotY));

    rootRef.current?.querySelectorAll<SVGTextElement>(".staff-label").forEach((node) => {
      const meters = Number(node.dataset.m);
      node.textContent =
        unitRef.current === "fth" ? (meters / 1.8288).toFixed(1) : String(meters);
    });
    const unitLabel = rootRef.current?.querySelector(".staff-unit");
    if (unitLabel) unitLabel.textContent = unitRef.current === "fth" ? "fth" : "m";

    const reported = nearest.station?.id ?? null;
    if (reported !== stationRef.current && !drop) {
      stationRef.current = reported;
      onStationRef.current(reported);
    }

    const chosen = STATIONS.find((item) => item.id === stationRef.current);
    if (markRef.current) {
      if (!chosen) gsap.set(markRef.current, { autoAlpha: 0 });
      else {
        gsap.set(markRef.current, {
          x: chosen.x,
          y: bedAtProgress(progressRef.current, chosen.x),
          autoAlpha: 1,
        });
      }
    }
  };

  useLayoutEffect(() => {
    epochRef.current = epoch;
    unitRef.current = unit;
    reducedRef.current = reduced;
    staticRef.current = staticMode;
    onEpochRef.current = onEpoch;
    onStationRef.current = onStation;
    placeLeadRef.current = placeLead;
  });

  const applyStatic = (id: EpochId, animate: boolean) => {
    const next = EPOCHS.find((item) => item.id === id) ?? EPOCHS[0];
    const target = PROGRESS[id];
    const floors = rootRef.current?.querySelectorAll<SVGGElement>(".floor");
    switchRef.current?.kill();

    const paint = (progress: number, tide: number) => {
      progressRef.current = progress;
      gsap.set(tideGroupRef.current, { y: tide });
      gsap.set(tideLineRef.current, { y: tide });
      gsap.set(clipRef.current, { attr: { y: tide, height: CHART_H - tide } });
      placeLeadRef.current(xRef.current, false);
    };

    if (!animate) {
      floors?.forEach((el) => {
        gsap.set(el, { autoAlpha: el.dataset.epoch === id ? 1 : 0 });
      });
      gsap.set(ghostRef.current, { autoAlpha: id === "1974" ? 0 : 1 });
      paint(target, next.tide);
      return;
    }

    const proxy = { p: progressRef.current };
    const timeline = gsap.timeline({ defaults: { ease: "power2.inOut" } });
    switchRef.current = timeline;
    timeline.to(tideGroupRef.current, { y: next.tide, duration: 0.85 }, 0);
    timeline.to(tideLineRef.current, { y: next.tide, duration: 0.85 }, 0);
    timeline.to(
      clipRef.current,
      { attr: { y: next.tide, height: CHART_H - next.tide }, duration: 0.85 },
      0,
    );
    floors?.forEach((el) => {
      timeline.to(
        el,
        { autoAlpha: el.dataset.epoch === id ? 1 : 0, duration: 0.45 },
        0,
      );
    });
    timeline.to(
      ghostRef.current,
      { autoAlpha: id === "1974" ? 0 : 1, duration: 0.4 },
      0,
    );
    timeline.to(
      proxy,
      {
        p: target,
        duration: 0.85,
        onUpdate: () => {
          progressRef.current = proxy.p;
          placeLeadRef.current(xRef.current, false);
        },
      },
      0,
    );
  };

  useGSAP(
    () => {
      const first = EPOCHS[0];
      gsap.set(tideGroupRef.current, { y: first.tide });
      gsap.set(tideLineRef.current, { y: first.tide });
      gsap.set(clipRef.current, {
        attr: { y: first.tide, height: CHART_H - first.tide },
      });
      gsap.set(".floor", { autoAlpha: 0 });
      gsap.set('.floor[data-epoch="1974"]', { autoAlpha: 1 });
      gsap.set(ghostRef.current, { autoAlpha: 0 });
      gsap.set(progressRailRef.current, { scaleY: 0, transformOrigin: "top center" });
      progressRef.current = 0;

      const firstLine = rootRef.current?.querySelector<SVGPathElement>(
        '.floor[data-epoch="1974"] .floor-line',
      );
      if (firstLine) {
        const length = firstLine.getTotalLength();
        gsap.fromTo(
          firstLine,
          { strokeDasharray: length, strokeDashoffset: length },
          {
            strokeDashoffset: 0,
            duration: 1.7,
            ease: "power2.inOut",
            onComplete: () => {
              gsap.set(firstLine, { clearProps: "strokeDasharray,strokeDashoffset" });
            },
          },
        );
      }

      if (!reducedRef.current) {
        gsap.to(".waves", {
          x: -48,
          duration: 6,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
      }

      if (staticRef.current) {
        applyStatic(epochRef.current, false);
        return () => {
          switchRef.current?.kill();
          timelineRef.current = null;
        };
      }

      const timeline = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: rootRef.current,
          start: "top top",
          end: "+=200%",
          pin: true,
          scrub: 0.55,
          anticipatePin: 1,
          onUpdate: (self) => {
            progressRef.current = self.progress;
            const id = epochFromProgress(self.progress);
            if (id !== epochRef.current) {
              epochRef.current = id;
              onEpochRef.current(id);
            }
            placeLeadRef.current(xRef.current, false);
          },
        },
      });

      timeline.to(progressRailRef.current, { scaleY: 1, duration: 1 }, 0);
      timeline.to(
        clipRef.current,
        { attr: { y: EPOCHS[1].tide, height: CHART_H - EPOCHS[1].tide }, duration: 0.26 },
        0.2,
      );
      timeline.to(
        clipRef.current,
        { attr: { y: EPOCHS[2].tide, height: CHART_H - EPOCHS[2].tide }, duration: 0.26 },
        0.62,
      );
      timeline.to(tideLineRef.current, { y: EPOCHS[1].tide, duration: 0.26 }, 0.2);
      timeline.to(tideLineRef.current, { y: EPOCHS[2].tide, duration: 0.26 }, 0.62);
      timeline.to(tideGroupRef.current, { y: EPOCHS[1].tide, duration: 0.26 }, 0.2);
      timeline.to(tideGroupRef.current, { y: EPOCHS[2].tide, duration: 0.26 }, 0.62);
      timeline.to('.floor[data-epoch="1974"]', { autoAlpha: 0, duration: 0.16 }, 0.34);
      timeline.to('.floor[data-epoch="1998"]', { autoAlpha: 1, duration: 0.16 }, 0.34);
      timeline.to('.floor[data-epoch="1998"]', { autoAlpha: 0, duration: 0.16 }, 0.7);
      timeline.to('.floor[data-epoch="2026"]', { autoAlpha: 1, duration: 0.16 }, 0.7);
      timeline.to(ghostRef.current, { autoAlpha: 1, duration: 0.12 }, 0.36);
      timeline.to(".scroll-cue", { autoAlpha: 0, duration: 0.12 }, 0.05);
      timeline.addLabel("1974", 0.02);
      timeline.addLabel("1998", 0.52);
      timeline.addLabel("2026", 0.92);

      timelineRef.current = timeline;
      const progress = timeline.scrollTrigger?.progress ?? 0;
      progressRef.current = progress;
      const id = epochFromProgress(progress);
      if (id !== epochRef.current) {
        epochRef.current = id;
        onEpochRef.current(id);
      }
      placeLeadRef.current(xRef.current, false);

      document.fonts?.ready.then(() => ScrollTrigger.refresh());

      return () => {
        switchRef.current?.kill();
        timelineRef.current = null;
      };
    },
    { scope: rootRef, dependencies: [staticMode], revertOnUpdate: true },
  );

  useLayoutEffect(() => {
    if (dropLock.current) return;
    placeLeadRef.current(xRef.current, false);
  }, [epoch, unit]);

  useImperativeHandle(
    ref,
    () => ({
      moveTo(x: number, drop = false) {
        const station = nearestStation(x).station;
        stationRef.current = station && Math.abs(station.x - x) < 8 ? station.id : stationRef.current;
        placeLeadRef.current(x, drop);
      },
      reveal() {
        const timeline = timelineRef.current;
        const trigger = timeline?.scrollTrigger;
        const behavior = reducedRef.current ? "auto" : "smooth";
        if (!trigger || !timeline) {
          rootRef.current?.scrollIntoView({ behavior, block: "start" });
          return;
        }
        const time = timeline.labels[epochRef.current] ?? 0;
        const ratio = timeline.duration() ? time / timeline.duration() : 0;
        const top = trigger.start + (trigger.end - trigger.start) * ratio;
        window.scrollTo({ top, behavior });
      },
      isVisible() {
        const rect = rootRef.current?.getBoundingClientRect();
        if (!rect) return false;
        return rect.top < window.innerHeight * 0.4 && rect.bottom > window.innerHeight * 0.6;
      },
    }),
    [],
  );

  const svgX = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return xRef.current;
    const point = svg.createSVGPoint();
    point.x = clientX;
    point.y = clientY;
    const matrix = svg.getScreenCTM();
    if (!matrix) return xRef.current;
    return point.matrixTransform(matrix.inverse()).x;
  };

  const announce = () => setAnnouncement(readingRef.current);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse") {
      placeLead(svgX(event.clientX, event.clientY), false);
      return;
    }
    dragRef.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      active: false,
    };
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse") {
      placeLead(svgX(event.clientX, event.clientY), false);
      return;
    }
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (!drag.active) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        dragRef.current = null;
        return;
      }
      drag.active = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    placeLead(svgX(event.clientX, event.clientY), false);
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (event.pointerType !== "mouse" && drag && !drag.active) {
      placeLead(svgX(event.clientX, event.clientY), false);
    }
    dragRef.current = null;
    announce();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 100 : 24;
    let next = xRef.current;
    if (event.key === "ArrowRight") next += step;
    else if (event.key === "ArrowLeft") next -= step;
    else if (event.key === "PageDown") next += 160;
    else if (event.key === "PageUp") next -= 160;
    else if (event.key === "Home") next = 16;
    else if (event.key === "End") next = CHART_W - 16;
    else return;
    event.preventDefault();
    placeLead(next, false);
    announce();
  };

  const chooseEpoch = (id: EpochId) => {
    const timeline = timelineRef.current;
    const trigger = timeline?.scrollTrigger;
    if (!staticMode && trigger && timeline) {
      const time = timeline.labels[id] ?? 0;
      const ratio = timeline.duration() ? time / timeline.duration() : 0;
      window.scrollTo({
        top: trigger.start + (trigger.end - trigger.start) * ratio,
        behavior: reduced ? "auto" : "smooth",
      });
      return;
    }
    epochRef.current = id;
    onEpoch(id);
    applyStatic(id, true);
  };

  const copyReading = async () => {
    try {
      await navigator.clipboard.writeText(readingRef.current);
      setCopyMsg("Copied to the clipboard.");
    } catch {
      setCopyMsg("Clipboard blocked. Copy the figures from the card.");
    }
    window.setTimeout(() => setCopyMsg(""), 2400);
  };

  const active = EPOCHS.find((item) => item.id === epoch) ?? EPOCHS[0];

  return (
    <section
      id="chart"
      ref={rootRef}
      className="chart-room"
      data-static={staticMode ? "true" : "false"}
      aria-labelledby="chart-title"
    >
      <div className="chart-inner">
        <div className="mast">
          <p className="kicker">
            <span>Chart Room 19</span>
            <span>Port of Halcyon</span>
          </p>
          <div className="epoch-switch" role="group" aria-label="Survey year">
            {EPOCHS.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={epoch === item.id}
                onClick={() => chooseEpoch(item.id)}
              >
                <span className="epoch-year">{item.year}</span>
                <span className="epoch-note">{item.title}</span>
              </button>
            ))}
          </div>
        </div>

        <h1 id="chart-title" className="hero-title">
          Sounding
        </h1>
        <p className="lede">The shore keeps a different memory than the map.</p>

        <div className="chart-body">
          <div
            ref={frameRef}
            className="chart-frame"
            role="slider"
            tabIndex={0}
            aria-label="Sounding lead along the transect"
            aria-valuemin={0}
            aria-valuemax={240}
            aria-describedby="chart-help"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onKeyDown={onKeyDown}
          >
            <div className="chart-meta" aria-hidden="true">
              <span>Transect A · 214°</span>
              <span>Not for navigation</span>
            </div>
            <svg
              ref={svgRef}
              className="chart-svg"
              viewBox={`0 110 ${CHART_W} 580`}
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8ec9cc" />
                  <stop offset="42%" stopColor="#1d6770" />
                  <stop offset="100%" stopColor="#0c2f34" />
                </linearGradient>
                <pattern id="sandHatch" width="10" height="7" patternUnits="userSpaceOnUse">
                  <line x1="0" y1="6" x2="10" y2="6" stroke="#c6a56d" strokeWidth="1" />
                </pattern>
                <clipPath id="tideClip">
                  <rect ref={clipRef} x="0" width={CHART_W} />
                </clipPath>
              </defs>

              <rect className="chart-paper" width={CHART_W} height={CHART_H} />
              <g clipPath="url(#tideClip)">
                <rect width={CHART_W} height={CHART_H} fill="url(#waterGrad)" />
                <g className="waves">
                  {WAVES.map((path) => (
                    <path key={path} d={path} className="wave" />
                  ))}
                </g>
              </g>
              <g className="grid">
                {Array.from({ length: 13 }, (_, index) => (
                  <line
                    key={`v-${index}`}
                    x1={index * 100}
                    x2={index * 100}
                    y1="0"
                    y2={CHART_H}
                    className="grid-line"
                  />
                ))}
                {Array.from({ length: 8 }, (_, index) => (
                  <line
                    key={`h-${index}`}
                    y1={index * 100}
                    y2={index * 100}
                    x1="0"
                    x2={CHART_W}
                    className="grid-line"
                  />
                ))}
              </g>
              <line ref={tideLineRef} x1="0" x2={CHART_W} className="tide-line" />
              <path ref={ghostRef} d={EPOCHS[0].line} className="ghost-line" />
              {EPOCHS.map((item) => (
                <g key={item.id} className="floor" data-epoch={item.id}>
                  <path d={item.fill} className="floor-fill" />
                  <path d={item.fill} className="floor-hatch" fill="url(#sandHatch)" />
                  <g clipPath="url(#tideClip)">
                    <path d={item.line} className="contour" transform="translate(0 -34)" />
                    <path d={item.line} className="contour contour-b" transform="translate(0 -68)" />
                  </g>
                  <path d={item.line} className="floor-line" />
                  {STATIONS.map((station) => {
                    const y = bedAtProgress(PROGRESS[item.id], station.x);
                    return (
                      <g key={station.id} className="station-mark">
                        <line x1={station.x} x2={station.x} y1={y} y2={y + 14} />
                        <text x={station.x} y={y + 32} textAnchor="middle">
                          {station.code}
                        </text>
                      </g>
                    );
                  })}
                </g>
              ))}
              <g ref={tideGroupRef} className="tide-staff">
                <text x="20" y="-12" className="staff-unit">
                  m
                </text>
                {[2, 5, 8].map((meters) => (
                  <g key={meters}>
                    <line
                      x1="16"
                      x2="34"
                      y1={meters * PX_PER_M}
                      y2={meters * PX_PER_M}
                      className="staff-tick"
                    />
                    <text
                      className="staff-label"
                      data-m={meters}
                      x="40"
                      y={meters * PX_PER_M + 5}
                    >
                      {meters}
                    </text>
                  </g>
                ))}
              </g>
              <g ref={leadRef} className="lead">
                <line ref={haloRef} x1="0" x2="0" className="lead-halo" />
                <line ref={leadLineRef} x1="0" x2="0" className="lead-core" />
                <circle ref={weightRef} r="8" className="lead-weight" />
              </g>
              <g ref={markRef} className="survey-pin">
                <rect x="-5" y="-5" width="10" height="10" transform="rotate(45)" />
              </g>
              <text x="16" y="668" className="chart-label">
                0
              </text>
              <text x="300" y="668" textAnchor="middle" className="chart-label">
                0.6
              </text>
              <text x="600" y="668" textAnchor="middle" className="chart-label">
                1.2
              </text>
              <text x="900" y="668" textAnchor="middle" className="chart-label">
                1.8
              </text>
              <text x="1184" y="668" textAnchor="end" className="chart-label">
                2.4 km
              </text>
            </svg>
            <div className="sheet-progress" aria-hidden="true">
              <span ref={progressRailRef} />
            </div>
          </div>

          <aside className="field-card" aria-label="Sounding readout">
            <div className="card-top">
              <p className="kicker">Lead</p>
              <div className="unit-switch" role="group" aria-label="Depth unit">
                <button
                  type="button"
                  aria-pressed={unit === "m"}
                  onClick={() => onUnit("m")}
                >
                  m
                </button>
                <button
                  type="button"
                  aria-pressed={unit === "fth"}
                  onClick={() => onUnit("fth")}
                >
                  fth
                </button>
              </div>
            </div>
            <p className="card-depth">
              <span ref={depthRef}>Dry</span>
            </p>
            <dl className="metrics">
              <div>
                <dt>Along</dt>
                <dd ref={kmRef}>0.36 km</dd>
              </div>
              <div>
                <dt>Bed</dt>
                <dd ref={bedRef}>Exposed sand</dd>
              </div>
              <div>
                <dt>Nearest</dt>
                <dd ref={nearRef}>N-04 North Spit</dd>
              </div>
              <div>
                <dt>Sheet</dt>
                <dd>{active.year}</dd>
              </div>
            </dl>
            <svg className="mini" viewBox="0 0 280 70" aria-hidden="true">
              <polyline points={miniPoints(EPOCHS[0].floor)} className="mini-ghost" />
              {epoch !== "1974" ? (
                <polyline points={miniPoints(active.floor)} className="mini-line" />
              ) : null}
              <circle ref={dotRef} r="3.5" className="mini-dot" />
            </svg>
            <button type="button" className="btn btn-ink copy-btn" onClick={copyReading}>
              Copy reading
            </button>
            <p className="copy-status" role="status">
              {copyMsg}
            </p>
          </aside>

          <div className="chart-foot">
            <div className="essays">
              {EPOCHS.map((item) => (
                <div
                  key={item.id}
                  className="essay"
                  data-on={epoch === item.id ? "true" : "false"}
                  aria-hidden={epoch === item.id ? undefined : true}
                >
                  <p className="essay-kicker">
                    {item.year} — {item.title}
                  </p>
                  <p>{item.body}</p>
                </div>
              ))}
            </div>
            <div className="chart-foot-meta">
              <p id="chart-help" className="chart-help">
                {staticMode
                  ? "Choose a year. Drag the transect, or focus it and use the arrow keys."
                  : "Scroll to raise the tide. Drag the transect, or focus it and use the arrow keys."}
                {epoch !== "1974" ? " The dashed line is the 1974 bed." : ""}
              </p>
              <p className="scroll-cue">
                <i />
                Scroll the tide
              </p>
            </div>
          </div>
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </section>
  );
}
