"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Cliente, Instalador, Venta } from "@/lib/types";
import { fmt, fmtDate } from "@/lib/format";
import { Empty, Badge } from "@/components/ui";
import DateRangeFilter from "@/components/DateRangeFilter";
import { fechaEnRango, RangoFechas } from "@/lib/dateRange";

type Filtro = "todas" | "pendiente" | "instalacion" | "pagado";

export default function VentasPage() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [instaladores, setInstaladores] = useState<Instalador[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [rango, setRango] = useState<RangoFechas>({ desde: "", hasta: "" });

  useEffect(() => {
    (async () => {
      const [v, c, i] = await Promise.all([
        supabase.from("ventas").select("*").order("fecha", { ascending: false }),
        supabase.from("clientes").select("*"),
        supabase.from("instaladores").select("*"),
      ]);
      setVentas(v.data ?? []);
      setClientes(c.data ?? []);
      setInstaladores(i.data ?? []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <p className="text-[var(--mid)] text-sm">Cargando...</p>;

  let lista = ventas;
  if (filtro === "pendiente") lista = lista.filter((v) => v.estado_pago === "pendiente");
  if (filtro === "instalacion") lista = lista.filter((v) => !v.instalado);
  if (filtro === "pagado") lista = lista.filter((v) => v.estado_pago === "pagado");
  if (rango.desde || rango.hasta) lista = lista.filter((v) => fechaEnRango(v.fecha, rango));

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <div className="text-xl font-extrabold tracking-tight">Ventas</div>
        <select
          value={filtro}
          onChange={(e) => setFiltro(e.target.value as Filtro)}
          className="w-auto text-xs py-1.5 px-2.5"
        >
          <option value="todas">Todas</option>
          <option value="pendiente">Pago pendiente</option>
          <option value="instalacion">Por instalar</option>
          <option value="pagado">Pagadas</option>
        </select>
      </div>

      <DateRangeFilter value={rango} onChange={setRango} />

      {!lista.length ? (
        <Empty icon="💰" text="Sin ventas" sub="Las ventas aparecen al guardar cotizaciones" />
      ) : (
        lista.map((v) => {
          const c = clientes.find((x) => x.id === v.cliente_id);
          const restante = (v.total || 0) - (v.monto_pagado || 0);
          const pagoColor = v.estado_pago === "pagado" ? "green" : v.estado_pago === "parcial" ? "yellow" : "red";
          const pagoLabel = v.estado_pago === "pagado" ? "Pagado" : v.estado_pago === "parcial" ? "Parcial" : "Pendiente";
          return (
            <Link
              key={v.id}
              href={`/cortinas/ventas/${v.id}`}
              className="block bg-[var(--warm-white)] rounded-2xl p-3.5 mb-3 border border-[var(--border)] shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-base font-bold">{c ? c.nombre : "Sin cliente"}</div>
                  <div className="text-xs text-[var(--mid)] mt-0.5">{fmtDate(v.fecha)}</div>
                  <div className="mt-1.5 flex gap-1.5 flex-wrap">
                    <Badge color={pagoColor}>{pagoLabel}</Badge>
                    {v.instalado ? <Badge color="green">Instalado</Badge> : <Badge>Por instalar</Badge>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-extrabold text-[var(--accent)]">{fmt(v.total)}</div>
                  {restante > 0 && v.estado_pago !== "pagado" && (
                    <div className="text-xs text-[var(--red)] mt-0.5">Debe {fmt(restante)}</div>
                  )}
                </div>
              </div>
              {v.fecha_instalacion && (
                <div className="text-xs text-[var(--mid)] mt-2 pt-2 border-t border-[var(--border)]">
                  📅 Instalación: {fmtDate(v.fecha_instalacion)}
                  {(() => {
                    const inst = instaladores.find((i) => i.id === v.instalador_id);
                    return inst ? ` · ${inst.nombre}` : "";
                  })()}
                </div>
              )}
            </Link>
          );
        })
      )}
    </div>
  );
}
