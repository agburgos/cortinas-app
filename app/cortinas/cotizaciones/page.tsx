"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Cliente, Cotizacion } from "@/lib/types";
import { fmt, fmtDate } from "@/lib/format";
import { ESTADO_SOLICITUD_WEB } from "@/lib/cotizacionesPendientes";
import { Empty, Badge } from "@/components/ui";

export default function CotizacionesPage() {
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [ventaPorCotizacion, setVentaPorCotizacion] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [q, c, v] = await Promise.all([
        supabase.from("cotizaciones").select("*").order("numero", { ascending: false }),
        supabase.from("clientes").select("*"),
        supabase.from("ventas").select("cotizacion_id"),
      ]);
      setCotizaciones(q.data ?? []);
      setClientes(c.data ?? []);
      setVentaPorCotizacion(new Set((v.data ?? []).map((x) => x.cotizacion_id).filter(Boolean)));
      setLoading(false);
    })();
  }, []);

  if (loading) return <p className="text-[var(--mid)] text-sm">Cargando...</p>;

  const clienteNombre = (id: string | null) => clientes.find((c) => c.id === id)?.nombre ?? "Sin cliente";

  return (
    <div>
      <div className="text-xl font-extrabold tracking-tight mb-4">Cotizaciones</div>

      {!cotizaciones.length ? (
        <Empty icon="📋" text="Sin cotizaciones" sub="Aparecerán aquí las que crees o lleguen desde la web" />
      ) : (
        cotizaciones.map((c) => {
          const esWeb = c.estado === ESTADO_SOLICITUD_WEB;
          const tieneVenta = ventaPorCotizacion.has(c.id);
          return (
            <Link
              key={c.id}
              href={`/cortinas/cotizaciones/${c.id}`}
              className="block bg-[var(--warm-white)] rounded-2xl p-3.5 mb-3 border border-[var(--border)] shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-base font-bold">{clienteNombre(c.cliente_id)}</div>
                  <div className="text-xs text-[var(--mid)] mt-0.5">
                    N° {String(c.numero).padStart(4, "0")} · {fmtDate(c.fecha)}
                  </div>
                  <div className="mt-1.5 flex gap-1.5 flex-wrap">
                    {esWeb && !tieneVenta && <Badge color="gold">🌐 Solicitud web nueva</Badge>}
                    {esWeb && tieneVenta && <Badge color="gray">🌐 Web</Badge>}
                    {tieneVenta && <Badge color="green">✓ Venta creada</Badge>}
                    {!esWeb && !tieneVenta && <Badge>{c.estado}</Badge>}
                  </div>
                </div>
                <div className="text-lg font-extrabold text-[var(--accent)]">{fmt(c.total)}</div>
              </div>
            </Link>
          );
        })
      )}
    </div>
  );
}
