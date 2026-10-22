import { useEffect, useState } from "react";
import { deskTide } from "../survey.ts";

export function Colophon() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const tide = deskTide(now);
  const clock = now.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <footer className="colophon" aria-labelledby="colophon-title">
      <div className="band-inner colophon-grid">
        <div>
          <p className="index-no">05 — Colophon</p>
          <h2 id="colophon-title" className="section-title">
            The room keeps the sheet
          </h2>
          <p className="intro">
            Wharf Lane 7, Port of Halcyon. Figures on this transect are a
            composed model for the room. They are not for navigation.
          </p>
        </div>
        <dl className="colophon-facts">
          <div>
            <dt>Desk time</dt>
            <dd>{clock}</dd>
          </div>
          <div>
            <dt>Desk tide</dt>
            <dd>{tide.toFixed(2)} m</dd>
          </div>
          <div>
            <dt>Bearing</dt>
            <dd>214°</dd>
          </div>
          <div>
            <dt>Transect</dt>
            <dd>2.40 km</dd>
          </div>
        </dl>
      </div>
      <p className="colophon-note">
        Desk tide is a clock estimate with a 12.4-hour period, so the room has
        a pulse. It is not a prediction for any harbor.
      </p>
    </footer>
  );
}
