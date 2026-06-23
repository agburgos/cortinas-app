"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Cliente, CotizacionItem, Producto, TIPO_LABEL } from "@/lib/types";
import { fmt } from "@/lib/format";
import { Card, Btn } from "@/components/ui";

export default function CotizarPage() {
  const router = useRouter();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  const [apiKey, setApiKey] = useState("");
  const [apiKeyInput, setApiKeyInput] = useState("");

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
  const [generando, setGenerando] = useState(false);
  const [textoIA, setTextoIA] = useState("");
  const [errorIA, setErrorIA] = useState("");

  useEffect(() => {
    (async () => {
      const [p, c] = await Promise.all([
        supabase.from("productos").select("*").order("created_at", { ascending: true }),
        supabase.from("clientes").select("*"),
      ]);
      setProductos(p.data ?? []);
      setClientes(c.data ?? []);
      setLoading(false);
      const k = localStorage.getItem("cortinas_apikey");
      if (k) {
        setApiKey(k);
        setApiKeyInput(k);
      }
    })();
  }, []);

  function saveApiKey() {
    const k = apiKeyInput.trim();
    if (!k) return alert("Ingresa una API key");
    localStorage.setItem("cortinas_apikey", k);
    setApiKey(k);
    alert("✓ API Key guardada");
  }

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
      item = {
        productoId: producto.id,
        nombre: producto.nombre,
        tipo: producto.tipo,
        ancho: a,
        alto: h,
        metros: m2,
        cantidad: cant,
        precioUnitario: producto.precio_m2,
        subtotal,
        nota,
        detalle: `${a}m × ${h}m × ${cant}u`,
      };
    } else {
      const cant = parseInt(cantidadFixed) || 1;
      const subtotal = cant * producto.precio_unidad;
      item = {
        productoId: producto.id,
        nombre: producto.nombre,
        tipo: producto.tipo,
        cantidad: cant,
        precioUnitario: producto.precio_unidad,
        subtotal,
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
    setTextoIA("");
  }

  function removeItem(i: number) {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  }

  const total = items.reduce((a, it) => a + it.subtotal, 0);

  async function generarConIA() {
    if (!apiKey) return alert("Primero guarda tu API Key de Anthropic arriba");
    if (!items.length) return alert("Agrega al menos un producto");
    setGenerando(true);
    setErrorIA("");
    setTextoIA("");

    const itemsTexto = items
      .map((it) => `- ${it.nombre} (${TIPO_LABEL[it.tipo]}): ${it.detalle}${it.nota ? " — " + it.nota : ""} → ${fmt(it.subtotal)}`)
      .join("\n");

    const prompt = `Eres el asistente de una empresa de cortinas en Chile. Genera una cotización profesional y amigable para enviar por WhatsApp al cliente.

Cliente: ${clienteSeleccionado ? clienteSeleccionado.nombre : "Cliente"}
${clienteSeleccionado?.telefono ? "Teléfono: " + clienteSeleccionado.telefono : ""}
${clienteSeleccionado?.direccion ? "Dirección: " + clienteSeleccionado.direccion : ""}

Productos cotizados:
${itemsTexto}

TOTAL: ${fmt(total)}
${notas ? "Notas adicionales: " + notas : ""}

Redacta el mensaje de cotización en español chileno, con un tono cálido y profesional. Incluye un saludo, el detalle de los productos, el total con IVA si aplica (indica si es con o sin IVA), condiciones de pago sugeridas (50% anticipo, 50% instalación), tiempo estimado de entrega (7-10 días hábiles), y una despedida. Usa emojis con moderación. El mensaje debe ser conciso y directo, adecuado para WhatsApp.`;

    try {
      const res = await fetch("/api/generar-cotizacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, prompt }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setTextoIA(data.texto);
    } catch (e) {
      setErrorIA(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setGenerando(false);
    }
  }

  function copiar() {
    navigator.clipboard.writeText(textoIA).then(() => alert("✓ Copiado al portapapeles"));
  }

  function shareWhatsApp() {
    const tel = clienteSeleccionado?.telefono ? clienteSeleccionado.telefono.replace(/\D/g, "") : "";
    const msg = encodeURIComponent(textoIA);
    window.open(tel ? `https://wa.me/${tel}?text=${msg}` : `https://wa.me/?text=${msg}`, "_blank");
  }

  async function resetCotizador() {
    setClienteId(null);
    setClienteSearch("");
    setItems([]);
    setNotas("");
    setTextoIA("");
    setErrorIA("");
  }

  async function saveCotizacion() {
    if (!items.length) return alert("Agrega al menos un producto");
    await supabase.from("cotizaciones").insert({
      cliente_id: clienteId,
      items,
      total,
      notas,
      texto_ia: "",
      estado: "Borrador",
    });
    alert("✓ Cotización guardada");
    resetCotizador();
    router.push("/");
  }

  async function saveCotizacionConIA() {
    if (!items.length) return;
    const { data: cotiz } = await supabase
      .from("cotizaciones")
      .insert({ cliente_id: clienteId, items, total, notas, texto_ia: textoIA, estado: "Enviada" })
      .select()
      .single();
    await supabase.from("ventas").insert({
      cotizacion_id: cotiz?.id ?? null,
      cliente_id: clienteId,
      total,
      estado_pago: "pendiente",
      monto_pagado: 0,
      instalado: false,
      notas: textoIA.slice(0, 100),
    });
    alert("✓ Cotización guardada y venta creada");
    resetCotizador();
    router.push("/");
  }

  if (loading) return <p className="text-[var(--mid)] text-sm">Cargando...</p>;

  return (
    <div>
      <div className="text-xl font-extrabold mb-4">Nueva Cotización</div>

      <div className="bg-[var(--accent-bg)] border-[1.5px] border-[var(--accent-light)] rounded-2xl p-4 mb-3.5" style={{ opacity: apiKey ? 0.5 : 1 }}>
        <p className="text-[13px] text-[var(--accent)] mb-2.5 leading-relaxed">
          🔑 Para generar cotizaciones con IA, ingresa tu API Key de Anthropic. Se guarda solo en este dispositivo.
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          <input type="password" value={apiKeyInput} onChange={(e) => setApiKeyInput(e.target.value)} placeholder="sk-ant-..." />
          <Btn variant="sm-secondary" onClick={saveApiKey} className="self-start">Guardar</Btn>
        </div>
        <p className="mt-2 text-[11px] text-[var(--accent)]">
          Obtén tu key en <strong>console.anthropic.com</strong>
        </p>
      </div>

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
            <div className="bg-[var(--charcoal)] text-white rounded-lg px-4 py-3.5 flex justify-between items-center">
              <div className="text-[13px] font-medium opacity-80">Total cotización</div>
              <div className="text-2xl font-extrabold tracking-tight">{fmt(total)}</div>
            </div>
          </Card>

          <Card title="Notas generales">
            <textarea value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Observaciones, condiciones, plazos..." />
          </Card>

          <Btn variant="primary" onClick={generarConIA} disabled={generando} className="mb-2.5">
            {generando ? "Generando..." : "✦ Generar cotización con IA"}
          </Btn>
          <Btn variant="secondary" onClick={saveCotizacion}>Guardar sin IA</Btn>

          {(generando || textoIA || errorIA) && (
            <div className="mt-3.5">
              <Card title="Cotización generada">
                {generando && <div className="text-[var(--mid)] text-[13px] py-5">Generando cotización...</div>}
                {errorIA && <div className="text-[var(--red)] text-[13px]">Error: {errorIA}</div>}
                {textoIA && (
                  <>
                    <div className="bg-[var(--linen)] border-[1.5px] border-[var(--border)] rounded-lg p-3.5 text-[13px] leading-relaxed whitespace-pre-wrap break-words max-h-[300px] overflow-y-auto">
                      {textoIA}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Btn variant="sm-green" onClick={copiar}>Copiar</Btn>
                      <Btn variant="sm-secondary" onClick={shareWhatsApp}>WhatsApp</Btn>
                      <Btn variant="sm-primary" onClick={saveCotizacionConIA}>Guardar</Btn>
                    </div>
                  </>
                )}
              </Card>
            </div>
          )}
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
