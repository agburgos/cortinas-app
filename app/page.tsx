"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Cliente, Cotizacion, Venta } from "@/lib/types";
import { fmt, fmtDate } from "@/lib/format";
import { Card, Empty, Badge } from "@/components/ui";

export default function Dashboard() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [c, v, q] = await Promise.all([
        supabase.from("clientes").select("*"),
        supabase.from("ventas").select("*").order("fecha", { ascending: false }),
        supabase.from("cotizaciones").select("*").order("fecha", { ascending: false }).limit(5),
      ]);
      setClientes(c.data ?? []);
      setVentas(v.data ?? []);
      setCotizaciones(q.data ?? []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <p className="text-[var(--mid)] text-sm">Cargando...</p>;

  const mesActual = new Date().getMonth();
  const ventasMes = ventas.filter((v) => new Date(v.fecha).getMonth() === mesActual);
  const totalMes = ventasMes.reduce((a, v) => a + (v.total || 0), 0);
  const cobradoMes = ventasMes.reduce((a, v) => a + (v.monto_pagado || 0), 0);
  const pendientePago = ventas
    .filter((v) => v.estado_pago !== "pagado")
    .reduce((a, v) => a + ((v.total || 0) - (v.monto_pagado || 0)), 0);
  const porInstalar = ventas.filter((v) => !v.instalado).length;

  const porInstalarList = ventas
    .filter((v) => !v.instalado && v.fecha_instalacion)
    .sort((a, b) => new Date(a.fecha_instalacion!).getTime() - new Date(b.fecha_instalacion!).getTime())
    .slice(0, 5);

  const ppList = ventas.filter((v) => v.estado_pago !== "pagado").slice(0, 5);

  const clienteNombre = (id: string | null) => clientes.find((c) => c.id === id)?.nombre ?? "Cliente";

  return (
    <div>
      <div className="grid grid-cols-2 gap-2.5 mb-3.5">
        <div className="bg-[var(--accent)] text-white rounded-2xl p-3.5 border border-[var(--accent)] shadow-sm">
          <div className="text-[22px] font-extrabold tracking-tight">{fmt(totalMes)}</div>
          <div className="text-[11px] font-medium mt-0.5 opacity-90">Ventas este mes</div>
        </div>
        <div className="bg-[var(--warm-white)] rounded-2xl p-3.5 border border-[var(--border)] shadow-sm">
          <div className="text-[22px] font-extrabold tracking-tight">{fmt(cobradoMes)}</div>
          <div className="text-[11px] font-medium mt-0.5 text-[var(--mid)]">Cobrado este mes</div>
        </div>
        <div className="bg-[var(--warm-white)] rounded-2xl p-3.5 border border-[var(--border)] shadow-sm">
          <div className="text-[22px] font-extrabold tracking-tight">{fmt(pendientePago)}</div>
          <div className="text-[11px] font-medium mt-0.5 text-[var(--mid)]">Por cobrar</div>
        </div>
        <div className="bg-[var(--warm-white)] rounded-2xl p-3.5 border border-[var(--border)] shadow-sm">
          <div className="text-[22px] font-extrabold tracking-tight">{porInstalar}</div>
          <div className="text-[11px] font-medium mt-0.5 text-[var(--mid)]">Por instalar</div>
        </div>
      </div>

      <Card title="Pendiente de instalación">
        {!porInstalarList.length ? (
          <Empty text="Sin instalaciones pendientes" />
        ) : (
          porInstalarList.map((v) => (
            <Link
              key={v.id}
              href={`/ventas/${v.id}`}
              className="flex items-center justify-between py-3 border-b border-[var(--border)] last:border-b-0"
            >
              <div>
                <div className="text-[15px] font-semibold">{clienteNombre(v.cliente_id)}</div>
                <div className="text-xs text-[var(--mid)] mt-0.5">
                  📅 {fmtDate(v.fecha_instalacion!)}
                  {v.instalador ? ` · ${v.instalador}` : ""}
                </div>
              </div>
              <div className="text-[15px] font-bold text-[var(--accent)]">{fmt(v.total)}</div>
            </Link>
          ))
        )}
      </Card>

      <Card title="Pagos pendientes">
        {!ppList.length ? (
          <Empty text="Todo al día 🎉" />
        ) : (
          ppList.map((v) => {
            const resto = (v.total || 0) - (v.monto_pagado || 0);
            return (
              <Link
                key={v.id}
                href={`/ventas/${v.id}`}
                className="flex items-center justify-between py-3 border-b border-[var(--border)] last:border-b-0"
              >
                <div>
                  <div className="text-[15px] font-semibold">{clienteNombre(v.cliente_id)}</div>
                  <div className="mt-1">
                    <Badge color={v.estado_pago === "parcial" ? "yellow" : "red"}>
                      {v.estado_pago === "parcial" ? "Parcial" : "Pendiente"}
                    </Badge>
                  </div>
                </div>
                <div className="text-[15px] font-bold text-[var(--accent)]">{fmt(resto)}</div>
              </Link>
            );
          })
        )}
      </Card>

      <Card title="Últimas cotizaciones">
        {!cotizaciones.length ? (
          <Empty text="Sin cotizaciones aún" />
        ) : (
          cotizaciones.map((c) => (
            <div key={c.id} className="flex items-center justify-between py-3 border-b border-[var(--border)] last:border-b-0">
              <div>
                <div className="text-[15px] font-semibold">{clienteNombre(c.cliente_id)}</div>
                <div className="text-xs text-[var(--mid)] mt-0.5">{fmtDate(c.fecha)}</div>
              </div>
              <div className="text-right">
                <div className="text-[15px] font-bold text-[var(--accent)]">{fmt(c.total)}</div>
                <div className="mt-1">
                  <Badge>{c.estado || "Borrador"}</Badge>
                </div>
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
