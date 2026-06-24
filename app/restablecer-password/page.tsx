"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function RestablecerPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 6) return setError("La contraseña debe tener al menos 6 caracteres");
    if (password !== password2) return setError("Las contraseñas no coinciden");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setOk(true);
    await supabase.auth.signOut();
    setTimeout(() => router.push("/cortinas"), 2000);
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

        <div className="bg-[var(--warm-white)] rounded-2xl p-5 border border-[var(--border)] shadow-md">
          {ok ? (
            <p className="text-[14px] text-[var(--teal)] font-semibold text-center">
              ✓ Contraseña actualizada. Redirigiendo al inicio de sesión...
            </p>
          ) : !ready ? (
            <p className="text-[13px] text-[var(--mid)] text-center">
              Verificando enlace de recuperación... si no pasa nada, vuelve a abrir el enlace desde tu correo.
            </p>
          ) : (
            <form onSubmit={onSubmit}>
              <p className="text-[13px] text-[var(--mid)] mb-3.5">Ingresa tu nueva contraseña.</p>
              <div className="mb-3.5">
                <label>Nueva contraseña</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  autoComplete="new-password"
                />
              </div>
              <div className="mb-3.5">
                <label>Confirmar contraseña</label>
                <input
                  type="password"
                  required
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  placeholder="Repite la contraseña"
                  autoComplete="new-password"
                />
              </div>
              {error && <p className="text-[13px] text-[var(--red)] mb-3.5">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 text-base font-bold rounded-xl text-white disabled:opacity-50"
                style={{ background: "var(--gradient)" }}
              >
                {loading ? "Guardando..." : "Guardar nueva contraseña"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
