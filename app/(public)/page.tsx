import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SiteLayout } from "@/components/layout/site-layout";
// import { Search, UtensilsCrossed, Coffee, Wine, CalendarDays, Landmark, Sparkles } from "lucide-react";
// import { PlaceCard } from "@/components/cards/place-card";
// import { EventCard } from "@/components/cards/event-card";
// import { PromoCard } from "@/components/cards/promo-card";
// import { FeaturedShowcase } from "@/components/home/featured-showcase";
// import { categories, events, places as mockPlaces, promos } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/server";
import { BubbleSearch } from "@/components/home/bubble-search";
import { getPlacePhotoUrl } from "@/lib/google-places";
import { normalizeHours, getOpenStatus, guatNow } from "@/lib/hours-utils";

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

// const ICONS = { UtensilsCrossed, Coffee, Wine, CalendarDays, Landmark, Sparkles } as const;

export default async function HomePage() {
  const supabase = await createClient();

  const [{ data: recentPlaces }, { data: latestEdition }] = await Promise.all([
    supabase
      .from("places")
      .select("id, name, slug, zone, rating, primary_category, photo_reference, hours")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("editions")
      .select("number, slug, title, subtitle")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(1)
      .single(),
  ]);

  return (
    <SiteLayout>
      <BubbleSearch />

      {/* TODO: Uncomment when featured places curation is ready */}
      {/* <FeaturedShowcase /> */}

      {/* TODO: Uncomment when real categories/zones data is available */}
      {/* <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
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
      </section> */}

      {/* TODO: Uncomment when real events data is available */}
      {/* <Section title="Esta semana en Guate" link="/eventos" linkLabel="Ver todos">
        <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
          {events.map((e) => (
            <div key={e.slug} className="w-[78%] shrink-0 snap-start sm:w-[320px]">
              <EventCard event={e} />
            </div>
          ))}
        </div>
      </Section> */}

      {/* TODO: Uncomment when real promos data is available */}
      {/* <Section title="Promos del día" link="/promos" linkLabel="Ver todas">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {promos.slice(0, 4).map((p) => (
            <PromoCard key={p.id} promo={p} />
          ))}
        </div>
      </Section> */}

      {/* DEBUG: Remove when home is production-ready */}
      {/* <div className="mx-auto mt-8 max-w-6xl px-4 sm:px-6">
        {usingRealData ? (
          <p className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Supabase conectado · {dbPlaces!.length} lugar{dbPlaces!.length !== 1 ? "es" : ""} desde la DB
          </p>
        ) : (
          <p className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            Sin conexión a Supabase
          </p>
        )}
      </div> */}

      {/* Recién agregados — fotos reales de Google Places */}
      {recentPlaces && recentPlaces.length > 0 && (
        <Section title="Recién agregados" link="/buscar" linkLabel="Ver todos">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {recentPlaces.map((p) => {
              const openNow = getOpenStatus(normalizeHours(p.hours), guatNow());
              return (
                <Link
                  key={p.id}
                  href={`/lugar/${p.slug}`}
                  className="group overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-primary hover:-translate-y-0.5"
                >
                  <div className="relative h-48 w-full overflow-hidden">
                    <img
                      src={getPlacePhotoUrl(p.photo_reference, 600)}
                      alt={p.name}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                    {openNow !== 'unknown' && (
                      <span style={{
                        position: 'absolute', top: 10, right: 10,
                        padding: '3px 10px', borderRadius: '999px',
                        fontSize: '11px', fontWeight: 600,
                        backgroundColor: openNow === 'open' ? '#16a34a' : '#dc2626',
                        color: '#ffffff',
                      }}>
                        {openNow === 'open' ? 'Abierto' : 'Cerrado'}
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <h4 className="font-serif text-lg mb-1">{p.name}</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      {p.zone}{p.primary_category ? ` · ${p.primary_category}` : ""}
                    </p>
                    {p.rating && (
                      <span className="text-sm">⭐ {p.rating.toFixed(1)}</span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </Section>
      )}

      {/* Strip editorial */}
      {latestEdition && (
        <section className="mx-auto mt-16 max-w-6xl px-4 sm:px-6">
          <div className="rounded-3xl bg-foreground px-6 py-12 text-background md:px-12 md:py-16">
            <p className="text-xs uppercase tracking-[0.2em] opacity-60">
              Edición Nº {latestEdition.number}
            </p>
            <h2 className="mt-3 max-w-2xl font-serif text-3xl leading-tight md:text-4xl">
              {latestEdition.title}
            </h2>
            {latestEdition.subtitle && (
              <p className="mt-3 text-sm opacity-60">{latestEdition.subtitle}</p>
            )}
            <Link
              href={`/edicion/${latestEdition.slug}`}
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium underline-offset-4 hover:underline"
            >
              Leer la edición <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      )}
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
