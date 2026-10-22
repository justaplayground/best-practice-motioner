import { Fragment, useRef } from "react";
import { Draggable, InertiaPlugin, gsap, useGSAP } from "../gsap-setup.ts";

// "*...*" marks the emphasised run
const WORDS = (
  "Most interfaces are weightless. They appear, they vanish, they never push back. " +
  "We build the other kind: surfaces you *throw*, strings you *pluck*, buttons that *lean* toward your hand. " +
  "Motion isn't decoration. It's *how a thing tells you what it is*."
)
  .split("*")
  .flatMap((seg, i, segs) =>
    [...seg.matchAll(/(\s*)(\S+)/g)].map<[string, boolean, boolean]>((m, j) => [
      m[2],
      i % 2 === 1,
      // no space before a token that touches the previous segment (e.g. the comma after *throw*)
      j === 0 && i > 0 && m[1] === "" && !/\s$/.test(segs[i - 1]),
    ]),
  );

const STICKERS = [
  { cls: "sticker--badge", text: "drag · throw · drag · throw ·", style: { right: "7%", top: "9%" } },
  { cls: "sticker--tag", text: "m = 3.2 kg", style: { right: "4%", top: "46%" } },
  { cls: "sticker--pill", text: "↯ inertia", style: { left: "10%", bottom: "7%" } },
  { cls: "sticker--tag sticker--cobalt", text: "k = 240 N/m", style: { right: "22%", bottom: "9%" } },
];

export default function Manifesto() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      // 1 — word-by-word reveal, scrubbed by scroll
      gsap.fromTo(
        ".mw",
        { opacity: 0.1, y: 36, rotation: 2.5 },
        {
          opacity: 1,
          y: 0,
          rotation: 0,
          ease: "power3.out",
          stagger: 0.12,
          scrollTrigger: { trigger: ".manifesto__text", start: "top 78%", end: "bottom 55%", scrub: true },
        },
      );

      // 2 — stickers: throwable, with elastic edges and a lean that follows their speed
      gsap.utils.toArray<HTMLElement>(".sticker").forEach((el) => {
        const inner = el.firstElementChild as HTMLElement;
        const lean = (vx: number) =>
          gsap.to(inner, { rotation: gsap.utils.clamp(-28, 28, vx / 36), duration: 0.25, ease: "power2.out", overwrite: true });
        const settle = () =>
          gsap.to(inner, { rotation: 0, duration: 1.6, ease: "elastic.out(1, 0.25)", overwrite: true });
        Draggable.create(el, {
          type: "x,y",
          bounds: root.current!,
          inertia: true,
          edgeResistance: 0.7,
          dragResistance: 0,
          onPress: () => void gsap.to(inner, { scale: 1.12, duration: 0.5, ease: "elastic.out(1, 0.4)" }),
          onDrag: () => void lean(InertiaPlugin.getVelocity(el, "x")),
          onThrowUpdate: () => void lean(InertiaPlugin.getVelocity(el, "x")),
          onRelease: () => void gsap.to(inner, { scale: 1, duration: 0.9, ease: "elastic.out(1, 0.35)" }),
          onThrowComplete: settle,
        });
        // idle drift so they feel suspended, not parked
        gsap.to(inner, {
          y: "+=8",
          duration: gsap.utils.random(2.2, 3.4),
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
        });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} className="manifesto" id="manifesto">
      <p className="eyebrow">01 — Position</p>
      <p className="manifesto__text">
        {WORDS.map(([w, em, glue], i) => (
          <Fragment key={i}>
            {i > 0 && !glue && " "}
            <span className={`mw${em ? " mw--em" : ""}`}>{w}</span>
          </Fragment>
        ))}
      </p>

      {STICKERS.map((s) => (
        <div key={s.text} className={`sticker ${s.cls}`} style={s.style} data-cursor="grab">
          <div className="sticker__in">
            <span>{s.text}</span>
          </div>
        </div>
      ))}
    </section>
  );
}
