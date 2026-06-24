"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Cliente, Instalador, Venta } from "@/lib/types";
import { fmt } from "@/lib/format";
import { Btn, Empty } from "@/components/ui";

type Vista = "mes" | "semana" | "dia";

const DIAS = ["L", "M", "M", "J", "V", "S", "D"];
const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function startOfWeekMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

export default function InstalacionesPage() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [instaladores, setInstaladores] = useState<Instalador[]>([]);
  const [loading, setLoading] = useState(true);
  const [vista, setVista] = useState<Vista>("mes");
  const [cursor, setCursor] = useState(new Date());

  useEffect(() => {
    (async () => {
      const [v, c, i] = await Promise.all([
        supabase.from("ventas").select("*").not("fecha_instalacion", "is", null),
        supabase.from("clientes").select("*"),
        supabase.from("instaladores").select("*"),
      ]);
      setVentas(v.data ?? []);
      setClientes(c.data ?? []);
      setInstaladores(i.data ?? []);
      setLoading(false);
    })();
  }, []);

  const porFecha = useMemo(() => {
    const map = new Map<string, Venta[]>();
    ventas.forEach((v) => {
      if (!v.fecha_instalacion) return;
      const key = v.fecha_instalacion;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(v);
    });
    return map;
  }, [ventas]);

  const clienteNombre = (id: string | null) => clientes.find((c) => c.id === id)?.nombre ?? "Cliente";
  const instaladorNombre = (id: string | null) => instaladores.find((i) => i.id === id)?.nombre ?? "";

  function shift(amount: number) {
    const d = new Date(cursor);
    if (vista === "mes") d.setMonth(d.getMonth() + amount);
    if (vista === "semana") d.setDate(d.getDate() + amount * 7);
    if (vista === "dia") d.setDate(d.getDate() + amount);
    setCursor(d);
  }

  function tituloRango(): string {
    if (vista === "mes") return `${MESES[cursor.getMonth()]} ${cursor.getFullYear()}`;
    if (vista === "dia") return cursor.toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" });
    const start = startOfWeekMonday(cursor);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return `${start.getDate()} ${MESES[start.getMonth()].slice(0, 3)} – ${end.getDate()} ${MESES[end.getMonth()].slice(0, 3)}`;
  }

  if (loading) return <p className="text-[var(--mid)] text-sm">Cargando...</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <div className="text-xl font-extrabold tracking-tight">Instalaciones</div>
      </div>

      <div className="flex bg-[var(--accent-bg)] rounded-xl p-1 mb-3.5">
        {(["mes", "semana", "dia"] as Vista[]).map((v) => (
          <button
            key={v}
            onClick={() => setVista(v)}
            className={`flex-1 py-1.5 text-[12px] font-bold rounded-lg capitalize transition-colors ${
              vista === v ? "bg-[var(--accent)] text-white" : "text-[var(--accent)]"
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between mb-3">
        <button onClick={() => shift(-1)} className="w-9 h-9 rounded-full bg-[var(--warm-white)] border border-[var(--border)] font-bold">
          ‹
        </button>
        <div className="text-[14px] font-bold capitalize text-center">{tituloRango()}</div>
        <button onClick={() => shift(1)} className="w-9 h-9 rounded-full bg-[var(--warm-white)] border border-[var(--border)] font-bold">
          ›
        </button>
      </div>

      {vista === "mes" && (
        <VistaMes
          cursor={cursor}
          porFecha={porFecha}
          clienteNombre={clienteNombre}
          onPickDay={(d) => {
            setCursor(d);
            setVista("dia");
          }}
        />
      )}
      {vista === "semana" && (
        <VistaSemana cursor={cursor} porFecha={porFecha} clienteNombre={clienteNombre} instaladorNombre={instaladorNombre} />
      )}
      {vista === "dia" && <VistaDia cursor={cursor} porFecha={porFecha} clienteNombre={clienteNombre} instaladorNombre={instaladorNombre} />}

      <div className="mt-2">
        <Btn variant="sm-ghost" onClick={() => setCursor(new Date())}>Hoy</Btn>
      </div>
    </div>
  );
}

function VistaMes({
  cursor,
  porFecha,
  clienteNombre,
  onPickDay,
}: {
  cursor: Date;
  porFecha: Map<string, Venta[]>;
  clienteNombre: (id: string | null) => string;
  onPickDay: (d: Date) => void;
}) {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const gridStart = startOfWeekMonday(first);
  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    cells.push(d);
  }
  const todayKey = ymd(new Date());

  return (
    <div className="bg-[var(--warm-white)] rounded-2xl border border-[var(--border)] p-2.5">
      <div className="grid grid-cols-7 gap-1 mb-1.5">
        {DIAS.map((d, i) => (
          <div key={i} className="text-center text-[10px] font-bold text-[var(--mid)] py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          const key = ymd(d);
          const items = porFecha.get(key) ?? [];
          const inMonth = d.getMonth() === cursor.getMonth();
          const isToday = key === todayKey;
          return (
            <button
              key={i}
              onClick={() => onPickDay(d)}
              className={`aspect-square rounded-lg p-1 text-left flex flex-col ${
                isToday ? "bg-[var(--accent-bg)]" : ""
              } ${inMonth ? "" : "opacity-35"}`}
            >
              <span className={`text-[11px] font-semibold ${isToday ? "text-[var(--accent)]" : "text-[var(--charcoal)]"}`}>
                {d.getDate()}
              </span>
              <div className="flex-1 flex flex-wrap gap-0.5 mt-0.5 items-end">
                {items.slice(0, 3).map((v) => (
                  <span key={v.id} className="w-1.5 h-1.5 rounded-full bg-[var(--teal)]" title={clienteNombre(v.cliente_id)} />
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function VistaSemana({
  cursor,
  porFecha,
  clienteNombre,
  instaladorNombre,
}: {
  cursor: Date;
  porFecha: Map<string, Venta[]>;
  clienteNombre: (id: string | null) => string;
  instaladorNombre: (id: string | null) => string;
}) {
  const start = startOfWeekMonday(cursor);
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  const todayKey = ymd(new Date());

  return (
    <div className="space-y-2.5">
      {days.map((d) => {
        const key = ymd(d);
        const items = porFecha.get(key) ?? [];
        const isToday = key === todayKey;
        return (
          <div key={key} className={`bg-[var(--warm-white)] rounded-xl border p-3 ${isToday ? "border-[var(--accent)]" : "border-[var(--border)]"}`}>
            <div className="text-[12px] font-bold text-[var(--mid)] mb-1.5 capitalize">
              {d.toLocaleDateString("es-CL", { weekday: "short", day: "numeric", month: "short" })}
            </div>
            {!items.length ? (
              <div className="text-[12px] text-[var(--light)]">Sin instalaciones</div>
            ) : (
              items.map((v) => (
                <Link key={v.id} href={`/cortinas/ventas/${v.id}`} className="flex items-center justify-between py-1.5 border-t border-[var(--border)] first:border-t-0">
                  <div>
                    <div className="text-[13px] font-semibold">{clienteNombre(v.cliente_id)}</div>
                    {instaladorNombre(v.instalador_id) && (
                      <div className="text-[11px] text-[var(--mid)]">{instaladorNombre(v.instalador_id)}</div>
                    )}
                  </div>
                  <div className="text-[13px] font-bold text-[var(--accent)]">{fmt(v.total)}</div>
                </Link>
              ))
            )}
          </div>
        );
      })}
    </div>
  );
}

function VistaDia({
  cursor,
  porFecha,
  clienteNombre,
  instaladorNombre,
}: {
  cursor: Date;
  porFecha: Map<string, Venta[]>;
  clienteNombre: (id: string | null) => string;
  instaladorNombre: (id: string | null) => string;
}) {
  const items = porFecha.get(ymd(cursor)) ?? [];

  if (!items.length) return <Empty icon="🗓️" text="Sin instalaciones este día" />;

  return (
    <div className="space-y-2.5">
      {items.map((v) => (
        <Link
          key={v.id}
          href={`/cortinas/ventas/${v.id}`}
          className="block bg-[var(--warm-white)] rounded-xl border border-[var(--border)] p-3.5 border-l-[4px] border-l-[var(--teal)]"
        >
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[15px] font-bold">{clienteNombre(v.cliente_id)}</div>
              {instaladorNombre(v.instalador_id) && (
                <div className="text-[12px] text-[var(--mid)] mt-0.5">🛠️ {instaladorNombre(v.instalador_id)}</div>
              )}
              {v.costo_instalacion > 0 && (
                <div className="text-[12px] text-[var(--mid)] mt-0.5">Costo instalación: {fmt(v.costo_instalacion)}</div>
              )}
            </div>
            <div className="text-[16px] font-extrabold text-[var(--accent)]">{fmt(v.total)}</div>
          </div>
        </Link>
      ))}
    </div>
  );
}
