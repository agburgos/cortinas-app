"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { TIPO_LABEL, TipoProducto } from "@/lib/types";
import { fmt } from "@/lib/format";
import { Card, Btn } from "@/components/ui";

interface ProductoPublico {
  id: string;
  nombre: string;
  tipo: TipoProducto;
  marca: string | null;
  precio_m2: number;
  precio_unidad: number;
  descripcion: string | null;
}

interface ItemLocal {
  productoId: string;
  nombre: string;
  detalle: string;
  subtotal: number;
  ancho?: number;
  alto?: number;
  cantidad: number;
}

export default function PublicQuoteForm() {
  const [productos, setProductos] = useState<ProductoPublico[]>([]);
  const [loading, setLoading] = useState(true);
  const [productoId, setProductoId] = useState("");
  const [ancho, setAncho] = useState("");
  const [alto, setAlto] = useState("");
  const [cantidad, setCantidad] = useState("1");
  const [cantidadFixed, setCantidadFixed] = useState("1");
  const [items, setItems] = useState<ItemLocal[]>([]);

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [notas, setNotas] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<"ok" | "error" | null>(null);

  useEffect(() => {
    supabase.rpc("productos_publicos").then(({ data }) => {
      setProductos(data ?? []);
      setLoading(false);
    });
  }, []);

  const producto = productos.find((p) => p.id === productoId) || null;
  const esM2 = !!producto && producto.precio_m2 > 0;

  function preview(): string {
    if (!producto) return "";
    if (esM2) {
      const a = parseFloat(ancho) || 0;
      const h = parseFloat(alto) || 0;
      const cant = parseInt(cantidad) || 1;
      const m2 = a * h;
      if (!m2) return "";
      return `${m2.toFixed(2)} m² × ${fmt(producto.precio_m2)} × ${cant} = ${fmt(m2 * producto.precio_m2 * cant)}`;
    }
    const cant = parseInt(cantidadFixed) || 1;
    return `${cant} × ${fmt(producto.precio_unidad)} = ${fmt(cant * producto.precio_unidad)}`;
  }

  function addItem() {
    if (!producto) return alert("Selecciona un producto");
    if (esM2) {
      const a = parseFloat(ancho) || 0;
      const h = parseFloat(alto) || 0;
      const cant = parseInt(cantidad) || 1;
      if (!a || !h) return alert("Ingresa ancho y alto");
      const m2 = a * h;
      const subtotal = m2 * producto.precio_m2 * cant;
      setItems((prev) => [
        ...prev,
        { productoId: producto.id, nombre: producto.nombre, detalle: `${a}m × ${h}m × ${cant}u`, subtotal, ancho: a, alto: h, cantidad: cant },
      ]);
    } else {
      const cant = parseInt(cantidadFixed) || 1;
      const subtotal = cant * producto.precio_unidad;
      setItems((prev) => [
        ...prev,
        { productoId: producto.id, nombre: producto.nombre, detalle: `${cant} unidad(es)`, subtotal, cantidad: cant },
      ]);
    }
    setProductoId("");
    setAncho("");
    setAlto("");
    setCantidad("1");
    setCantidadFixed("1");
  }

  function removeItem(i: number) {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  }

  const total = items.reduce((a, it) => a + it.subtotal, 0);

  async function enviarSolicitud() {
    if (!nombre.trim() || !email.trim()) return alert("Completa tu nombre y email");
    if (!items.length) return alert("Agrega al menos un producto");
    setEnviando(true);
    setResultado(null);
    try {
      const res = await fetch("/api/solicitar-presupuesto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          email,
          telefono,
          notas,
          items: items.map((it) => ({
            productoId: it.productoId,
            ancho: it.ancho,
            alto: it.alto,
            cantidad: it.cantidad,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setResultado("ok");
      setItems([]);
      setNombre("");
      setEmail("");
      setTelefono("");
      setNotas("");
    } catch {
      setResultado("error");
    } finally {
      setEnviando(false);
    }
  }

  if (loading) return <p className="text-[var(--mid)] text-sm text-center">Cargando catálogo...</p>;

  if (resultado === "ok") {
    return (
      <Card>
        <div className="text-center py-6">
          <div className="text-4xl mb-3">✅</div>
          <div className="text-lg font-bold mb-1">¡Solicitud enviada!</div>
          <p className="text-sm text-[var(--mid)]">
            Te enviamos el presupuesto en PDF a tu correo. Nos pondremos en contacto pronto.
          </p>
          <div className="mt-4">
            <Btn variant="sm-secondary" onClick={() => setResultado(null)}>Hacer otra cotización</Btn>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="text-left">
      <Card title="Elige tu producto">
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
        <Btn variant="secondary" onClick={addItem}>+ Agregar a mi presupuesto</Btn>
      </Card>

      {items.length > 0 && (
        <>
          <Card title="Mi presupuesto">
            {items.map((it, i) => (
              <div key={i} className="bg-[var(--accent-bg)] rounded-lg px-3 py-2.5 mb-2 flex justify-between items-center">
                <div>
                  <div className="text-[13px] font-semibold text-[var(--accent)]">{it.nombre}</div>
                  <div className="text-[11px] text-[var(--mid)]">{it.detalle}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-sm font-bold">{fmt(it.subtotal)}</div>
                  <button className="text-[var(--red)] text-lg" onClick={() => removeItem(i)}>×</button>
                </div>
              </div>
            ))}
            <div className="rounded-lg px-4 py-3.5 flex justify-between items-center mt-2" style={{ background: "var(--gradient)" }}>
              <div className="text-[13px] font-medium text-white/85">Total estimado</div>
              <div className="text-2xl font-extrabold tracking-tight text-white">{fmt(total)}</div>
            </div>
          </Card>

          <Card title="Tus datos">
            <div className="mb-3.5">
              <label>Nombre</label>
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Tu nombre" />
            </div>
            <div className="mb-3.5">
              <label>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" />
            </div>
            <div className="mb-3.5">
              <label>Teléfono (opcional)</label>
              <input value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="+56 9 ..." />
            </div>
            <div className="mb-3.5">
              <label>Notas (opcional)</label>
              <textarea value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Color, plazo deseado, dirección..." />
            </div>
            {resultado === "error" && (
              <p className="text-[var(--red)] text-sm mb-3">Hubo un error al enviar. Intenta de nuevo.</p>
            )}
            <Btn variant="primary" onClick={enviarSolicitud} disabled={enviando}>
              {enviando ? "Enviando..." : "Enviar y recibir PDF por correo"}
            </Btn>
          </Card>
        </>
      )}
    </div>
  );
}
