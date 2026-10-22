import {
  STATIONS,
  depthAt,
  formatDelta,
  formatDepth,
  type EpochId,
  type Station,
  type Unit,
} from "../survey.ts";

type Props = {
  epoch: EpochId;
  unit: Unit;
  selectedId: string | null;
  onPick: (station: Station) => void;
};

export function Stations({ epoch, unit, selectedId, onPick }: Props) {
  return (
    <section id="stations" className="band" aria-labelledby="stations-title">
      <div className="band-inner">
        <p className="index-no">02 — Stations</p>
        <h2 id="stations-title" className="section-title">
          Four marks on the line
        </h2>
        <p className="intro">
          Transect A runs 2.4 kilometers on bearing 214°. Choose a mark to drop
          the lead on the current sheet.
        </p>
        <div className="station-list">
          {STATIONS.map((station) => {
            const depth = depthAt(epoch, station.x);
            const delta = depth - depthAt("1974", station.x);
            return (
              <button
                key={station.id}
                type="button"
                className="station"
                aria-pressed={selectedId === station.id}
                onClick={() => onPick(station)}
              >
                <span className="station-code">{station.code}</span>
                <span className="station-name">{station.name}</span>
                <span className="station-depth">{formatDepth(depth, unit)}</span>
                <span className="station-delta">
                  {epoch === "1974" ? "Baseline" : `${formatDelta(delta, unit)} since 1974`}
                </span>
                <span className="station-note">{station.note}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
