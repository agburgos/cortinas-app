"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Cliente, Cotizacion, CotizacionItem, Producto, tipoLabel } from "@/lib/types";
import { fmt, fmtDate } from "@/lib/format";
import { generarCotizacionPDF } from "@/lib/pdf";
import { getConfiguracion } from "@/lib/configuracion";
import { fetchLogoDataUrl } from "@/lib/logo";
import { ESTADO_SOLICITUD_WEB } from "@/lib/cotizacionesPendientes";
import { Card, Btn, Badge } from "@/components/ui";

export default function CotizacionDetallePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [cotizacion, setCotizacion] = useState<Cotizacion | null>(null);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [ventaId, setVentaId] = useState<string | null>(null);
  const [items, setItems] = useState<CotizacionItem[]>([]);
  const [notas, setNotas] = useState("");
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [convirtiendo, setConvirtiendo] = useState(false);
  const [duplicando, setDuplicando] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  const [productoId, setProductoId] = useState("");
  const [ancho, setAncho] = useState("");
  const [alto, setAlto] = useState("");
  const [cantidad, setCantidad] = useState("1");
  const [cantidadFixed, setCantidadFixed] = useState("1");

  useEffect(() => {
    (async () => {
      const [{ data: c }, { data: p }, { data: v }] = await Promise.all([
        supabase.from("cotizaciones").select("*").eq("id", id).single(),
        supabase.from("productos").select("*"),
        supabase.from("ventas").select("id").eq("cotizacion_id", id).maybeSingle(),
      ]);
      if (c) {
        setCotizacion(c);
        setItems(c.items);
        setNotas(c.notas || "");
        if (c.cliente_id) {
          const { data: cl } = await supabase.from("clientes").select("*").eq("id", c.cliente_id).single();
          setCliente(cl ?? null);
        }
      }
      setProductos(p ?? []);
      setVentaId(v?.id ?? null);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <p className="text-[var(--mid)] text-sm">Cargando...</p>;
  if (!cotizacion) return <p className="text-[var(--mid)] text-sm">Cotización no encontrada.</p>;
  const cot = cotizacion;

  const producto = productos.find((p) => p.id === productoId) || null;
  const esM2 = !!producto && producto.precio_m2 > 0;
  const total = items.reduce((a, it) => a + it.subtotal, 0);
  const costoTotal = items.reduce((a, it) => a + it.costoSubtotal, 0);
  const esWeb = cot.estado === ESTADO_SOLICITUD_WEB;
  const esVenta = !!ventaId;

  function addItem() {
    if (!producto) return alert("Selecciona un producto");
    let item: CotizacionItem;
    if (esM2) {
      const a = parseFloat(ancho) || 0;
      const h = parseFloat(alto) || 0;
      const cant = parseInt(cantidad) || 1;
      if (!a || !h) return alert("Ingresa ancho y alto");
      const metros = a * h;
      item = {
        productoId: producto.id, nombre: producto.nombre, tipo: producto.tipo,
        ancho: a, alto: h, metros, cantidad: cant,
        precioUnitario: producto.precio_m2, costoUnitario: producto.costo_base,
        subtotal: metros * producto.precio_m2 * cant, costoSubtotal: metros * producto.costo_base * cant,
        nota: "", detalle: `${a}m × ${h}m × ${cant}u`,
      };
    } else {
      const cant = parseInt(cantidadFixed) || 1;
      item = {
        productoId: producto.id, nombre: producto.nombre, tipo: producto.tipo,
        cantidad: cant, precioUnitario: producto.precio_unidad, costoUnitario: producto.costo_base,
        subtotal: cant * producto.precio_unidad, costoSubtotal: cant * producto.costo_base,
        nota: "", detalle: `${cant} unidad(es)`,
      };
    }
    setItems((prev) => [...prev, item]);
    setProductoId("");
    setAncho("");
    setAlto("");
    setCantidad("1");
    setCantidadFixed("1");
  }

  function removeItem(i: number) {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function guardar() {
    if (!items.length) return alert("La cotización debe tener al menos un item");
    setGuardando(true);
    const { error } = await supabase
      .from("cotizaciones")
      .update({ items, notas, total })
      .eq("id", id);
    setGuardando(false);
    if (error) {
      alert("✗ No se pudo guardar: " + error.message);
      return;
    }
    setCotizacion((prev) => (prev ? { ...prev, items, notas, total } : prev));
    alert("✓ Cotización actualizada");
  }

  async function convertirEnVenta() {
    if (!items.length) return alert("La cotización debe tener al menos un item");
    setConvirtiendo(true);
    const { data: venta, error } = await supabase
      .from("ventas")
      .insert({
        cotizacion_id: id,
        cliente_id: cot.cliente_id,
        total,
        estado_pago: "pendiente",
        monto_pagado: 0,
        instalado: false,
        costo_instalacion: 0,
        notas,
      })
      .select()
      .single();
    setConvirtiendo(false);
    if (error || !venta) {
      alert("✗ No se pudo crear la venta: " + (error?.message || ""));
      return;
    }
    router.push(`/cortinas/ventas/${venta.id}`);
  }

  async function descargarPDF() {
    const config = await getConfiguracion();
    const logoDataUrl = await fetchLogoDataUrl(config?.logo_pdf_url);
    generarCotizacionPDF({
      numero: cot.numero, fecha: cot.fecha, cliente, items, total, notas, config, logoDataUrl,
    });
  }

  async function crearNuevaVersion() {
    setDuplicando(true);
    const { data: nueva, error } = await supabase
      .from("cotizaciones")
      .insert({
        cliente_id: cot.cliente_id,
        items,
        total,
        notas,
        texto_ia: "",
        estado: "Borrador",
      })
      .select()
      .single();
    setDuplicando(false);
    if (error || !nueva) {
      alert("✗ No se pudo crear la nueva cotización: " + (error?.message || ""));
      return;
    }
    router.push(`/cortinas/cotizaciones/${nueva.id}`);
  }

  async function eliminarBorrador() {
    if (!confirm("¿Eliminar esta cotización? Esta acción no se puede deshacer.")) return;
    setEliminando(true);
    const { error } = await supabase.from("cotizaciones").delete().eq("id", id);
    setEliminando(false);
    if (error) {
      alert("✗ No se pudo eliminar: " + error.message);
      return;
    }
    router.push("/cortinas/cotizaciones");
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <div className="text-xl font-extrabold tracking-tight">N° {String(cot.numero).padStart(4, "0")}</div>
        {esWeb && <Badge color="gold">🌐 Solicitud web</Badge>}
      </div>
      <p className="text-xs text-[var(--mid)] mb-4">{fmtDate(cot.fecha)}</p>

      <Card title="Cliente">
        {cliente ? (
          <div>
            <div className="text-[15px] font-semibold">{cliente.nombre}</div>
            <div className="text-xs text-[var(--mid)] mt-0.5">
              {cliente.telefono} {cliente.email ? `· ${cliente.email}` : ""}
            </div>
          </div>
        ) : (
          <div className="text-sm text-[var(--mid)]">Sin cliente registrado</div>
        )}
      </Card>

      {ventaId && (
        <Card>
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-[var(--teal)]">✓ Ya tiene una venta asociada</div>
            <Link href={`/cortinas/ventas/${ventaId}`} className="text-[13px] font-bold text-[var(--accent)]">
              Ver venta →
            </Link>
          </div>
          <p className="text-[11px] text-[var(--mid)] mt-1.5">
            Esta cotización ya no se puede modificar. Si necesitas más productos o servicios, crea una nueva cotización.
          </p>
        </Card>
      )}

      <Card title="Items">
        {items.map((it, i) => (
          <div key={i} className="bg-[var(--accent-bg)] rounded-lg px-3 py-2.5 mb-2 flex justify-between items-center">
            <div>
              <div className="text-[13px] font-semibold text-[var(--accent)]">{it.nombre}</div>
              <div className="text-[11px] text-[var(--mid)]">{it.detalle}</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-sm font-bold">{fmt(it.subtotal)}</div>
              {!esVenta && (
                <button className="text-[var(--red)] text-lg" onClick={() => removeItem(i)}>×</button>
              )}
            </div>
          </div>
        ))}
        <div className="rounded-lg px-4 py-3.5 flex justify-between items-center mt-2" style={{ background: "var(--gradient)" }}>
          <div className="text-[13px] font-medium text-white/85">Total</div>
          <div className="text-2xl font-extrabold tracking-tight text-white">{fmt(total)}</div>
        </div>
        <div className="flex justify-between text-[11px] text-[var(--mid)] mt-2 px-1">
          <span>Costo estimado: <strong className="text-[var(--charcoal)]">{fmt(costoTotal)}</strong></span>
          <span>Ganancia: <strong className="text-[var(--teal)]">{fmt(total - costoTotal)}</strong></span>
        </div>
      </Card>

      {!esVenta && (
        <>
          <Card title="Agregar item">
            <div className="mb-3.5">
              <label>Producto</label>
              <select value={productoId} onChange={(e) => setProductoId(e.target.value)}>
                <option value="">Seleccionar...</option>
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{tipoLabel(p.tipo)}] {p.nombre} — {p.precio_m2 > 0 ? `${fmt(p.precio_m2)}/m²` : `${fmt(p.precio_unidad)}/u`}
                  </option>
                ))}
              </select>
            </div>
            {producto && esM2 && (
              <>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="mb-3.5">
                    <label>Ancho (m)</label>
                    <input type="number" step="0.01" value={ancho} onChange={(e) => setAncho(e.target.value)} placeholder="1.20" />
                  </div>
                  <div className="mb-3.5">
                    <label>Alto (m)</label>
                    <input type="number" step="0.01" value={alto} onChange={(e) => setAlto(e.target.value)} placeholder="2.00" />
                  </div>
                </div>
                <div className="mb-3.5">
                  <label>Cantidad</label>
                  <input type="number" min={1} value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
                </div>
              </>
            )}
            {producto && !esM2 && (
              <div className="mb-3.5">
                <label>Cantidad</label>
                <input type="number" min={1} value={cantidadFixed} onChange={(e) => setCantidadFixed(e.target.value)} />
              </div>
            )}
            <Btn variant="secondary" onClick={addItem}>+ Agregar item</Btn>
          </Card>

          <Card title="Notas">
            <textarea value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Observaciones, condiciones, plazos..." />
          </Card>
        </>
      )}

      <Btn variant="ghost" onClick={descargarPDF} className="mb-2.5">Descargar PDF</Btn>

      {esVenta ? (
        <Btn variant="secondary" onClick={crearNuevaVersion} disabled={duplicando}>
          {duplicando ? "Creando..." : "Crear nueva cotización a partir de esta"}
        </Btn>
      ) : (
        <>
          <Btn variant="secondary" onClick={guardar} disabled={guardando} className="mb-2.5">
            {guardando ? "Guardando..." : "Guardar cambios"}
          </Btn>
          <Btn variant="primary" onClick={convertirEnVenta} disabled={convirtiendo} className="mb-2.5">
            {convirtiendo ? "Convirtiendo..." : "Convertir en venta"}
          </Btn>
          <Btn variant="danger" onClick={eliminarBorrador} disabled={eliminando}>
            {eliminando ? "Eliminando..." : "Eliminar borrador"}
          </Btn>
        </>
      )}
    </div>
  );
}
