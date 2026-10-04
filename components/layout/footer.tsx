import Link from "next/link";
import { getPublishedPlaceZones } from "@/lib/zones";

// Estilo home v2 (design_handoff_home_v2): fondo #111, acento lima #C8E64E, rojo solo
// en el "Live" del logo. Vive en app/layout.tsx (vía FooterGate) para salir en todas
// las páginas públicas — antes estaba en SiteLayout y solo lo tenían 4 páginas.

const TICKER_ITEMS = [
  "EVENTOS",
  "ACTIVIDADES",
  "RESTAURANTES",
  "CAFÉS",
  "BARES",
  "PROMOS BANCARIAS",
  "EDICIONES SEMANALES",
] as const;

const EXPLORE_LINKS = [
  { href: "/eventos/hoy", label: "Eventos de hoy" },
  { href: "/actividades", label: "Actividades" },
  { href: "/promos", label: "Promos bancarias" },
  { href: "/edicion", label: "Ediciones" },
  { href: "/buscar", label: "Buscar lugares" },
] as const;

function TickerContent() {
  return (
    <span className="font-display text-sm font-extrabold tracking-[0.06em]">
      {TICKER_ITEMS.map((item, i) => (
        <span key={item}>
          <span className={i % 2 === 1 ? "text-[#C8E64E]" : "text-white"}>{item}</span>
          <span className="mx-4 text-white/30">✦</span>
        </span>
      ))}
    </span>
  );
}

function ColumnTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 text-xs font-bold uppercase tracking-[0.12em] text-white/40">
      {children}
    </div>
  );
}

const LINK_CLASS =
  "text-[15px] text-white/80 transition-colors hover:text-[#C8E64E]";

export async function Footer() {
  const zones = await getPublishedPlaceZones();

  return (
    <footer className="mt-20 overflow-hidden bg-[#111111] text-white md:mt-28">
      <div
        aria-hidden
        className="overflow-hidden whitespace-nowrap border-b border-white/10 py-3"
      >
        <div className="marquee-track">
          <TickerContent />
          <TickerContent />
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-[22px] pb-8 pt-14 md:px-10 md:pt-20">
        <div className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div className="col-span-2 md:col-span-1">
            <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-[#C8E64E]">
              <span className="inline-block h-2 w-2 rounded-full bg-[#C8E64E]" />
              Todo lo que pasa en Guate
            </div>
            <p className="font-display text-[34px] font-extrabold leading-[1.02] tracking-[-0.02em] md:text-[44px]">
              ¿Qué hacemos <span className="text-[#C8E64E]">hoy</span>
              <br />
              en Guate?
            </p>
            <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-white/60">
              Lugares, eventos, actividades y promos curados cada semana. Sin
              relleno, con voz propia.
            </p>
            <Link
              href="/#newsletter"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#C8E64E] px-5 py-3 text-[13px] font-extrabold uppercase tracking-[0.04em] text-[#111111] transition-transform hover:-translate-y-0.5"
            >
              Recibí la edición semanal →
            </Link>
          </div>

          <nav aria-label="Explorar">
            <ColumnTitle>Explorar</ColumnTitle>
            <ul className="flex flex-col gap-3">
              {EXPLORE_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={LINK_CLASS}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Zonas">
            <ColumnTitle>Zonas</ColumnTitle>
            <ul className="flex flex-col gap-3">
              {zones.slice(0, 6).map((z) => (
                <li key={z.slug}>
                  <Link href={`/zona/${z.slug}/restaurantes`} className={LINK_CLASS}>
                    Lugares en {z.zone}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div
          aria-hidden
          className="mt-14 select-none font-display text-[30px] font-extrabold leading-none tracking-[-0.02em] md:mt-20 md:text-[40px]"
        >
          Guate<span className="text-[#E11D2E]">Live</span>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-white/40 md:flex-row md:items-center md:justify-between">
          <span>© {new Date().getFullYear()} GuateLive. Hecho en Guatemala.</span>
          <span>Restaurantes, cafés, bares, eventos y actividades en Guatemala.</span>
        </div>
      </div>
    </footer>
  );
}
