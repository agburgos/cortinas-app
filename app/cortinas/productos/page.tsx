"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Producto, TIPO_LABEL, TipoProducto } from "@/lib/types";
import { fmt } from "@/lib/format";
import { Card, Empty, Btn, Badge } from "@/components/ui";

const EJEMPLOS: Omit<Producto, "id" | "created_at">[] = [
  { nombre: "Roller Blackout", tipo: "roller", marca: "Mantex", precio_m2: 18000, precio_unidad: 0, costo_base: 10000, descripcion: "Oscurece 99%" },
  { nombre: "Roller Sunscreen 5%", tipo: "roller", marca: "Mantex", precio_m2: 15000, precio_unidad: 0, costo_base: 8500, descripcion: "Filtro solar, vista hacia afuera" },
  { nombre: "Sunscreen 3%", tipo: "sunscreen", marca: "Vescom", precio_m2: 20000, precio_unidad: 0, costo_base: 11500, descripcion: "Alta transparencia" },
  { nombre: "Cortina Lino", tipo: "cortina", marca: "Decotex", precio_m2: 22000, precio_unidad: 0, costo_base: 13000, descripcion: "Pliegues franceses" },
  { nombre: "Cortina Blackout Tela", tipo: "cortina", marca: "Decotex", precio_m2: 25000, precio_unidad: 0, costo_base: 15000, descripcion: "Forro oscurecedor" },
  { nombre: "Instalación básica", tipo: "instalacion", marca: null, precio_m2: 0, precio_unidad: 15000, costo_base: 10000, descripcion: "Por ventana" },
  { nombre: "Instalación premium", tipo: "instalacion", marca: null, precio_m2: 0, precio_unidad: 25000, costo_base: 16000, descripcion: "Incluye riel y accesorios" },
  { nombre: "Riel doble", tipo: "accesorio", marca: "Forma", precio_m2: 0, precio_unidad: 12000, costo_base: 7000, descripcion: "Para cortina + blackout" },
];

const FORM_VACIO = {
  nombre: "",
  tipo: "roller" as TipoProducto,
  marca: "",
  precioM2: "",
  precioUnid: "",
  costoBase: "",
  desc: "",
};

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(FORM_VACIO);

  async function load() {
    const { data } = await supabase.from("productos").select("*").order("created_at", { ascending: true });
    setProductos(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const isUnit = form.tipo === "instalacion" || form.tipo === "accesorio";

  function abrirNuevo() {
    setEditId(null);
    setForm(FORM_VACIO);
    setOpen(true);
  }

  function abrirEditar(p: Producto) {
    setEditId(p.id);
    setForm({
      nombre: p.nombre,
      tipo: p.tipo,
      marca: p.marca || "",
      precioM2: p.precio_m2 > 0 ? String(p.precio_m2) : "",
      precioUnid: p.precio_unidad > 0 ? String(p.precio_unidad) : "",
      costoBase: String(p.costo_base),
      desc: p.descripcion || "",
    });
    setOpen(true);
  }

  async function saveProducto() {
    if (!form.nombre.trim()) return alert("Ingresa un nombre");
    const payload = {
      nombre: form.nombre.trim(),
      tipo: form.tipo,
      marca: form.marca.trim() || null,
      precio_m2: isUnit ? 0 : parseFloat(form.precioM2) || 0,
      precio_unidad: isUnit ? parseFloat(form.precioUnid) || 0 : 0,
      costo_base: parseFloat(form.costoBase) || 0,
      descripcion: form.desc,
    };
    if (editId) {
      await supabase.from("productos").update(payload).eq("id", editId);
    } else {
      await supabase.from("productos").insert(payload);
    }
    setForm(FORM_VACIO);
    setEditId(null);
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
        <Btn variant="sm-secondary" onClick={abrirNuevo}>+ Nuevo</Btn>
      </div>
      <p className="text-[13px] text-[var(--mid)] mb-3">
        Telas, rollers y servicios con su precio al cliente y costo base
      </p>

      {!productos.length ? (
        <>
          <Empty icon="🪟" text="Sin productos" sub="Agrega tus telas, rollers y servicios" />
          <Btn variant="primary" onClick={cargarEjemplos}>Cargar productos de ejemplo</Btn>
        </>
      ) : (
        Object.entries(grupos).map(([tipo, prods]) => (
          <Card key={tipo} title={TIPO_LABEL[tipo as TipoProducto] || tipo}>
            {prods.map((p) => {
              const precio = p.precio_m2 > 0 ? p.precio_m2 : p.precio_unidad;
              const margen = precio - p.costo_base;
              const margenPct = precio > 0 ? Math.round((margen / precio) * 100) : 0;
              return (
                <div key={p.id} className="py-3 border-b border-[var(--border)] last:border-b-0">
                  <div className="flex items-center justify-between">
                    <button className="text-left flex-1" onClick={() => abrirEditar(p)}>
                      <div className="text-[15px] font-semibold">{p.nombre}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {p.marca && <Badge color="gold">{p.marca}</Badge>}
                        {p.descripcion && <div className="text-xs text-[var(--mid)]">{p.descripcion}</div>}
                      </div>
                    </button>
                    <div className="text-right">
                      <div className="text-[15px] font-bold text-[var(--accent)]">
                        {p.precio_m2 > 0 ? `${fmt(p.precio_m2)}/m²` : `${fmt(p.precio_unidad)}/u`}
                      </div>
                      <div className="flex gap-2 justify-end mt-0.5">
                        <button onClick={() => abrirEditar(p)} className="text-[11px] text-[var(--accent)]">
                          editar
                        </button>
                        <button onClick={() => deleteProducto(p.id)} className="text-[11px] text-[var(--light)]">
                          eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-[var(--mid)]">
                    <span>Costo base: <strong className="text-[var(--charcoal)]">{fmt(p.costo_base)}</strong></span>
                    <span>·</span>
                    <span>
                      Margen: <strong className={margen >= 0 ? "text-[var(--teal)]" : "text-[var(--red)]"}>{fmt(margen)} ({margenPct}%)</strong>
                    </span>
                  </div>
                </div>
              );
            })}
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
            <div className="text-lg font-extrabold mb-4">{editId ? "Editar Producto" : "Nuevo Producto"}</div>
            <div className="mb-3.5">
              <label>Nombre</label>
              <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Roller Blackout Premium" />
            </div>
            <div className="mb-3.5">
              <label>Marca (opcional)</label>
              <input value={form.marca} onChange={(e) => setForm({ ...form, marca: e.target.value })} placeholder="Mantex" />
            </div>
            <div className="mb-3.5">
              <label>Tipo</label>
              <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as TipoProducto })}>
                <option value="roller">Roller</option>
                <option value="sunscreen">Sunscreen</option>
                <option value="cortina">Cortina de tela</option>
                <option value="instalacion">Instalación</option>
                <option value="accesorio">Accesorio</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {!isUnit ? (
                <div className="mb-3.5">
                  <label>Precio cliente ($/m²)</label>
                  <input type="number" value={form.precioM2} onChange={(e) => setForm({ ...form, precioM2: e.target.value })} placeholder="15000" />
                </div>
              ) : (
                <div className="mb-3.5">
                  <label>Precio cliente ($/u)</label>
                  <input type="number" value={form.precioUnid} onChange={(e) => setForm({ ...form, precioUnid: e.target.value })} placeholder="25000" />
                </div>
              )}
              <div className="mb-3.5">
                <label>Costo base ($)</label>
                <input type="number" value={form.costoBase} onChange={(e) => setForm({ ...form, costoBase: e.target.value })} placeholder="9000" />
              </div>
            </div>
            <p className="text-[11px] text-[var(--mid)] mb-3.5 -mt-1">
              El costo base es lo que pagas tú (proveedor); el precio cliente es lo que cobras. La diferencia es el margen.
            </p>
            <div className="mb-3.5">
              <label>Descripción (opcional)</label>
              <input value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} placeholder="Oscurece 99%, disponible en 12 colores" />
            </div>
            <Btn variant="primary" onClick={saveProducto}>{editId ? "Guardar cambios" : "Guardar producto"}</Btn>
            <div className="h-2" />
            <Btn variant="ghost" onClick={() => setOpen(false)}>Cancelar</Btn>
          </div>
        </div>
      )}
    </div>
  );
}
