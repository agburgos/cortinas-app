"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Cliente, CotizacionItem, Producto, TIPO_LABEL } from "@/lib/types";
import { fmt } from "@/lib/format";
import { generarCotizacionPDF } from "@/lib/pdf";
import { Card, Btn } from "@/components/ui";

export default function CotizarPage() {
  const router = useRouter();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  const [clienteSearch, setClienteSearch] = useState("");
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [showRapido, setShowRapido] = useState(false);
  const [rapido, setRapido] = useState({ nombre: "", telefono: "", direccion: "" });

  const [productoId, setProductoId] = useState("");
  const [ancho, setAncho] = useState("");
  const [alto, setAlto] = useState("");
  const [cantidad, setCantidad] = useState("1");
  const [cantidadFixed, setCantidadFixed] = useState("1");
  const [nota, setNota] = useState("");

  const [items, setItems] = useState<CotizacionItem[]>([]);
  const [notas, setNotas] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    (async () => {
      const [p, c] = await Promise.all([
        supabase.from("productos").select("*").order("created_at", { ascending: true }),
        supabase.from("clientes").select("*"),
      ]);
      setProductos(p.data ?? []);
      setClientes(c.data ?? []);
      setLoading(false);
    })();
  }, []);

  const producto = productos.find((p) => p.id === productoId) || null;
  const esM2 = !!producto && producto.precio_m2 > 0;

  const matches = clienteSearch.trim()
    ? clientes.filter(
        (c) => c.nombre.toLowerCase().includes(clienteSearch.toLowerCase()) || (c.telefono || "").includes(clienteSearch)
      )
    : [];
  const clienteSeleccionado = clientes.find((c) => c.id === clienteId) || null;

  function selectCliente(c: Cliente) {
    setClienteId(c.id);
    setClienteSearch(c.nombre);
  }

  async function saveClienteRapido() {
    if (!rapido.nombre.trim()) return alert("Ingresa un nombre");
    const { data } = await supabase
      .from("clientes")
      .insert({ nombre: rapido.nombre.trim(), telefono: rapido.telefono, direccion: rapido.direccion })
      .select()
      .single();
    if (data) {
      setClientes((prev) => [...prev, data]);
      selectCliente(data);
    }
    setShowRapido(false);
    setRapido({ nombre: "", telefono: "", direccion: "" });
  }

  function preview(): string {
    if (!producto) return "";
    if (esM2) {
      const a = parseFloat(ancho) || 0;
      const h = parseFloat(alto) || 0;
      const cant = parseInt(cantidad) || 1;
      const m2 = a * h;
      if (!m2) return "";
      const sub = m2 * producto.precio_m2 * cant;
      return `${m2.toFixed(2)} m² × ${fmt(producto.precio_m2)} × ${cant} = ${fmt(sub)}`;
    }
    const cant = parseInt(cantidadFixed) || 1;
    return `${cant} × ${fmt(producto.precio_unidad)} = ${fmt(cant * producto.precio_unidad)}`;
  }

  function addItem() {
    if (!producto) return alert("Selecciona un producto");
    let item: CotizacionItem;
    if (esM2) {
      const a = parseFloat(ancho) || 0;
      const h = parseFloat(alto) || 0;
      const cant = parseInt(cantidad) || 1;
      if (!a || !h) return alert("Ingresa ancho y alto");
      const m2 = a * h;
      const subtotal = m2 * producto.precio_m2 * cant;
      const costoSubtotal = m2 * producto.costo_base * cant;
      item = {
        productoId: producto.id,
        nombre: producto.nombre,
        tipo: producto.tipo,
        ancho: a,
        alto: h,
        metros: m2,
        cantidad: cant,
        precioUnitario: producto.precio_m2,
        costoUnitario: producto.costo_base,
        subtotal,
        costoSubtotal,
        nota,
        detalle: `${a}m × ${h}m × ${cant}u`,
      };
    } else {
      const cant = parseInt(cantidadFixed) || 1;
      const subtotal = cant * producto.precio_unidad;
      const costoSubtotal = cant * producto.costo_base;
      item = {
        productoId: producto.id,
        nombre: producto.nombre,
        tipo: producto.tipo,
        cantidad: cant,
        precioUnitario: producto.precio_unidad,
        costoUnitario: producto.costo_base,
        subtotal,
        costoSubtotal,
        nota,
        detalle: `${cant} unidad(es)`,
      };
    }
    setItems((prev) => [...prev, item]);
    setProductoId("");
    setAncho("");
    setAlto("");
    setCantidad("1");
    setCantidadFixed("1");
    setNota("");
  }

  function removeItem(i: number) {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  }

  const total = items.reduce((a, it) => a + it.subtotal, 0);
  const costoTotal = items.reduce((a, it) => a + it.costoSubtotal, 0);
  const ganancia = total - costoTotal;

  function textoResumen(): string {
    const itemsTexto = items
      .map((it) => `• ${it.nombre} (${it.detalle}${it.nota ? " — " + it.nota : ""}): ${fmt(it.subtotal)}`)
      .join("\n");
    return `Cotización${clienteSeleccionado ? " para " + clienteSeleccionado.nombre : ""}\n\n${itemsTexto}\n\nTOTAL: ${fmt(total)}${notas ? "\n\nNotas: " + notas : ""}`;
  }

  function copiarResumen() {
    navigator.clipboard.writeText(textoResumen()).then(() => alert("✓ Copiado al portapapeles"));
  }

  function shareWhatsApp() {
    const tel = clienteSeleccionado?.telefono ? clienteSeleccionado.telefono.replace(/\D/g, "") : "";
    const msg = encodeURIComponent(textoResumen());
    window.open(tel ? `https://wa.me/${tel}?text=${msg}` : `https://wa.me/?text=${msg}`, "_blank");
  }

  function resetCotizador() {
    setClienteId(null);
    setClienteSearch("");
    setItems([]);
    setNotas("");
  }

  async function saveCotizacion() {
    if (!items.length) return alert("Agrega al menos un producto");
    setGuardando(true);
    const { data: cotiz } = await supabase
      .from("cotizaciones")
      .insert({ cliente_id: clienteId, items, total, notas, texto_ia: "", estado: "Enviada" })
      .select()
      .single();
    await supabase.from("ventas").insert({
      cotizacion_id: cotiz?.id ?? null,
      cliente_id: clienteId,
      total,
      estado_pago: "pendiente",
      monto_pagado: 0,
      instalado: false,
      costo_instalacion: 0,
      notas,
    });
    if (cotiz) {
      generarCotizacionPDF({
        numero: cotiz.numero,
        fecha: cotiz.fecha,
        cliente: clienteSeleccionado,
        items,
        total,
        notas,
      });
    }
    alert("✓ Cotización guardada, venta creada y PDF descargado");
    setGuardando(false);
    resetCotizador();
    router.push("/");
  }

  if (loading) return <p className="text-[var(--mid)] text-sm">Cargando...</p>;

  return (
    <div>
      <div className="text-xl font-extrabold mb-4">Nueva Cotización</div>

      <Card title="Cliente">
        <div className="relative">
          <input
            value={clienteSearch}
            onChange={(e) => {
              setClienteSearch(e.target.value);
              setClienteId(null);
            }}
            placeholder="Buscar o crear cliente..."
          />
          {clienteSearch.trim() && !clienteId && (
            <div className="border-[1.5px] border-[var(--border)] border-t-0 rounded-b-lg bg-[var(--warm-white)]">
              {matches.map((c) => (
                <div key={c.id} className="p-3 border-b border-[var(--border)] cursor-pointer" onClick={() => selectCliente(c)}>
                  <div className="font-semibold text-[15px]">{c.nombre}</div>
                  <div className="text-xs text-[var(--mid)]">
                    {c.telefono} {c.direccion ? `· ${c.direccion}` : ""}
                  </div>
                </div>
              ))}
              <div className="p-3 cursor-pointer" onClick={() => setShowRapido(true)}>
                <div className="font-semibold text-[15px] text-[var(--accent)]">+ Crear &quot;{clienteSearch}&quot;</div>
              </div>
            </div>
          )}
          {clienteSeleccionado && (
            <div className="bg-[var(--accent-bg)] rounded-lg px-3 py-2 mt-2 text-[13px] text-[var(--accent)] font-semibold">
              ✓ {clienteSeleccionado.nombre} {clienteSeleccionado.telefono ? `· ${clienteSeleccionado.telefono}` : ""}
            </div>
          )}
        </div>
      </Card>

      <Card title="Agregar Item">
        <div className="mb-3.5">
          <label>Producto</label>
          <select value={productoId} onChange={(e) => setProductoId(e.target.value)}>
            <option value="">Seleccionar...</option>
            {productos.map((p) => (
              <option key={p.id} value={p.id}>
                [{TIPO_LABEL[p.tipo]}] {p.nombre} — {p.precio_m2 > 0 ? `${fmt(p.precio_m2)}/m²` : `${fmt(p.precio_unidad)}/u`}
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
        <div className="mb-3 text-[13px] text-[var(--accent)] font-bold">{preview()}</div>
        <div className="mb-3.5">
          <label>Notas del item (opcional)</label>
          <input value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Ej: ventana living, color beige..." />
        </div>
        <Btn variant="secondary" onClick={addItem}>+ Agregar a cotización</Btn>
      </Card>

      {items.length > 0 && (
        <>
          <Card title="Items de esta cotización">
            <div className="mb-3.5">
              {items.map((it, i) => (
                <div key={i} className="bg-[var(--accent-bg)] rounded-lg px-3 py-2.5 mb-2 flex justify-between items-center">
                  <div>
                    <div className="text-[13px] font-semibold text-[var(--accent)]">{it.nombre}</div>
                    <div className="text-[11px] text-[var(--mid)]">
                      {it.detalle}
                      {it.nota ? ` · ${it.nota}` : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-bold">{fmt(it.subtotal)}</div>
                    <button className="text-[var(--red)] text-lg" onClick={() => removeItem(i)}>
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-lg px-4 py-3.5 flex justify-between items-center" style={{ background: "var(--gradient)" }}>
              <div className="text-[13px] font-medium text-white/85">Total cotización</div>
              <div className="text-2xl font-extrabold tracking-tight text-white">{fmt(total)}</div>
            </div>
            <div className="flex justify-between text-[11px] text-[var(--mid)] mt-2 px-1">
              <span>Costo estimado: <strong className="text-[var(--charcoal)]">{fmt(costoTotal)}</strong></span>
              <span>Ganancia: <strong className="text-[var(--teal)]">{fmt(ganancia)}</strong></span>
            </div>
          </Card>

          <Card title="Notas generales">
            <textarea value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Observaciones, condiciones, plazos..." />
          </Card>

          <div className="flex gap-2 mb-3.5">
            <Btn variant="sm-secondary" onClick={copiarResumen}>Copiar resumen</Btn>
            <Btn variant="sm-green" onClick={shareWhatsApp}>WhatsApp</Btn>
          </div>

          <Btn variant="primary" onClick={saveCotizacion} disabled={guardando}>
            {guardando ? "Guardando..." : "Guardar y generar PDF"}
          </Btn>
        </>
      )}

      {showRapido && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end"
          onClick={(e) => e.target === e.currentTarget && setShowRapido(false)}
        >
          <div className="bg-[var(--warm-white)] rounded-t-2xl p-5 w-full max-h-[90vh] overflow-y-auto">
            <div className="w-9 h-1 bg-[var(--border)] rounded mx-auto mb-4" />
            <div className="text-lg font-extrabold mb-4">Nuevo Cliente</div>
            <div className="mb-3.5">
              <label>Nombre</label>
              <input value={rapido.nombre} onChange={(e) => setRapido({ ...rapido, nombre: e.target.value })} placeholder="María González" />
            </div>
            <div className="mb-3.5">
              <label>Teléfono</label>
              <input value={rapido.telefono} onChange={(e) => setRapido({ ...rapido, telefono: e.target.value })} placeholder="+56 9 ..." />
            </div>
            <div className="mb-3.5">
              <label>Dirección</label>
              <input value={rapido.direccion} onChange={(e) => setRapido({ ...rapido, direccion: e.target.value })} placeholder="Comuna, Ciudad" />
            </div>
            <Btn variant="primary" onClick={saveClienteRapido}>Agregar y seleccionar</Btn>
            <div className="h-2" />
            <Btn variant="ghost" onClick={() => setShowRapido(false)}>Cancelar</Btn>
          </div>
        </div>
      )}
    </div>
  );
}
