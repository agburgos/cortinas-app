"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginForm() {
  const [modo, setModo] = useState<"login" | "recuperar">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(error.message === "Invalid login credentials" ? "Email o contraseña incorrectos" : error.message);
  }

  async function onRecuperar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMensaje("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/restablecer-password`,
      });
      setLoading(false);
      if (error) {
        console.error("Error enviando reset:", error);
        setError(error.message || `Error (status ${error.status ?? "?"}). Revisa la consola.`);
        return;
      }
      setMensaje("Si ese correo está registrado, te enviamos un enlace para restablecer tu contraseña.");
    } catch (e) {
      setLoading(false);
      console.error("Excepción enviando reset:", e);
      setError("Error de red. Intenta de nuevo.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "var(--linen)" }}>
      <div className="w-full max-w-[360px]">
        <div className="text-center mb-8">
          <div className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--accent)" }}>
            Cortinajes
          </div>
          <div className="text-sm font-semibold text-[var(--mid)] -mt-0.5">Claudia Burgos</div>
        </div>

        {modo === "login" ? (
          <form
            onSubmit={onSubmit}
            className="bg-[var(--warm-white)] rounded-2xl p-5 border border-[var(--border)] shadow-md"
          >
            <div className="mb-3.5">
              <label>Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                autoComplete="username"
              />
            </div>
            <div className="mb-3.5">
              <label>Contraseña</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
            {error && <p className="text-[13px] text-[var(--red)] mb-3.5">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 text-base font-bold rounded-xl text-white disabled:opacity-50"
              style={{ background: "var(--gradient)" }}
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
            <button
              type="button"
              onClick={() => {
                setModo("recuperar");
                setError("");
                setMensaje("");
              }}
              className="w-full mt-3 text-[13px] font-semibold text-[var(--accent)]"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </form>
        ) : (
          <form
            onSubmit={onRecuperar}
            className="bg-[var(--warm-white)] rounded-2xl p-5 border border-[var(--border)] shadow-md"
          >
            <p className="text-[13px] text-[var(--mid)] mb-3.5">
              Ingresa tu email y te enviaremos un enlace para crear una nueva contraseña.
            </p>
            <div className="mb-3.5">
              <label>Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                autoComplete="username"
              />
            </div>
            {error && <p className="text-[13px] text-[var(--red)] mb-3.5">{error}</p>}
            {mensaje && <p className="text-[13px] text-[var(--teal)] mb-3.5">{mensaje}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 text-base font-bold rounded-xl text-white disabled:opacity-50"
              style={{ background: "var(--gradient)" }}
            >
              {loading ? "Enviando..." : "Enviar enlace"}
            </button>
            <button
              type="button"
              onClick={() => {
                setModo("login");
                setError("");
                setMensaje("");
              }}
              className="w-full mt-3 text-[13px] font-semibold text-[var(--accent)]"
            >
              ← Volver a ingresar
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
