"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Cliente, Venta } from "@/lib/types";
import { fmt } from "@/lib/format";
import { Empty, Btn } from "@/components/ui";

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nombre: "", telefono: "", email: "", direccion: "" });

  async function load() {
    const [c, v] = await Promise.all([
      supabase.from("clientes").select("*").order("created_at", { ascending: false }),
      supabase.from("ventas").select("*"),
    ]);
    setClientes(c.data ?? []);
    setVentas(v.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function saveCliente() {
    if (!form.nombre.trim()) return alert("Ingresa un nombre");
    await supabase.from("clientes").insert({
      nombre: form.nombre.trim(),
      telefono: form.telefono,
      email: form.email,
      direccion: form.direccion,
    });
    setForm({ nombre: "", telefono: "", email: "", direccion: "" });
    setOpen(false);
    load();
  }

  if (loading) return <p className="text-[var(--mid)] text-sm">Cargando...</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <div className="text-xl font-extrabold tracking-tight">Clientes</div>
        <Btn variant="sm-secondary" onClick={() => setOpen(true)}>+ Nuevo</Btn>
      </div>

      {!clientes.length ? (
        <Empty icon="👤" text="Sin clientes aún" sub="Agrega tu primer cliente" />
      ) : (
        clientes.map((c) => {
          const vts = ventas.filter((v) => v.cliente_id === c.id);
          const total = vts.reduce((a, v) => a + (v.total || 0), 0);
          return (
            <div key={c.id} className="bg-[var(--warm-white)] rounded-2xl p-3.5 mb-3 border border-[var(--border)] shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-base font-bold">{c.nombre}</div>
                  {c.telefono && <div className="text-[13px] text-[var(--mid)] mt-0.5">📞 {c.telefono}</div>}
                  {c.direccion && <div className="text-xs text-[var(--light)] mt-0.5">📍 {c.direccion}</div>}
                </div>
                <div className="text-right">
                  <div className="text-[13px] text-[var(--mid)]">
                    {vts.length} venta{vts.length !== 1 ? "s" : ""}
                  </div>
                  {total > 0 && <div className="text-sm font-bold text-[var(--accent)]">{fmt(total)}</div>}
                </div>
              </div>
              {c.telefono && (
                <div className="mt-2.5">
                  <a
                    href={`https://wa.me/${c.telefono.replace(/\D/g, "")}`}
                    target="_blank"
                    className="inline-block bg-transparent border-[1.5px] border-[var(--border)] text-[var(--charcoal)] py-2 px-3.5 text-[13px] font-bold rounded-lg"
                  >
                    WhatsApp
                  </a>
                </div>
              )}
            </div>
          );
        })
      )}

      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="bg-[var(--warm-white)] rounded-t-2xl p-5 w-full max-h-[90vh] overflow-y-auto">
            <div className="w-9 h-1 bg-[var(--border)] rounded mx-auto mb-4" />
            <div className="text-lg font-extrabold mb-4">Nuevo Cliente</div>
            <div className="mb-3.5">
              <label>Nombre completo</label>
              <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="María González" />
            </div>
            <div className="mb-3.5">
              <label>Teléfono / WhatsApp</label>
              <input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} placeholder="+56 9 1234 5678" />
            </div>
            <div className="mb-3.5">
              <label>Email (opcional)</label>
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="maria@email.com" />
            </div>
            <div className="mb-3.5">
              <label>Dirección</label>
              <input value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} placeholder="Las Condes, Santiago" />
            </div>
            <Btn variant="primary" onClick={saveCliente}>Guardar cliente</Btn>
            <div className="h-2" />
            <Btn variant="ghost" onClick={() => setOpen(false)}>Cancelar</Btn>
          </div>
        </div>
      )}
    </div>
  );
}
