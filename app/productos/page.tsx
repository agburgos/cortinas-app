"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Producto, TIPO_LABEL, TipoProducto } from "@/lib/types";
import { fmt } from "@/lib/format";
import { Card, Empty, Btn } from "@/components/ui";

const EJEMPLOS: Omit<Producto, "id" | "created_at">[] = [
  { nombre: "Roller Blackout", tipo: "roller", precio_m2: 18000, precio_unidad: 0, descripcion: "Oscurece 99%" },
  { nombre: "Roller Sunscreen 5%", tipo: "roller", precio_m2: 15000, precio_unidad: 0, descripcion: "Filtro solar, vista hacia afuera" },
  { nombre: "Screener 3%", tipo: "screener", precio_m2: 20000, precio_unidad: 0, descripcion: "Alta transparencia" },
  { nombre: "Cortina Lino", tipo: "cortina", precio_m2: 22000, precio_unidad: 0, descripcion: "Pliegues franceses" },
  { nombre: "Cortina Blackout Tela", tipo: "cortina", precio_m2: 25000, precio_unidad: 0, descripcion: "Forro oscurecedor" },
  { nombre: "Instalación básica", tipo: "instalacion", precio_m2: 0, precio_unidad: 15000, descripcion: "Por ventana" },
  { nombre: "Instalación premium", tipo: "instalacion", precio_m2: 0, precio_unidad: 25000, descripcion: "Incluye riel y accesorios" },
  { nombre: "Riel doble", tipo: "accesorio", precio_m2: 0, precio_unidad: 12000, descripcion: "Para cortina + blackout" },
];

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    tipo: "roller" as TipoProducto,
    precioM2: "",
    precioUnid: "",
    desc: "",
  });

  async function load() {
    const { data } = await supabase.from("productos").select("*").order("created_at", { ascending: true });
    setProductos(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const isUnit = form.tipo === "instalacion" || form.tipo === "accesorio";

  async function saveProducto() {
    if (!form.nombre.trim()) return alert("Ingresa un nombre");
    await supabase.from("productos").insert({
      nombre: form.nombre.trim(),
      tipo: form.tipo,
      precio_m2: isUnit ? 0 : parseFloat(form.precioM2) || 0,
      precio_unidad: isUnit ? parseFloat(form.precioUnid) || 0 : 0,
      descripcion: form.desc,
    });
    setForm({ nombre: "", tipo: "roller", precioM2: "", precioUnid: "", desc: "" });
    setOpen(false);
    load();
  }

  async function deleteProducto(id: string) {
    if (!confirm("¿Eliminar producto?")) return;
    await supabase.from("productos").delete().eq("id", id);
    load();
  }

  async function cargarEjemplos() {
    await supabase.from("productos").insert(EJEMPLOS);
    load();
  }

  if (loading) return <p className="text-[var(--mid)] text-sm">Cargando...</p>;

  const grupos: Record<string, Producto[]> = {};
  productos.forEach((p) => {
    if (!grupos[p.tipo]) grupos[p.tipo] = [];
    grupos[p.tipo].push(p);
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <div className="text-xl font-extrabold tracking-tight">Productos</div>
        <Btn variant="sm-secondary" onClick={() => setOpen(true)}>+ Nuevo</Btn>
      </div>
      <p className="text-[13px] text-[var(--mid)] mb-3">
        Telas, rollers y servicios con sus precios por m²
      </p>

      {!productos.length ? (
        <>
          <Empty icon="🪟" text="Sin productos" sub="Agrega tus telas, rollers y servicios" />
          <Btn variant="primary" onClick={cargarEjemplos}>Cargar productos de ejemplo</Btn>
        </>
      ) : (
        Object.entries(grupos).map(([tipo, prods]) => (
          <Card key={tipo} title={TIPO_LABEL[tipo as TipoProducto] || tipo}>
            {prods.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-3 border-b border-[var(--border)] last:border-b-0">
                <div>
                  <div className="text-[15px] font-semibold">{p.nombre}</div>
                  {p.descripcion && <div className="text-xs text-[var(--mid)] mt-0.5">{p.descripcion}</div>}
                </div>
                <div className="text-right">
                  <div className="text-[15px] font-bold text-[var(--accent)]">
                    {p.precio_m2 > 0 ? `${fmt(p.precio_m2)}/m²` : `${fmt(p.precio_unidad)}/u`}
                  </div>
                  <button
                    onClick={() => deleteProducto(p.id)}
                    className="text-[11px] text-[var(--light)] mt-0.5"
                  >
                    eliminar
                  </button>
                </div>
              </div>
            ))}
          </Card>
        ))
      )}

      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="bg-[var(--warm-white)] rounded-t-2xl p-5 w-full max-h-[90vh] overflow-y-auto">
            <div className="w-9 h-1 bg-[var(--border)] rounded mx-auto mb-4" />
            <div className="text-lg font-extrabold mb-4">Nuevo Producto</div>
            <div className="mb-3.5">
              <label>Nombre</label>
              <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Roller Blackout Premium" />
            </div>
            <div className="mb-3.5">
              <label>Tipo</label>
              <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as TipoProducto })}>
                <option value="roller">Roller</option>
                <option value="screener">Screener</option>
                <option value="cortina">Cortina de tela</option>
                <option value="instalacion">Instalación</option>
                <option value="accesorio">Accesorio</option>
              </select>
            </div>
            {!isUnit ? (
              <div className="mb-3.5">
                <label>Precio por m² ($)</label>
                <input type="number" value={form.precioM2} onChange={(e) => setForm({ ...form, precioM2: e.target.value })} placeholder="15000" />
              </div>
            ) : (
              <div className="mb-3.5">
                <label>Precio unitario ($)</label>
                <input type="number" value={form.precioUnid} onChange={(e) => setForm({ ...form, precioUnid: e.target.value })} placeholder="25000" />
              </div>
            )}
            <div className="mb-3.5">
              <label>Descripción (opcional)</label>
              <input value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} placeholder="Oscurece 99%, disponible en 12 colores" />
            </div>
            <Btn variant="primary" onClick={saveProducto}>Guardar producto</Btn>
            <div className="h-2" />
            <Btn variant="ghost" onClick={() => setOpen(false)}>Cancelar</Btn>
          </div>
        </div>
      )}
    </div>
  );
}
