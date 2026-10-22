import { useEffect, useRef } from "react";
import { gsap } from "./gsap-setup.ts";
import { pointer } from "./motion-state.ts";

/**
 * Magnetic field around an element. Inside the field it leans toward the pointer;
 * on exit it is released and rings back to rest on an under-damped elastic.
 */
export function useMagnetic<T extends HTMLElement>(strength = 0.35, pad = 56) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || pointer.coarse) return;
    let inside = false;

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const ox = Number(gsap.getProperty(el, "x")) || 0;
      const oy = Number(gsap.getProperty(el, "y")) || 0;
      const cx = r.left + r.width / 2 - ox;
      const cy = r.top + r.height / 2 - oy;
      const near =
        e.clientX > r.left - pad - ox &&
        e.clientX < r.right + pad - ox &&
        e.clientY > r.top - pad - oy &&
        e.clientY < r.bottom + pad - oy;
      if (near) {
        inside = true;
        gsap.to(el, {
          x: (e.clientX - cx) * strength,
          y: (e.clientY - cy) * strength,
          duration: 0.55,
          ease: "power3.out",
          overwrite: "auto",
        });
      } else if (inside) {
        inside = false;
        gsap.to(el, { x: 0, y: 0, duration: 1.5, ease: "elastic.out(1, 0.26)", overwrite: "auto" });
      }
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      gsap.killTweensOf(el);
    };
  }, [strength, pad]);

  return ref;
}
