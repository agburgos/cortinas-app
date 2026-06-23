"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", icon: "📊", label: "Inicio" },
  { href: "/cotizar", icon: "📋", label: "Cotizar" },
  { href: "/ventas", icon: "💰", label: "Ventas" },
  { href: "/clientes", icon: "👤", label: "Clientes" },
  { href: "/productos", icon: "🪟", label: "Productos" },
];

export default function NavTabs() {
  const pathname = usePathname();
  const today = new Date().toLocaleDateString("es-CL", { day: "numeric", month: "short" });

  return (
    <>
      <nav className="bg-[var(--warm-white)] border-b border-[var(--border)] sticky top-0 z-50">
        <div className="max-w-[480px] mx-auto flex items-center justify-between px-4 py-3">
          <div className="text-lg font-bold tracking-tight text-[var(--accent)]">
            ✦ Cortinas<span className="text-[var(--charcoal)]">Pro</span>
          </div>
          <div className="text-xs text-[var(--mid)]">{today}</div>
        </div>
      </nav>
      <div className="flex bg-[var(--warm-white)] border-b border-[var(--border)] overflow-x-auto sticky top-[49px] z-40">
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 min-w-[70px] px-1.5 py-2.5 text-[11px] font-semibold text-center whitespace-nowrap border-b-2 transition-colors ${
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
