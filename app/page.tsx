import Link from "next/link";
import PublicQuoteForm from "@/components/PublicQuoteForm";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--linen)]">
      <nav className="sticky top-0 z-50" style={{ background: "var(--gradient)" }}>
        <div className="max-w-2xl mx-auto flex items-center justify-between px-5 py-4">
          <div className="leading-tight">
            <div className="text-lg font-extrabold tracking-tight text-white drop-shadow-sm">Cortinajes</div>
            <div className="text-[11px] font-semibold text-white/85 -mt-0.5 tracking-wide">Claudia Burgos</div>
          </div>
          <Link
            href="/cortinas"
            className="text-xs font-semibold text-white bg-white/15 rounded-full px-3.5 py-1.5"
          >
            Intranet
          </Link>
        </div>
      </nav>

      <header className="px-5 py-10 text-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--charcoal)]">
          Cortinas, rollers y screeners a medida
        </h1>
        <p className="text-[var(--mid)] mt-3 text-[15px]">
          Cotiza online en segundos: elige tu producto, ingresa las medidas y recibe tu presupuesto en PDF directo a tu correo.
        </p>
      </header>

      <main className="flex-1 max-w-md w-full mx-auto px-4 pb-16">
        <PublicQuoteForm />
      </main>

      <footer className="text-center text-xs text-[var(--mid)] pb-8">
        © {new Date().getFullYear()} Cortinajes Claudia Burgos
      </footer>
    </div>
  );
}
