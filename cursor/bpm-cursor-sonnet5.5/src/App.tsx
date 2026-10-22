import { useEffect, useState } from "react";
import { ScrollSmoother, ScrollTrigger, useGSAP } from "./gsap-setup.ts";
import { scrollState } from "./motion-state.ts";
import { Cursor, Nav, ScrollBead } from "./components/Chrome.tsx";
import Hero from "./components/Hero.tsx";
import Marquee from "./components/Marquee.tsx";
import Manifesto from "./components/Manifesto.tsx";
import MassPit from "./components/MassPit.tsx";
import Principles from "./components/Principles.tsx";
import Tuner from "./components/Tuner.tsx";
import Index from "./components/Index.tsx";
import Footer from "./components/Footer.tsx";

export default function App() {
  const [smoothed, setSmoothed] = useState(false);
  const [fontsOk, setFontsOk] = useState(false);
  const ready = smoothed && fontsOk;

  // Sections measure text, so they mount only once the real fonts are in (or after a short timeout).
  useEffect(() => {
    const go = () => setFontsOk(true);
    Promise.all([
      document.fonts.load('800 1em "Bricolage Grotesque"'),
      document.fonts.load('400 1em "Bricolage Grotesque"'),
      document.fonts.load('500 1em "JetBrains Mono"'),
    ]).then(go, go);
    const t = window.setTimeout(go, 3000);
    return () => window.clearTimeout(t);
  }, []);

  // The smoother must exist before any ScrollTrigger is created, so sections mount after it.
  useGSAP(() => {
    const smoother = ScrollSmoother.create({
      wrapper: "#smooth-wrapper",
      content: "#smooth-content",
      smooth: 1.25,
      effects: true,
      normalizeScroll: false,
    });
    scrollState.smoother = smoother;
    setSmoothed(true);
    return () => {
      scrollState.smoother = null;
      smoother.kill();
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const refresh = () => ScrollTrigger.refresh();
    document.fonts.ready.then(refresh);
    const t = window.setTimeout(refresh, 600);
    return () => window.clearTimeout(t);
  }, [ready]);

  return (
    <>
      <Cursor />
      <Nav />
      <ScrollBead />
      <div id="smooth-wrapper">
        <div id="smooth-content">
          {ready && (
            <main>
              <Hero />
              <Marquee />
              <Manifesto />
              <MassPit />
              <Principles />
              <Tuner />
              <Index />
              <Footer />
            </main>
          )}
        </div>
      </div>
    </>
  );
}
