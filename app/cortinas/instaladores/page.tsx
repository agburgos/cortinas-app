"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Instalador } from "@/lib/types";
import { fmt } from "@/lib/format";
import { Card, Empty, Btn } from "@/components/ui";

export default function InstaladoresPage() {
  const [instaladores, setInstaladores] = useState<Instalador[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nombre: "", telefono: "", costoDefault: "" });

  async function load() {
    const { data } = await supabase.from("instaladores").select("*").order("created_at", { ascending: true });
    setInstaladores(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function saveInstalador() {
    if (!form.nombre.trim()) return alert("Ingresa un nombre");
    await supabase.from("instaladores").insert({
      nombre: form.nombre.trim(),
      telefono: form.telefono,
      costo_default: parseFloat(form.costoDefault) || 0,
    });
    setForm({ nombre: "", telefono: "", costoDefault: "" });
    setOpen(false);
    load();
  }

  async function deleteInstalador(id: string) {
    if (!confirm("¿Eliminar instalador?")) return;
    await supabase.from("instaladores").delete().eq("id", id);
    load();
  }

  if (loading) return <p className="text-[var(--mid)] text-sm">Cargando...</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <div className="text-xl font-extrabold tracking-tight">Equipo de instalación</div>
        <Btn variant="sm-secondary" onClick={() => setOpen(true)}>+ Nuevo</Btn>
      </div>
      <p className="text-[13px] text-[var(--mid)] mb-3">
        Instaladores disponibles y su costo de referencia por instalación
      </p>

      {!instaladores.length ? (
        <Empty icon="🛠️" text="Sin instaladores" sub="Agrega tu equipo de instalación" />
      ) : (
        <Card>
          {instaladores.map((i) => (
            <div key={i.id} className="flex items-center justify-between py-3 border-b border-[var(--border)] last:border-b-0">
              <div>
                <div className="text-[15px] font-semibold">{i.nombre}</div>
                {i.telefono && <div className="text-xs text-[var(--mid)] mt-0.5">📞 {i.telefono}</div>}
              </div>
              <div className="text-right">
                <div className="text-[15px] font-bold text-[var(--teal)]">{fmt(i.costo_default)}</div>
                <button onClick={() => deleteInstalador(i.id)} className="text-[11px] text-[var(--light)] mt-0.5">
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
            <div className="text-lg font-extrabold mb-4">Nuevo Instalador</div>
            <div className="mb-3.5">
              <label>Nombre</label>
              <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Juan Pérez" />
            </div>
            <div className="mb-3.5">
              <label>Teléfono</label>
              <input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} placeholder="+56 9 ..." />
            </div>
            <div className="mb-3.5">
              <label>Costo de referencia por instalación ($)</label>
              <input
                type="number"
                value={form.costoDefault}
                onChange={(e) => setForm({ ...form, costoDefault: e.target.value })}
                placeholder="20000"
              />
            </div>
            <Btn variant="primary" onClick={saveInstalador}>Guardar instalador</Btn>
            <div className="h-2" />
            <Btn variant="ghost" onClick={() => setOpen(false)}>Cancelar</Btn>
          </div>
        </div>
      )}
    </div>
  );
}
