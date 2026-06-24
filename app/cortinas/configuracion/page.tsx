"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Configuracion, Usuario } from "@/lib/types";
import { applyTheme } from "@/lib/theme";
import { fmtDate } from "@/lib/format";
import { Card, Btn, Badge } from "@/components/ui";

const FORM_VACIO = {
  empresa_nombre: "",
  color_accent: "#C1452A",
  color_gold: "#C8932A",
  color_teal: "#1F7A6C",
  pdf_condiciones: "",
  pdf_pie: "",
};

export default function ConfiguracionPage() {
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(FORM_VACIO);
  const [logoWebUrl, setLogoWebUrl] = useState<string | null>(null);
  const [logoPdfUrl, setLogoPdfUrl] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [subiendoWeb, setSubiendoWeb] = useState(false);
  const [subiendoPdf, setSubiendoPdf] = useState(false);

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [nuevoUsuario, setNuevoUsuario] = useState({ nombre: "", email: "", password: "" });
  const [creandoUsuario, setCreandoUsuario] = useState(false);
  const [mensajeUsuario, setMensajeUsuario] = useState<string | null>(null);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ nombre: "", rol: "" });
  const [guardandoUsuario, setGuardandoUsuario] = useState(false);
  const [enviandoReset, setEnviandoReset] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const [{ data }, { data: u }] = await Promise.all([
      supabase.from("configuracion").select("*").eq("id", 1).maybeSingle<Configuracion>(),
      supabase.from("usuarios").select("*").order("created_at", { ascending: true }),
    ]);
    if (data) {
      setForm({
        empresa_nombre: data.empresa_nombre,
        color_accent: data.color_accent,
        color_gold: data.color_gold,
        color_teal: data.color_teal,
        pdf_condiciones: data.pdf_condiciones,
        pdf_pie: data.pdf_pie || "",
      });
      setLogoWebUrl(data.logo_web_url);
      setLogoPdfUrl(data.logo_pdf_url);
    }
    setUsuarios(u ?? []);
    setLoading(false);
  }

  async function subirLogo(file: File, campo: "logo_web_url" | "logo_pdf_url") {
    const setSubiendo = campo === "logo_web_url" ? setSubiendoWeb : setSubiendoPdf;
    setSubiendo(true);
    const ext = file.name.split(".").pop();
    const path = `${campo === "logo_web_url" ? "logo-web" : "logo-pdf"}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("branding").upload(path, file, { upsert: true });
    if (error) {
      alert("No se pudo subir el logo: " + error.message);
      setSubiendo(false);
      return;
    }
    const { data: pub } = supabase.storage.from("branding").getPublicUrl(path);
    await supabase.from("configuracion").update({ [campo]: pub.publicUrl }).eq("id", 1);
    if (campo === "logo_web_url") setLogoWebUrl(pub.publicUrl);
    else setLogoPdfUrl(pub.publicUrl);
    setSubiendo(false);
  }

  async function guardar() {
    setGuardando(true);
    const { error, data } = await supabase
      .from("configuracion")
      .update({
        empresa_nombre: form.empresa_nombre.trim() || "Cortinajes Claudia Burgos",
        color_accent: form.color_accent,
        color_gold: form.color_gold,
        color_teal: form.color_teal,
        pdf_condiciones: form.pdf_condiciones,
        pdf_pie: form.pdf_pie || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1)
      .select();
    setGuardando(false);
    if (error) {
      alert("✗ No se pudo guardar: " + error.message);
      return;
    }
    if (!data?.length) {
      alert(
        "✗ No se guardó ningún cambio. Tu sesión no tiene permiso para actualizar la configuración (revisa que sigas con la sesión iniciada)."
      );
      return;
    }
    applyTheme(form.color_accent, form.color_gold, form.color_teal);
    alert("✓ Configuración guardada");
  }

  function abrirEditarUsuario(u: Usuario) {
    setEditandoId(u.id);
    setEditForm({ nombre: u.nombre || "", rol: u.rol });
  }

  async function guardarUsuario() {
    if (!editandoId) return;
    setGuardandoUsuario(true);
    const { error } = await supabase
      .from("usuarios")
      .update({ nombre: editForm.nombre.trim() || null, rol: editForm.rol.trim() || "admin" })
      .eq("id", editandoId);
    setGuardandoUsuario(false);
    if (error) {
      alert("✗ No se pudo guardar: " + error.message);
      return;
    }
    setEditandoId(null);
    load();
  }

  async function enviarReset(email: string) {
    setEnviandoReset(email);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/restablecer-password`,
    });
    setEnviandoReset(null);
    if (error) return alert("✗ No se pudo enviar: " + error.message);
    alert(`✓ Enlace de restablecimiento enviado a ${email}`);
  }

  async function crearUsuario() {
    if (!nuevoUsuario.email.trim() || nuevoUsuario.password.length < 6) {
      return alert("Email y contraseña (mínimo 6 caracteres) son obligatorios");
    }
    setCreandoUsuario(true);
    setMensajeUsuario(null);
    const { data: session } = await supabase.auth.getSession();
    const token = session.session?.access_token;
    try {
      const res = await fetch("/api/admin/crear-usuario", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(nuevoUsuario),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setMensajeUsuario("✓ Usuario creado correctamente");
      setNuevoUsuario({ nombre: "", email: "", password: "" });
      load();
    } catch (e) {
      setMensajeUsuario(e instanceof Error ? e.message : "Error al crear usuario");
    } finally {
      setCreandoUsuario(false);
    }
  }

  if (loading) return <p className="text-[var(--mid)] text-sm">Cargando...</p>;

  return (
    <div>
      <div className="text-xl font-extrabold tracking-tight mb-4">Configuración</div>

      <Card title="Empresa">
        <div className="mb-3.5">
          <label>Nombre de la empresa</label>
          <input
            value={form.empresa_nombre}
            onChange={(e) => setForm({ ...form, empresa_nombre: e.target.value })}
            placeholder="Cortinajes Claudia Burgos"
          />
        </div>
      </Card>

      <Card title="Logos">
        <div className="mb-3.5">
          <label>Logo del sitio web</label>
          {logoWebUrl && <img src={logoWebUrl} alt="Logo web" className="h-12 mb-2 rounded" />}
          <input
            type="file"
            accept="image/*"
            disabled={subiendoWeb}
            onChange={(e) => e.target.files?.[0] && subirLogo(e.target.files[0], "logo_web_url")}
          />
          {subiendoWeb && <p className="text-xs text-[var(--mid)] mt-1">Subiendo...</p>}
        </div>
        <div className="mb-1">
          <label>Logo para el PDF</label>
          {logoPdfUrl && <img src={logoPdfUrl} alt="Logo PDF" className="h-12 mb-2 rounded" />}
          <input
            type="file"
            accept="image/*"
            disabled={subiendoPdf}
            onChange={(e) => e.target.files?.[0] && subirLogo(e.target.files[0], "logo_pdf_url")}
          />
          {subiendoPdf && <p className="text-xs text-[var(--mid)] mt-1">Subiendo...</p>}
        </div>
      </Card>

      <Card title="Paleta de colores">
        <div className="grid grid-cols-3 gap-2.5">
          <div className="mb-1">
            <label>Acento</label>
            <input type="color" value={form.color_accent} onChange={(e) => setForm({ ...form, color_accent: e.target.value })} className="h-11 p-1" />
          </div>
          <div className="mb-1">
            <label>Dorado</label>
            <input type="color" value={form.color_gold} onChange={(e) => setForm({ ...form, color_gold: e.target.value })} className="h-11 p-1" />
          </div>
          <div className="mb-1">
            <label>Teal</label>
            <input type="color" value={form.color_teal} onChange={(e) => setForm({ ...form, color_teal: e.target.value })} className="h-11 p-1" />
          </div>
        </div>
      </Card>

      <Card title="Textos del PDF">
        <div className="mb-3.5">
          <label>Condiciones (pie de cotización)</label>
          <textarea
            value={form.pdf_condiciones}
            onChange={(e) => setForm({ ...form, pdf_condiciones: e.target.value })}
            placeholder="Cotización válida por 15 días..."
          />
        </div>
        <div className="mb-1">
          <label>Pie de página adicional (opcional)</label>
          <input
            value={form.pdf_pie}
            onChange={(e) => setForm({ ...form, pdf_pie: e.target.value })}
            placeholder="Dirección, teléfono, redes sociales..."
          />
        </div>
      </Card>

      <Btn variant="primary" onClick={guardar} disabled={guardando}>
        {guardando ? "Guardando..." : "Guardar configuración"}
      </Btn>

      <div className="h-5" />

      <Card title="Usuarios del sistema">
        {!usuarios.length ? (
          <p className="text-sm text-[var(--mid)]">Sin usuarios registrados</p>
        ) : (
          usuarios.map((u) =>
            editandoId === u.id ? (
              <div key={u.id} className="py-3 border-b border-[var(--border)] last:border-b-0">
                <div className="mb-2.5">
                  <label>Nombre</label>
                  <input value={editForm.nombre} onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })} placeholder="Nombre completo" />
                </div>
                <div className="mb-2.5">
                  <label>Rol</label>
                  <input value={editForm.rol} onChange={(e) => setEditForm({ ...editForm, rol: e.target.value })} placeholder="admin" />
                </div>
                <div className="flex gap-2">
                  <Btn variant="sm-primary" onClick={guardarUsuario} disabled={guardandoUsuario}>
                    {guardandoUsuario ? "Guardando..." : "Guardar"}
                  </Btn>
                  <Btn variant="sm-ghost" onClick={() => setEditandoId(null)}>Cancelar</Btn>
                </div>
              </div>
            ) : (
              <div key={u.id} className="flex items-center justify-between py-2.5 border-b border-[var(--border)] last:border-b-0">
                <div>
                  <div className="text-[14px] font-semibold">{u.nombre || u.email}</div>
                  <div className="text-[11px] text-[var(--mid)] mt-0.5">
                    {u.email} · desde {fmtDate(u.created_at)}
                  </div>
                  <div className="flex gap-3 mt-1">
                    <button onClick={() => abrirEditarUsuario(u)} className="text-[11px] font-bold text-[var(--accent)]">
                      editar
                    </button>
                    <button onClick={() => enviarReset(u.email)} disabled={enviandoReset === u.email} className="text-[11px] font-bold text-[var(--teal)]">
                      {enviandoReset === u.email ? "enviando..." : "enviar restablecimiento"}
                    </button>
                  </div>
                </div>
                <Badge color="teal">{u.rol}</Badge>
              </div>
            )
          )
        )}
      </Card>

      <Card title="Crear usuario">
        <div className="mb-3.5">
          <label>Nombre</label>
          <input value={nuevoUsuario.nombre} onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, nombre: e.target.value })} placeholder="Nombre completo" />
        </div>
        <div className="mb-3.5">
          <label>Email</label>
          <input
            type="email"
            value={nuevoUsuario.email}
            onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, email: e.target.value })}
            placeholder="usuario@email.com"
          />
        </div>
        <div className="mb-3.5">
          <label>Contraseña</label>
          <input
            type="password"
            value={nuevoUsuario.password}
            onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, password: e.target.value })}
            placeholder="Mínimo 6 caracteres"
          />
        </div>
        {mensajeUsuario && <p className="text-sm mb-3 text-[var(--accent)]">{mensajeUsuario}</p>}
        <Btn variant="secondary" onClick={crearUsuario} disabled={creandoUsuario}>
          {creandoUsuario ? "Creando..." : "Crear usuario"}
        </Btn>
      </Card>
    </div>
  );
}
