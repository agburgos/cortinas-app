"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { obtenerCotizacionesWebPendientes, CotizacionPendiente } from "@/lib/cotizacionesPendientes";
import { fmt, fmtDate } from "@/lib/format";

const TABS = [
  { href: "/cortinas", icon: "📊", label: "Inicio" },
  { href: "/cortinas/cotizar", icon: "📋", label: "Cotizar" },
  { href: "/cortinas/cotizaciones", icon: "📄", label: "Cotiz." },
  { href: "/cortinas/ventas", icon: "💰", label: "Ventas" },
  { href: "/cortinas/instalaciones", icon: "🗓️", label: "Instalar" },
  { href: "/cortinas/clientes", icon: "👤", label: "Clientes" },
  { href: "/cortinas/productos", icon: "🪟", label: "Productos" },
  { href: "/cortinas/instaladores", icon: "🛠️", label: "Equipo" },
  { href: "/cortinas/reportes", icon: "📈", label: "Reportes" },
  { href: "/cortinas/configuracion", icon: "⚙️", label: "Config" },
];

const STORAGE_KEY = "cotizaciones_web_vistas";

function cargarVistos(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"));
  } catch {
    return new Set();
  }
}

function guardarVistos(ids: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

export default function NavTabs({ nombre }: { nombre: string }) {
  const pathname = usePathname();
  const today = new Date().toLocaleDateString("es-CL", { day: "numeric", month: "short" });
  const [pendientes, setPendientes] = useState<CotizacionPendiente[]>([]);
  const [vistos, setVistos] = useState<Set<string>>(new Set());
  const [panelAbierto, setPanelAbierto] = useState(false);

  useEffect(() => {
    setVistos(cargarVistos());
    function refrescar() {
      obtenerCotizacionesWebPendientes().then(setPendientes);
    }
    refrescar();
    const interval = setInterval(refrescar, 30000);
    return () => clearInterval(interval);
  }, []);

  const noVistas = pendientes.filter((p) => !vistos.has(p.id));

  function toggleNotificaciones() {
    const abrir = !panelAbierto;
    setPanelAbierto(abrir);
    if (abrir && pendientes.length) {
      const nuevos = new Set(vistos);
      pendientes.forEach((p) => nuevos.add(p.id));
      setVistos(nuevos);
      guardarVistos(nuevos);
    }
  }

  return (
    <>
      <nav className="sticky top-0 z-50" style={{ background: "var(--gradient)" }}>
        <div className="max-w-[480px] mx-auto flex items-center justify-between px-4 py-3.5">
          <div className="leading-tight">
            <div className="text-[17px] font-extrabold tracking-tight text-white drop-shadow-sm">
              Cortinajes
            </div>
            <div className="text-[11px] font-semibold text-white/85 -mt-0.5 tracking-wide">
              Claudia Burgos
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={toggleNotificaciones}
                className="relative w-8 h-8 flex items-center justify-center bg-white/15 rounded-full text-base"
              >
                🔔
                {noVistas.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[var(--red)] text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                    {noVistas.length}
                  </span>
                )}
              </button>

              {panelAbierto && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setPanelAbierto(false)} />
                  <div className="absolute right-0 top-10 w-72 bg-[var(--warm-white)] rounded-xl border border-[var(--border)] shadow-lg z-50 overflow-hidden">
                    <div className="px-3.5 py-2.5 border-b border-[var(--border)] text-[12px] font-bold text-[var(--charcoal)] uppercase tracking-wide">
                      Últimas cotizaciones web
                    </div>
                    {!pendientes.length ? (
                      <div className="px-3.5 py-4 text-[13px] text-[var(--mid)] text-center">Sin novedades</div>
                    ) : (
                      pendientes.slice(0, 5).map((p) => (
                        <Link
                          key={p.id}
                          href={`/cortinas/cotizaciones/${p.id}`}
                          onClick={() => setPanelAbierto(false)}
                          className="flex items-center justify-between px-3.5 py-2.5 border-b border-[var(--border)] last:border-b-0"
                        >
                          <div>
                            <div className="text-[13px] font-semibold text-[var(--charcoal)]">{p.clienteNombre}</div>
                            <div className="text-[11px] text-[var(--mid)]">
                              N° {String(p.numero).padStart(4, "0")} · {fmtDate(p.fecha)}
                            </div>
                          </div>
                          <div className="text-[13px] font-bold text-[var(--accent)]">{fmt(p.total)}</div>
                        </Link>
                      ))
                    )}
                    <Link
                      href="/cortinas/cotizaciones"
                      onClick={() => setPanelAbierto(false)}
                      className="block text-center text-[12px] font-bold text-[var(--accent)] py-2.5 border-t border-[var(--border)]"
                    >
                      Ver todas →
                    </Link>
                  </div>
                </>
              )}
            </div>
            <div className="text-xs font-medium text-white/85 bg-white/15 rounded-full px-2.5 py-1 max-w-[90px] truncate">
              {nombre || today}
            </div>
            <button
              onClick={() => supabase.auth.signOut()}
              className="text-xs font-semibold text-white/85 bg-white/15 rounded-full px-2.5 py-1"
            >
              Salir
            </button>
          </div>
        </div>
      </nav>
      <div className="flex bg-[var(--warm-white)] border-b border-[var(--border)] overflow-x-auto sticky top-[64px] z-40 shadow-sm">
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 min-w-[64px] px-1 py-2.5 text-[10.5px] font-semibold text-center whitespace-nowrap border-b-[3px] transition-colors ${
                active
                  ? "text-[var(--accent)] border-[var(--accent)]"
                  : "text-[var(--mid)] border-transparent"
              }`}
            >
              <span className="block text-lg mb-0.5">{tab.icon}</span>
              {tab.label}
            </Link>
          );
        })}
      </div>
    </>
  );
}
