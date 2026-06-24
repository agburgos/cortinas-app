"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { TipoProductoRow, UnidadMedida } from "@/lib/types";
import { Card, Btn, Badge, Empty } from "@/components/ui";

const FORM_VACIO = { nombre: "", unidad: "m2" as UnidadMedida };

export default function TiposProductoPage() {
  const [tipos, setTipos] = useState<TipoProductoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(FORM_VACIO);

  async function load() {
    const { data } = await supabase.from("tipos_producto").select("*").order("created_at", { ascending: true });
    setTipos(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function abrirNuevo() {
    setEditId(null);
    setForm(FORM_VACIO);
    setOpen(true);
  }

  function abrirEditar(t: TipoProductoRow) {
    setEditId(t.id);
    setForm({ nombre: t.nombre, unidad: t.unidad });
    setOpen(true);
  }

  async function guardar() {
    const nombre = form.nombre.trim().toLowerCase();
    if (!nombre) return alert("Ingresa un nombre");
    if (editId) {
      const { error } = await supabase.from("tipos_producto").update({ nombre, unidad: form.unidad }).eq("id", editId);
      if (error) return alert("✗ No se pudo guardar: " + error.message);
    } else {
      const { error } = await supabase.from("tipos_producto").insert({ nombre, unidad: form.unidad });
      if (error) return alert("✗ No se pudo crear: " + error.message);
    }
    setOpen(false);
    setForm(FORM_VACIO);
    setEditId(null);
    load();
  }

  async function eliminar(t: TipoProductoRow) {
    const { count } = await supabase.from("productos").select("id", { count: "exact", head: true }).eq("tipo", t.nombre);
    if (count && count > 0) {
      return alert(`No puedes eliminar "${t.nombre}": hay ${count} producto(s) usando este tipo.`);
    }
    if (!confirm(`¿Eliminar el tipo "${t.nombre}"?`)) return;
    const { error } = await supabase.from("tipos_producto").delete().eq("id", t.id);
    if (error) return alert("✗ No se pudo eliminar: " + error.message);
    load();
  }

  if (loading) return <p className="text-[var(--mid)] text-sm">Cargando...</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <div className="text-xl font-extrabold tracking-tight">Tipos de producto</div>
        <Btn variant="sm-secondary" onClick={abrirNuevo}>+ Nuevo</Btn>
      </div>
      <p className="text-[13px] text-[var(--mid)] mb-3">
        Define si cada tipo se cobra por metro cuadrado o por unidad
      </p>
      <Link href="/cortinas/productos" className="block text-[13px] font-bold text-[var(--accent)] mb-3">
        ← Volver a Productos
      </Link>

      {!tipos.length ? (
        <Empty icon="🏷️" text="Sin tipos definidos" />
      ) : (
        <Card>
          {tipos.map((t) => (
            <div key={t.id} className="flex items-center justify-between py-3 border-b border-[var(--border)] last:border-b-0">
              <div>
                <div className="text-[15px] font-semibold capitalize">{t.nombre}</div>
                <div className="mt-1">
                  <Badge color={t.unidad === "m2" ? "teal" : "gold"}>
                    {t.unidad === "m2" ? "Por m²" : "Por unidad"}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => abrirEditar(t)} className="text-[12px] font-bold text-[var(--accent)]">
                  editar
                </button>
                <button onClick={() => eliminar(t)} className="text-[12px] text-[var(--light)]">
                  eliminar
                </button>
              </div>
            </div>
          ))}
        </Card>
      )}

      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="bg-[var(--warm-white)] rounded-t-2xl p-5 w-full max-h-[90vh] overflow-y-auto">
            <div className="w-9 h-1 bg-[var(--border)] rounded mx-auto mb-4" />
            <div className="text-lg font-extrabold mb-4">{editId ? "Editar tipo" : "Nuevo tipo"}</div>
            <div className="mb-3.5">
              <label>Nombre</label>
              <input
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder="ej: persiana, papel mural..."
              />
            </div>
            <div className="mb-3.5">
              <label>Se cobra por</label>
              <select value={form.unidad} onChange={(e) => setForm({ ...form, unidad: e.target.value as UnidadMedida })}>
                <option value="m2">Metro cuadrado (m²)</option>
                <option value="unidad">Unidad</option>
              </select>
            </div>
            <Btn variant="primary" onClick={guardar}>{editId ? "Guardar cambios" : "Crear tipo"}</Btn>
            <div className="h-2" />
            <Btn variant="ghost" onClick={() => setOpen(false)}>Cancelar</Btn>
          </div>
        </div>
      )}
    </div>
  );
}
