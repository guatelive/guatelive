import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { PromoCard } from "@/components/cards/PromoCard";
import { banks, promos, zones, categories } from "@/lib/mock-data";

export const Route = createFileRoute("/promos")({
  head: () => ({
    meta: [
      { title: "Promos bancarias en Guate — GuateLive" },
      { name: "description", content: "Descuentos de BAC, BI, Industrial, Promerica y G&T en restaurantes y cafeterías." },
    ],
  }),
  component: PromosPage,
});

function PromosPage() {
  const [bank, setBank] = useState<string>("Todos");
  const filtered = bank === "Todos" ? promos : promos.filter((p) => p.bank === bank);

  return (
    <SiteLayout>
      <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
        <header className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Promos</p>
          <h1 className="mt-2 font-serif text-4xl md:text-5xl">
            Hoy 30% off en Cadejo, <span className="italic text-accent">mañana ya fue.</span>
          </h1>
          <p className="mt-3 text-muted-foreground">Descuentos bancarios vigentes en Guate y Antigua, actualizados cada semana.</p>
        </header>

        {/* Filters */}
        <div className="mt-8 space-y-3">
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            <Chip active={bank === "Todos"} onClick={() => setBank("Todos")}>Todos</Chip>
            {banks.map((b) => (
              <Chip key={b} active={bank === b} onClick={() => setBank(b)}>{b}</Chip>
            ))}
          </div>
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {categories.slice(0, 4).map((c) => (
              <Chip key={c.slug}>{c.label}</Chip>
            ))}
            {zones.slice(0, 4).map((z) => (
              <Chip key={z}>{z}</Chip>
            ))}
          </div>
        </div>

        {/* Featured */}
        <section className="mt-10">
          <h2 className="font-serif text-2xl">Lo más popular esta semana</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {promos.slice(0, 3).map((p) => <PromoCard key={p.id} promo={p} />)}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="font-serif text-2xl">Todas las promos</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => <PromoCard key={p.id} promo={p} />)}
          </div>
        </section>
      </div>
    </SiteLayout>
  );
}

function Chip({ children, active, onClick }: { children: React.ReactNode; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground hover:border-primary"
      }`}
    >
      {children}
    </button>
  );
}
