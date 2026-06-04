import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, UtensilsCrossed, Coffee, Wine, CalendarDays, Landmark, Sparkles, ArrowRight } from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { PlaceCard } from "@/components/cards/PlaceCard";
import { EventCard } from "@/components/cards/EventCard";
import { PromoCard } from "@/components/cards/PromoCard";
import { FeaturedShowcase } from "@/components/home/FeaturedShowcase";
import { categories, events, places, promos } from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GuateLive — Cafés, restaurantes y eventos en Guate" },
      { name: "description", content: "Descubrí los mejores lugares, eventos y promos bancarias en Guatemala City y Antigua." },
    ],
  }),
  component: HomePage,
});

const ICONS = { UtensilsCrossed, Coffee, Wine, CalendarDays, Landmark, Sparkles } as const;

function HomePage() {
  return (
    <SiteLayout>
      {/* Hero */}
      <section className="px-4 pb-10 pt-8 sm:px-6 md:pt-16">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-serif text-4xl leading-[1.05] text-foreground md:text-6xl">
            Todo lo que pasa en Guate, <span className="italic text-accent">en un solo lugar.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground md:text-lg">
            Cafés escondidos, eventos del fin de semana y las promos bancarias que sí valen la pena.
          </p>

          <Link
            to="/buscar"
            className="mx-auto mt-8 flex max-w-xl items-center gap-3 rounded-full border border-border bg-card px-5 py-4 text-left shadow-sm transition-shadow hover:shadow-md"
          >
            <Search className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Busca cafés, restaurantes, eventos…
            </span>
            <span className="ml-auto hidden rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground md:inline">
              Buscar
            </span>
          </Link>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="grid grid-cols-3 gap-3 md:grid-cols-6 md:gap-4">
          {categories.map((c) => {
            const Icon = ICONS[c.icon as keyof typeof ICONS];
            return (
              <Link
                key={c.slug}
                to="/zona-10/$category"
                params={{ category: c.slug === "cafe" ? "cafeterias" : c.slug }}
                className="group flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary hover:-translate-y-0.5"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-xs font-medium text-foreground md:text-sm">{c.label}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured promotional showcase */}
      <FeaturedShowcase />

      {/* Esta semana */}
      <Section title="Esta semana en Guate" link="/eventos" linkLabel="Ver todos">
        <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
          {events.map((e) => (
            <div key={e.slug} className="w-[78%] shrink-0 snap-start sm:w-[320px]">
              <EventCard event={e} />
            </div>
          ))}
        </div>
      </Section>

      {/* Promos */}
      <Section title="Promos del día" link="/promos" linkLabel="Ver todas">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {promos.slice(0, 4).map((p) => (
            <PromoCard key={p.id} promo={p} />
          ))}
        </div>
      </Section>

      {/* Recién agregados */}
      <Section title="Recién agregados" link="/buscar" linkLabel="Ver mapa">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {places.slice(0, 6).map((p) => (
            <PlaceCard key={p.slug} place={p} />
          ))}
        </div>
      </Section>

      {/* Editorial strip */}
      <section className="mx-auto mt-16 max-w-6xl px-4 sm:px-6">
        <div className="rounded-3xl bg-primary px-6 py-12 text-primary-foreground md:px-12 md:py-16">
          <p className="text-xs uppercase tracking-[0.2em] opacity-70">Editorial</p>
          <h2 className="mt-3 max-w-2xl font-serif text-3xl leading-tight md:text-4xl">
            Cinco lugares para una primera cita sin estresar el presupuesto.
          </h2>
          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium underline-offset-4 hover:underline"
          >
            Leer la guía <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </SiteLayout>
  );
}

function Section({
  title,
  children,
  link,
  linkLabel,
}: {
  title: string;
  children: React.ReactNode;
  link?: string;
  linkLabel?: string;
}) {
  return (
    <section className="mx-auto mt-12 max-w-6xl px-4 sm:px-6">
      <div className="mb-5 flex items-end justify-between">
        <h2 className="font-serif text-2xl text-foreground md:text-3xl">{title}</h2>
        {link && (
          <a href={link} className="text-sm font-medium text-primary hover:text-accent">
            {linkLabel} →
          </a>
        )}
      </div>
      {children}
    </section>
  );
}
