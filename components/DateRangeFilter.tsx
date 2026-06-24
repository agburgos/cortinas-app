"use client";

import { RangoFechas, rangoEsteAnio, rangoEsteMes, rangoUltimosMeses } from "@/lib/dateRange";

export default function DateRangeFilter({
  value,
  onChange,
}: {
  value: RangoFechas;
  onChange: (r: RangoFechas) => void;
}) {
  const presets: { label: string; get: () => RangoFechas }[] = [
    { label: "Este mes", get: rangoEsteMes },
    { label: "3 meses", get: () => rangoUltimosMeses(3) },
    { label: "6 meses", get: () => rangoUltimosMeses(6) },
    { label: "Este año", get: rangoEsteAnio },
    { label: "Todo", get: () => ({ desde: "", hasta: "" }) },
  ];

  return (
    <div className="bg-[var(--warm-white)] rounded-2xl p-3.5 mb-3 border border-[var(--border)] shadow-sm">
      <div className="grid grid-cols-2 gap-2.5 mb-2.5">
        <div className="mb-0">
          <label>Desde</label>
          <input type="date" value={value.desde} onChange={(e) => onChange({ ...value, desde: e.target.value })} />
        </div>
        <div className="mb-0">
          <label>Hasta</label>
          <input type="date" value={value.hasta} onChange={(e) => onChange({ ...value, hasta: e.target.value })} />
        </div>
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {presets.map((p) => (
          <button
            key={p.label}
            onClick={() => onChange(p.get())}
            className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[var(--accent-bg)] text-[var(--accent)]"
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
