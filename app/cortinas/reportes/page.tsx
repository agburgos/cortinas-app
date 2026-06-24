"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { supabase } from "@/lib/supabase";
import { Cotizacion, TIPO_LABEL, TipoProducto, Venta } from "@/lib/types";
import { fmt } from "@/lib/format";
import { Card, Empty } from "@/components/ui";

const COLORES = ["#C1452A", "#C8932A", "#1F7A6C", "#7A6A5C", "#9A6B0C"];
const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export default function ReportesPage() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [v, c] = await Promise.all([
        supabase.from("ventas").select("*").order("fecha", { ascending: true }),
        supabase.from("cotizaciones").select("*"),
      ]);
      setVentas(v.data ?? []);
      setCotizaciones(c.data ?? []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <p className="text-[var(--mid)] text-sm">Cargando...</p>;

  if (!ventas.length) {
    return <Empty icon="📈" text="Sin datos todavía" sub="Los reportes aparecen cuando registres ventas" />;
  }

  const cotizPorId = new Map(cotizaciones.map((c) => [c.id, c]));

  function costoDeVenta(v: Venta): number {
    const cotiz = v.cotizacion_id ? cotizPorId.get(v.cotizacion_id) : null;
    const costoItems = cotiz ? cotiz.items.reduce((s, it) => s + (it.costoSubtotal || 0), 0) : 0;
    return costoItems + (v.costo_instalacion || 0);
  }

  // Últimos 6 meses
  const hoy = new Date();
  const meses: { key: string; label: string; year: number; month: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    meses.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: MESES_CORTOS[d.getMonth()], year: d.getFullYear(), month: d.getMonth() });
  }

  const porMes = meses.map((m) => {
    const ventasMes = ventas.filter((v) => {
      const d = new Date(v.fecha);
      return d.getFullYear() === m.year && d.getMonth() === m.month;
    });
    const ingreso = ventasMes.reduce((a, v) => a + (v.total || 0), 0);
    const costo = ventasMes.reduce((a, v) => a + costoDeVenta(v), 0);
    return { mes: m.label, Ingreso: ingreso, Costo: costo, Ganancia: ingreso - costo };
  });

  const totalIngreso = ventas.reduce((a, v) => a + (v.total || 0), 0);
  const totalCosto = ventas.reduce((a, v) => a + costoDeVenta(v), 0);
  const totalGanancia = totalIngreso - totalCosto;
  const totalCobrado = ventas.reduce((a, v) => a + (v.monto_pagado || 0), 0);

  const porTipo = new Map<string, number>();
  cotizaciones.forEach((c) => {
    c.items.forEach((it) => {
      porTipo.set(it.tipo, (porTipo.get(it.tipo) || 0) + it.subtotal);
    });
  });
  const dataTipo = Array.from(porTipo.entries()).map(([tipo, valor]) => ({
    name: TIPO_LABEL[tipo as TipoProducto] || tipo,
    value: valor,
  }));

  return (
    <div>
      <div className="text-xl font-extrabold tracking-tight mb-4">Reportes</div>

      <div className="grid grid-cols-2 gap-2.5 mb-4">
        <Stat label="Ingreso total" value={fmt(totalIngreso)} accent />
        <Stat label="Costo total" value={fmt(totalCosto)} />
        <Stat label="Ganancia total" value={fmt(totalGanancia)} teal />
        <Stat label="Cobrado total" value={fmt(totalCobrado)} />
      </div>

      <Card title="Ingreso, costo y ganancia (últimos 6 meses)">
        <div className="h-64 -ml-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={porMes}>
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} width={48} />
              <Tooltip formatter={(v) => fmt(Number(v))} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Ingreso" fill="#C1452A" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Costo" fill="#7A6A5C" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Ganancia" fill="#1F7A6C" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {dataTipo.length > 0 && (
        <Card title="Ventas por tipo de producto">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={dataTipo} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} label={({ name }) => name}>
                  {dataTipo.map((_, i) => (
                    <Cell key={i} fill={COLORES[i % COLORES.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => fmt(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
    </div>
  );
}

function Stat({ label, value, accent, teal }: { label: string; value: string; accent?: boolean; teal?: boolean }) {
  return (
    <div
      className={`rounded-2xl p-3.5 border shadow-sm ${
        accent ? "text-white border-transparent" : teal ? "bg-[var(--teal-bg)] border-[var(--teal)]" : "bg-[var(--warm-white)] border-[var(--border)]"
      }`}
      style={accent ? { background: "var(--gradient)" } : undefined}
    >
      <div className={`text-lg font-extrabold tracking-tight ${teal ? "text-[var(--teal)]" : ""}`}>{value}</div>
      <div className={`text-[11px] font-medium mt-0.5 ${accent ? "opacity-90" : teal ? "text-[var(--teal)]" : "text-[var(--mid)]"}`}>{label}</div>
    </div>
  );
}
