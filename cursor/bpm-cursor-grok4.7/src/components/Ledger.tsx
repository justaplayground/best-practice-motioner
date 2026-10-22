import { useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  STATIONS,
  depthAt,
  formatDepth,
  type EpochId,
  type Station,
  type Unit,
} from "../survey.ts";

type FieldName = "observer" | "signal" | "station" | "depth" | "note";
type Errors = Partial<Record<FieldName, string>>;

type Entry = {
  id: string;
  observer: string;
  signal: string;
  station: string;
  depth: string;
  note: string;
  filed: string;
};

type Props = {
  epoch: EpochId;
  unit: Unit;
  onShow: (station: Station) => void;
};

const EMPTY = {
  observer: "",
  signal: "",
  station: "",
  depth: "",
  note: "",
};

export function Ledger({ epoch, unit, onShow }: Props) {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [entries, setEntries] = useState<Entry[]>([]);
  const summaryRef = useRef<HTMLDivElement>(null);
  const newestRef = useRef<HTMLHeadingElement>(null);

  const selected = STATIONS.find((station) => station.id === values.station);
  const model = selected ? depthAt(epoch, selected.x) : null;

  const setField = (name: FieldName, value: string) => {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next = validate(values);
    setErrors(next);
    if (Object.keys(next).length > 0) {
      window.requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }
    const station = STATIONS.find((item) => item.id === values.station);
    const entry: Entry = {
      id: `CR19-${station?.code ?? "XX"}-${Math.floor(1000 + Math.random() * 9000)}`,
      observer: values.observer.trim(),
      signal: values.signal.trim(),
      station: station ? `${station.code} ${station.name}` : values.station,
      depth: `${Number(values.depth).toFixed(1)} m`,
      note: values.note.trim(),
      filed: new Date().toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setEntries((current) => [entry, ...current]);
    setValues(EMPTY);
    window.requestAnimationFrame(() => newestRef.current?.focus());
  };

  return (
    <section id="ledger" className="band" aria-labelledby="ledger-title">
      <div className="band-inner">
        <p className="index-no">04 — Ledger</p>
        <h2 id="ledger-title" className="section-title">
          File a sounding
        </h2>
        <p className="intro">
          Observations stay in this sitting of the room. Nothing is sent
          onward. The model depth is a composed figure, not a forecast.
        </p>
        <div className="ledger-grid">
          <form className="ledger-form" noValidate onSubmit={onSubmit}>
            {Object.keys(errors).length > 0 ? (
              <div
                ref={summaryRef}
                tabIndex={-1}
                role="alert"
                className="error-summary"
              >
                <p>The ledger needs a few corrections.</p>
                <ul>
                  {Object.entries(errors).map(([key, message]) => (
                    <li key={key}>
                      <a href={`#field-${key}`}>{message}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <Field
              id="field-observer"
              label="Observer"
              error={errors.observer}
            >
              <input
                id="field-observer"
                name="observer"
                autoComplete="name"
                value={values.observer}
                maxLength={80}
                required
                aria-invalid={Boolean(errors.observer)}
                aria-describedby={errors.observer ? "field-observer-error" : undefined}
                onChange={(event) => setField("observer", event.target.value)}
              />
            </Field>

            <Field id="field-signal" label="Signal" error={errors.signal}>
              <input
                id="field-signal"
                name="signal"
                type="email"
                autoComplete="email"
                inputMode="email"
                value={values.signal}
                maxLength={120}
                required
                aria-invalid={Boolean(errors.signal)}
                aria-describedby={errors.signal ? "field-signal-error" : undefined}
                onChange={(event) => setField("signal", event.target.value)}
              />
            </Field>

            <Field id="field-station" label="Station" error={errors.station}>
              <select
                id="field-station"
                name="station"
                value={values.station}
                required
                aria-invalid={Boolean(errors.station)}
                aria-describedby={errors.station ? "field-station-error" : "station-model"}
                onChange={(event) => setField("station", event.target.value)}
              >
                <option value="">Select a mark</option>
                {STATIONS.map((station) => (
                  <option key={station.id} value={station.id}>
                    {station.code} {station.name}
                  </option>
                ))}
              </select>
            </Field>
            <p id="station-model" className="helper">
              {selected && model !== null ? (
                <>
                  On sheet {epoch}, the model reads {formatDepth(model, unit)} at{" "}
                  {selected.code}.{" "}
                  <button type="button" className="text-btn" onClick={() => onShow(selected)}>
                    Show this mark on the chart
                  </button>
                </>
              ) : (
                "Choose a mark to see the model depth for the sheet now on screen."
              )}
            </p>

            <Field
              id="field-depth"
              label="Observed depth"
              error={errors.depth}
              hint="Meters below the surface you observed. Use 0 for a dry mark."
            >
              <input
                id="field-depth"
                name="depth"
                inputMode="decimal"
                value={values.depth}
                required
                aria-invalid={Boolean(errors.depth)}
                aria-describedby={
                  errors.depth ? "field-depth-error field-depth-hint" : "field-depth-hint"
                }
                onChange={(event) => setField("depth", event.target.value)}
              />
            </Field>

            <Field id="field-note" label="Note" error={errors.note} optional>
              <textarea
                id="field-note"
                name="note"
                value={values.note}
                maxLength={280}
                aria-invalid={Boolean(errors.note)}
                aria-describedby={errors.note ? "field-note-error" : undefined}
                onChange={(event) => setField("note", event.target.value)}
              />
            </Field>

            <button type="submit" className="btn btn-ink">
              File observation
            </button>
          </form>

          <div className="ledger-book">
            <h3 className="book-title">This sitting</h3>
            {entries.length === 0 ? (
              <p className="helper">No observations filed yet.</p>
            ) : (
              <ul className="entries">
                {entries.map((entry, index) => (
                  <li key={entry.id} className="entry">
                    <p className="entry-id">{entry.id}</p>
                    <h3
                      ref={index === 0 ? newestRef : undefined}
                      tabIndex={index === 0 ? -1 : undefined}
                    >
                      {entry.observer}
                    </h3>
                    <p>
                      {entry.station} · {entry.depth}
                    </p>
                    {entry.note ? <p>{entry.note}</p> : null}
                    <p className="entry-meta">
                      {entry.filed} · {entry.signal}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({
  id,
  label,
  error,
  hint,
  optional,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="field">
      <label htmlFor={id}>
        {label}
        {optional ? <span className="optional"> optional</span> : null}
      </label>
      {children}
      {hint ? (
        <p id={`${id}-hint`} className="helper">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function validate(values: typeof EMPTY): Errors {
  const errors: Errors = {};
  if (values.observer.trim().length < 2) {
    errors.observer = "Enter the observer’s name.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.signal.trim())) {
    errors.signal = "Enter a valid signal address.";
  }
  if (!values.station) errors.station = "Choose a station.";
  if (values.depth.trim() === "" || Number.isNaN(Number(values.depth))) {
    errors.depth = "Enter a depth in meters.";
  } else if (Number(values.depth) < 0 || Number(values.depth) > 40) {
    errors.depth = "Depth must be between 0 and 40 meters.";
  }
  if (values.note.length > 280) errors.note = "Keep the note under 280 characters.";
  return errors;
}
