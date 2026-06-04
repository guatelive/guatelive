import Link from "next/link";
import { Search, UtensilsCrossed, Coffee, Wine, CalendarDays, Landmark, Sparkles, ArrowRight } from "lucide-react";
import { SiteLayout } from "@/components/layout/site-layout";
import { PlaceCard } from "@/components/cards/place-card";
import { EventCard } from "@/components/cards/event-card";
import { PromoCard } from "@/components/cards/promo-card";
import { FeaturedShowcase } from "@/components/home/featured-showcase";
import { categories, events, places as mockPlaces, promos } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "GuateLive — Cafés, restaurantes y eventos en Guate",
  description: "Descubrí los mejores lugares, eventos y promos bancarias en Guatemala City y Antigua.",
  openGraph: {
    title: "GuateLive — Cafés, restaurantes y eventos en Guate",
    description: "Descubre planes en Guatemala con voz editorial",
    type: "website",
    url: "https://guatelive.gt",
    images: [{ url: "/og-home.jpg", width: 1200, height: 630 }],
  },
};

const ICONS = { UtensilsCrossed, Coffee, Wine, CalendarDays, Landmark, Sparkles } as const;

export default async function HomePage() {
  const supabase = await createClient();
  const { data: dbPlaces, error: dbError } = await supabase
    .from("places")
    .select("id, name, slug, zone, rating, primary_category")
    .eq("is_active", true)
    .limit(6);

  const dbConnected = !dbError;
  const usingRealData = dbConnected && dbPlaces && dbPlaces.length > 0;
  return (
    <SiteLayout>
      {/* Hero */}
      <section className="px-4 pb-10 pt-8 sm:px-6 md:pt-16">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-serif text-4xl leading-[1.05] text-foreground md:text-6xl">
            Todo lo que pasa en Guate,{" "}
            <span className="italic text-primary">en un solo lugar.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground md:text-lg">
            Cafés escondidos, eventos del fin de semana y las promos bancarias que sí valen la pena.
          </p>

          <Link
            href="/buscar"
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

      {/* Categorías */}
      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="grid grid-cols-3 gap-3 md:grid-cols-6 md:gap-4">
          {categories.map((c) => {
            const Icon = ICONS[c.icon as keyof typeof ICONS];
            return (
              <Link
                key={c.slug}
                href={`/buscar?categoria=${c.slug}`}
                className="group flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary hover:-translate-y-0.5"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-xs font-medium text-foreground md:text-sm">{c.label}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Destacados */}
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

      {/* Banner de estado de conexión — solo visible en desarrollo */}
      <div className="mx-auto mt-8 max-w-6xl px-4 sm:px-6">
        {usingRealData ? (
          <p className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Supabase conectado · {dbPlaces!.length} lugar{dbPlaces!.length !== 1 ? "es" : ""} desde la DB
          </p>
        ) : dbConnected ? (
          <p className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            Supabase conectado · tabla vacía — mostrando mock data
          </p>
        ) : (
          <p className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            Sin conexión a Supabase — mostrando mock data
          </p>
        )}
      </div>

      {/* Recién agregados — datos reales de Supabase con fallback a mock */}
      <Section title="Recién agregados" link="/buscar" linkLabel="Ver mapa">
        {dbPlaces && dbPlaces.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {dbPlaces.map((p) => (
              <Link
                key={p.id}
                href={`/lugar/${p.slug}`}
                className="place-card cursor-pointer"
              >
                <div className="w-full h-48 bg-secondary flex items-center justify-center">
                  <span className="text-muted-foreground text-sm">Foto de {p.name}</span>
                </div>
                <div className="p-4">
                  <h4 className="font-serif text-lg mb-1">{p.name}</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    {p.zone} · {p.primary_category}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">⭐ {p.rating ?? "—"}</span>
                    <span className="text-xs badge-editorial">Ver</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {mockPlaces.slice(0, 6).map((p) => (
              <PlaceCard key={p.slug} place={p} />
            ))}
          </div>
        )}
      </Section>

      {/* Strip editorial */}
      <section className="mx-auto mt-16 max-w-6xl px-4 sm:px-6">
        <div className="rounded-3xl bg-foreground px-6 py-12 text-background md:px-12 md:py-16">
          <p className="text-xs uppercase tracking-[0.2em] opacity-60">Editorial</p>
          <h2 className="mt-3 max-w-2xl font-serif text-3xl leading-tight md:text-4xl">
            Cinco lugares para una primera cita sin estresar el presupuesto.
          </h2>
          <Link
            href="/"
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
          <Link href={link} className="text-sm font-medium text-primary hover:text-primary/80">
            {linkLabel} →
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
