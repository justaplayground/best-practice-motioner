import { useEffect, useState } from "react";
import { ScrollTrigger } from "./gsap-setup.ts";
import { SiteChrome } from "./components/SiteChrome.tsx";
import { Hero } from "./components/Hero.tsx";
import { Momentum } from "./components/Momentum.tsx";
import { Calibration } from "./components/Calibration.tsx";
import { Pressure } from "./components/Pressure.tsx";
import { Specimens } from "./components/Specimens.tsx";
import { SignOff } from "./components/SignOff.tsx";

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const go = () => setReady(true);
    Promise.all([
      document.fonts.load('700 1em "Archivo"'),
      document.fonts.load('500 1em "Archivo"'),
      document.fonts.load('500 1em "IBM Plex Mono"'),
    ]).then(go, go);
    const t = window.setTimeout(go, 2500);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const refresh = () => ScrollTrigger.refresh();
    document.fonts.ready.then(refresh);
    const t = window.setTimeout(refresh, 400);
    return () => window.clearTimeout(t);
  }, [ready]);

  return (
    <>
      <SiteChrome />
      {ready && (
        <main>
          <Hero />
          <Momentum />
          <Calibration />
          <Pressure />
          <Specimens />
          <SignOff />
        </main>
      )}
    </>
  );
}
