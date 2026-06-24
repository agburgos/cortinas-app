"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Cliente, EstadoPago, Instalador, Venta } from "@/lib/types";
import { fmt, fmtDate } from "@/lib/format";
import { Btn } from "@/components/ui";

export default function VentaDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [venta, setVenta] = useState<Venta | null>(null);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [instaladores, setInstaladores] = useState<Instalador[]>([]);
  const [loading, setLoading] = useState(true);
  const [fechaInst, setFechaInst] = useState("");
  const [instaladorId, setInstaladorId] = useState("");
  const [costoInstalacion, setCostoInstalacion] = useState(0);
  const [montoPagado, setMontoPagado] = useState(0);
  const [estadoPago, setEstadoPago] = useState<EstadoPago>("pendiente");
  const [instalado, setInstalado] = useState(false);

  useEffect(() => {
    (async () => {
      const [{ data: v }, { data: insts }] = await Promise.all([
        supabase.from("ventas").select("*").eq("id", params.id).single(),
        supabase.from("instaladores").select("*").order("nombre", { ascending: true }),
      ]);
      setInstaladores(insts ?? []);
      if (!v) {
        setLoading(false);
        return;
      }
      setVenta(v);
      setFechaInst(v.fecha_instalacion || "");
      setInstaladorId(v.instalador_id || "");
      setCostoInstalacion(v.costo_instalacion || 0);
      setMontoPagado(v.monto_pagado || 0);
      setEstadoPago(v.estado_pago);
      setInstalado(v.instalado);
      if (v.cliente_id) {
        const { data: c } = await supabase.from("clientes").select("*").eq("id", v.cliente_id).single();
        setCliente(c);
      }
      setLoading(false);
    })();
  }, [params.id]);

  if (loading) return <p className="text-[var(--mid)] text-sm">Cargando...</p>;
  if (!venta) return <p className="text-[var(--mid)] text-sm">Venta no encontrada</p>;

  const restante = (venta.total || 0) - (venta.monto_pagado || 0);
  const instaladorActual = instaladores.find((i) => i.id === venta.instalador_id);

  function onInstaladorChange(id: string) {
    setInstaladorId(id);
    const inst = instaladores.find((i) => i.id === id);
    if (inst) setCostoInstalacion(inst.costo_default);
  }

  async function updateVenta() {
    await supabase
      .from("ventas")
      .update({
        fecha_instalacion: fechaInst || null,
        instalador_id: instaladorId || null,
        costo_instalacion: costoInstalacion,
        monto_pagado: montoPagado,
        estado_pago: estadoPago,
        instalado,
      })
      .eq("id", venta!.id);
    alert("✓ Venta actualizada");
    router.push("/cortinas/ventas");
  }

  async function deleteVenta() {
    if (!confirm("¿Eliminar esta venta?")) return;
    await supabase.from("ventas").delete().eq("id", venta!.id);
    router.push("/cortinas/ventas");
  }

  return (
    <div>
      <div className="text-xl font-extrabold mb-4">{cliente ? cliente.nombre : "Detalle de Venta"}</div>

      <div className="bg-[var(--warm-white)] rounded-2xl p-4 border border-[var(--border)] mb-4">
        <Row k="Total" v={fmt(venta.total)} />
        <Row k="Cobrado" v={fmt(venta.monto_pagado || 0)} color="var(--green)" />
        <Row k="Por cobrar" v={fmt(restante)} color="var(--red)" />
        <Row k="Estado pago" v={venta.estado_pago} last={!venta.fecha_instalacion && !instaladorActual} />
        {venta.fecha_instalacion && <Row k="Fecha inst." v={fmtDate(venta.fecha_instalacion)} />}
        {instaladorActual && <Row k="Instalador" v={instaladorActual.nombre} />}
        {venta.costo_instalacion > 0 && <Row k="Costo instalación" v={fmt(venta.costo_instalacion)} color="var(--accent)" last />}
      </div>

      <div className="grid gap-3">
        <div>
          <label>Fecha instalación</label>
          <input type="date" value={fechaInst} onChange={(e) => setFechaInst(e.target.value)} />
        </div>
        <div>
          <label>Instalador</label>
          <select value={instaladorId} onChange={(e) => onInstaladorChange(e.target.value)}>
            <option value="">Sin asignar</option>
            {instaladores.map((i) => (
              <option key={i.id} value={i.id}>
                {i.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Costo de instalación ($)</label>
          <input
            type="number"
            value={costoInstalacion}
            onChange={(e) => setCostoInstalacion(parseFloat(e.target.value) || 0)}
          />
        </div>
        <div>
          <label>Monto cobrado</label>
          <input type="number" value={montoPagado} onChange={(e) => setMontoPagado(parseFloat(e.target.value) || 0)} />
        </div>
        <div>
          <label>Estado de pago</label>
          <select value={estadoPago} onChange={(e) => setEstadoPago(e.target.value as EstadoPago)}>
            <option value="pendiente">Pendiente</option>
            <option value="parcial">Parcial</option>
            <option value="pagado">Pagado</option>
          </select>
        </div>
        <label className="flex items-center gap-2 font-semibold text-sm">
          <input type="checkbox" className="w-auto" checked={instalado} onChange={(e) => setInstalado(e.target.checked)} />
          Marcar como instalado
        </label>
        <Btn variant="primary" onClick={updateVenta}>Guardar cambios</Btn>
        {cliente?.telefono && (
          <a
            href={`https://wa.me/${cliente.telefono.replace(/\D/g, "")}`}
            target="_blank"
            className="block text-center bg-[var(--green-bg)] text-[var(--green)] py-3.5 text-base font-bold rounded-lg w-full"
          >
            WhatsApp {cliente.nombre}
          </a>
        )}
        <Btn variant="danger" onClick={deleteVenta}>Eliminar venta</Btn>
      </div>
    </div>
  );
}

function Row({ k, v, color, last }: { k: string; v: string; color?: string; last?: boolean }) {
  return (
    <div className={`flex justify-between py-2 text-sm ${last ? "" : "border-b border-[var(--border)]"}`}>
      <span className="text-[var(--mid)]">{k}</span>
      <span className="font-semibold" style={color ? { color } : undefined}>
        {v}
      </span>
    </div>
  );
}
