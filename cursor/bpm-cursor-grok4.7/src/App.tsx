import { useRef, useState } from "react";
import { ChartRoom, type ChartHandle } from "./components/ChartRoom.tsx";
import { Colophon } from "./components/Colophon.tsx";
import { Ledger } from "./components/Ledger.tsx";
import { Plates } from "./components/Plates.tsx";
import { SiteChrome } from "./components/SiteChrome.tsx";
import { Stations } from "./components/Stations.tsx";
import type { EpochId, Station, Unit } from "./survey.ts";

export default function App() {
  const chartRef = useRef<ChartHandle>(null);
  const [epoch, setEpoch] = useState<EpochId>("1974");
  const [unit, setUnit] = useState<Unit>("m");
  const [selectedId, setSelectedId] = useState<string | null>("n04");

  const showStation = (station: Station, drop: boolean) => {
    setSelectedId(station.id);
    const visible = chartRef.current?.isVisible() ?? false;
    chartRef.current?.moveTo(station.x, drop && visible);
    if (!visible) chartRef.current?.reveal();
  };

  return (
    <>
      <SiteChrome />
      <main>
        <ChartRoom
          ref={chartRef}
          epoch={epoch}
          unit={unit}
          onUnit={setUnit}
          onEpoch={setEpoch}
          onStation={setSelectedId}
        />
        <Stations
          epoch={epoch}
          unit={unit}
          selectedId={selectedId}
          onPick={(station) => showStation(station, true)}
        />
        <Plates />
        <Ledger epoch={epoch} unit={unit} onShow={(station) => showStation(station, true)} />
        <Colophon />
      </main>
    </>
  );
}
