export const CHART_W = 1200;
export const CHART_H = 700;
export const TRANSECT_KM = 2.4;
export const PX_PER_M = 22;
export const FATHOM = 1.8288;

export const EPOCH_IDS = ["1974", "1998", "2026"] as const;
export type EpochId = (typeof EPOCH_IDS)[number];
export type Unit = "m" | "fth";

export type Pt = { x: number; y: number };

export type Station = {
  id: string;
  code: string;
  name: string;
  x: number;
  note: string;
};

export type Epoch = {
  id: EpochId;
  year: string;
  title: string;
  tide: number;
  body: string;
  floor: Pt[];
  line: string;
  fill: string;
};

const pts = (pairs: [number, number][]): Pt[] =>
  pairs.map(([x, y]) => ({ x, y }));

function segment(points: Pt[], index: number) {
  const p0 = points[Math.max(0, index - 1)];
  const p1 = points[index];
  const p2 = points[index + 1];
  const p3 = points[Math.min(points.length - 1, index + 2)];
  return {
    p1,
    c1x: p1.x + (p2.x - p0.x) / 6,
    c1y: p1.y + (p2.y - p0.y) / 6,
    c2x: p2.x - (p3.x - p1.x) / 6,
    c2y: p2.y - (p3.y - p1.y) / 6,
    p2,
  };
}

function cubic(a: number, b: number, c: number, d: number, t: number) {
  const u = 1 - t;
  return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
}

const round = (value: number) => Math.round(value * 10) / 10;

export function linePath(points: Pt[]) {
  const commands = [`M ${points[0].x} ${points[0].y}`];
  for (let index = 0; index < points.length - 1; index += 1) {
    const curve = segment(points, index);
    commands.push(
      `C ${round(curve.c1x)} ${round(curve.c1y)}, ${round(curve.c2x)} ${round(curve.c2y)}, ${round(curve.p2.x)} ${round(curve.p2.y)}`,
    );
  }
  return commands.join(" ");
}

export function fillPath(points: Pt[]) {
  return `${linePath(points)} L ${CHART_W} ${CHART_H} L 0 ${CHART_H} Z`;
}

export function sampleY(points: Pt[], x: number) {
  if (x <= points[0].x) return points[0].y;
  const last = points[points.length - 1];
  if (x >= last.x) return last.y;

  let index = 0;
  while (index < points.length - 2 && points[index + 1].x < x) index += 1;
  const curve = segment(points, index);
  let low = 0;
  let high = 1;
  for (let step = 0; step < 18; step += 1) {
    const mid = (low + high) / 2;
    const sample = cubic(curve.p1.x, curve.c1x, curve.c2x, curve.p2.x, mid);
    if (sample < x) low = mid;
    else high = mid;
  }
  return cubic(curve.p1.y, curve.c1y, curve.c2y, curve.p2.y, (low + high) / 2);
}

const floors: Record<EpochId, Pt[]> = {
  "1974": pts([
    [0, 400],
    [100, 378],
    [180, 228],
    [260, 252],
    [340, 364],
    [420, 428],
    [500, 456],
    [580, 442],
    [660, 424],
    [740, 452],
    [820, 478],
    [900, 462],
    [980, 436],
    [1060, 454],
    [1140, 468],
    [1200, 460],
  ]),
  "1998": pts([
    [0, 418],
    [100, 436],
    [180, 368],
    [260, 402],
    [340, 468],
    [420, 524],
    [500, 558],
    [580, 542],
    [660, 506],
    [740, 484],
    [820, 498],
    [900, 472],
    [980, 446],
    [1060, 458],
    [1140, 486],
    [1200, 478],
  ]),
  "2026": pts([
    [0, 430],
    [100, 448],
    [180, 424],
    [260, 404],
    [340, 436],
    [430, 498],
    [510, 588],
    [590, 628],
    [670, 636],
    [750, 552],
    [830, 456],
    [910, 434],
    [990, 442],
    [1070, 460],
    [1150, 478],
    [1200, 470],
  ]),
};

const copy: Record<EpochId, { title: string; body: string; tide: number }> = {
  "1974": {
    title: "First sheet",
    tide: 248,
    body: "Low water, June. The north spit still breaks the surface. Packed sand at the elbow, shell beyond the bar.",
  },
  "1998": {
    title: "After the winters",
    tide: 176,
    body: "The spit no longer makes the sheet. The old bearing falls in open water, and the lead comes up dark with silt.",
  },
  "2026": {
    title: "The dredged cut",
    tide: 132,
    body: "A harbor wall holds the edge the tide did not draw. At the sill the lead falls past twenty meters and returns with mud.",
  },
};

export const EPOCHS: Epoch[] = EPOCH_IDS.map((id) => ({
  id,
  year: id,
  title: copy[id].title,
  tide: copy[id].tide,
  body: copy[id].body,
  floor: floors[id],
  line: linePath(floors[id]),
  fill: fillPath(floors[id]),
}));

export const STATIONS: Station[] = [
  {
    id: "n04",
    code: "N-04",
    name: "North Spit",
    x: 180,
    note: "A tongue of sand that used to make a dry landing at low water. Bearings were taken from the old light.",
  },
  {
    id: "c11",
    code: "C-11",
    name: "Channel Elbow",
    x: 500,
    note: "Where the ebb turns. The lead comes up grey and cold, with a smell of iron.",
  },
  {
    id: "h02",
    code: "H-02",
    name: "Harbor Sill",
    x: 640,
    note: "The wall’s shadow. After the cut was dredged, the sill fell away under the lead.",
  },
  {
    id: "s09",
    code: "S-09",
    name: "South Bar",
    x: 1000,
    note: "Shoal water and broken shell. Small craft still cross near half tide.",
  },
];

export const PROGRESS: Record<EpochId, number> = {
  "1974": 0,
  "1998": 0.55,
  "2026": 1,
};

export function epochFromProgress(progress: number): EpochId {
  if (progress < 0.41) return "1974";
  if (progress < 0.79) return "1998";
  return "2026";
}

export function bedAtProgress(progress: number, x: number) {
  const y0 = sampleY(floors["1974"], x);
  const y1 = sampleY(floors["1998"], x);
  const y2 = sampleY(floors["2026"], x);
  if (progress < 0.34) return y0;
  if (progress < 0.5) return lerp(y0, y1, (progress - 0.34) / 0.16);
  if (progress < 0.7) return y1;
  if (progress < 0.88) return lerp(y1, y2, (progress - 0.7) / 0.18);
  return y2;
}

export function depthMeters(floorY: number, tideY: number) {
  return Math.max(0, (floorY - tideY) / PX_PER_M);
}

export function depthAt(epochId: EpochId, x: number) {
  const epoch = EPOCHS.find((item) => item.id === epochId) ?? EPOCHS[0];
  return depthMeters(sampleY(epoch.floor, x), epoch.tide);
}

export function formatDepth(meters: number, unit: Unit) {
  if (meters <= 0.05) return "Dry";
  if (unit === "fth") return `${(meters / FATHOM).toFixed(1)} fth`;
  return `${meters.toFixed(1)} m`;
}

export function formatDelta(meters: number, unit: Unit) {
  if (Math.abs(meters) < 0.05) return "no change";
  const sign = meters > 0 ? "+" : "−";
  const amount = Math.abs(unit === "fth" ? meters / FATHOM : meters);
  return `${sign}${amount.toFixed(1)} ${unit === "fth" ? "fth" : "m"}`;
}

export function formatKm(x: number) {
  return `${((clamp(x, 0, CHART_W) / CHART_W) * TRANSECT_KM).toFixed(2)} km`;
}

export function bedName(depth: number, epochId: EpochId) {
  if (depth <= 0.05) return "Exposed sand";
  if (epochId === "2026" && depth > 18) return "Harbor mud";
  if (depth < 4) return "Fine sand";
  if (depth < 9) return "Sand and shell";
  if (depth < 16) return "Silt";
  return "Soft mud";
}

export function nearestStation(x: number) {
  let best = STATIONS[0];
  let distance = Infinity;
  for (const station of STATIONS) {
    const gap = Math.abs(station.x - x);
    if (gap < distance) {
      distance = gap;
      best = station;
    }
  }
  if (distance > 110) return { station: null, label: "Open water" };
  return { station: best, label: `${best.code} ${best.name}` };
}

export function miniPoints(points: Pt[]) {
  return points
    .map((point) => {
      const x = (point.x / CHART_W) * 280;
      const y = ((point.y - 180) / 520) * 62 + 4;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export function wavePath(y: number, amplitude: number, frequency: number) {
  let path = `M -80 ${y.toFixed(1)}`;
  for (let x = -80; x <= 1280; x += 24) {
    const yy = y + Math.sin(x * frequency) * amplitude;
    path += ` L ${x} ${yy.toFixed(1)}`;
  }
  return path;
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function lerp(from: number, to: number, amount: number) {
  return from + (to - from) * amount;
}

export function deskTide(date = new Date()) {
  const minutes = date.getHours() * 60 + date.getMinutes();
  const period = 12.42 * 60;
  const phase = ((minutes % period) / period) * Math.PI * 2;
  return 1.15 + Math.sin(phase) * 0.85;
}
