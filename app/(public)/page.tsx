import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SiteLayout } from "@/components/layout/site-layout";
import { createClient } from "@/lib/supabase/server";
import { BubbleSearch } from "@/components/home/bubble-search";
import { EditionPeekTab } from "@/components/home/EditionPeekTab";
import { EventsCarousel } from "@/components/home/EventsCarousel";
import { normalizeHours, getOpenStatus, guatNow } from "@/lib/hours-utils";
import type { DbEvent } from "@/lib/types";

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

  const [{ data: recentPlaces }, { data: latestEdition }, { data: upcomingEvents }] = await Promise.all([
    supabase
      .from("places")
      .select("id, name, slug, zone, rating, primary_category, hours, place_photos(url, is_primary, order_index)")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("editions")
      .select(`number, slug, title, subtitle, cover_image_url,
          edition_places(photo_url, order_index, places(name, place_photos(url, is_primary, order_index)))`)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from("events")
      .select("id, title, slug, description, category, zone, venue_name, date_start, price, image_url, contact_link, sponsored")
      .eq("status", "published")
      .gte("date_start", new Date().toISOString())
      .order("date_start", { ascending: true })
      .limit(12),
  ]);

  return (
    <SiteLayout>
      <BubbleSearch />
      <EventsCarousel events={(upcomingEvents ?? []) as DbEvent[]} />
      {/* Comentado intencionalmente: con "recién agregados" eliminado,
         la sección editorial quedó arriba y es fácil de encontrar sin este tab.
         Reactivar cuando el home crezca y la editorial vuelva a quedar
         más abajo en el scroll. */}
      {/* <EditionPeekTab /> */}

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

      {/* Recién agregados */}
      {/* {recentPlaces && recentPlaces.length > 0 && (
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
                  <div className="relative h-48 w-full bg-[#F0F0F0] overflow-hidden">
                    {p.primary_photo_url && (
                      <img
                        src={p.primary_photo_url}
                        alt={p.name}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    )}
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
                    <div className="flex items-center justify-between">
                      {p.rating ? (
                        <span className="text-sm">⭐ {p.rating.toFixed(1)}</span>
                      ) : <span />}
                      <span className="text-xs font-semibold text-[#E11D2E] transition-transform group-hover:-translate-y-0.5">
                        Ver más →
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </Section>
      )} */}

      {/* Strip editorial */}
      {latestEdition && (() => {
        // Recopilar hasta 3 fotos: cover + fotos de edition_places
        type PhotoItem = { src: string; name?: string };
        type EpPhoto = { url: string; is_primary: boolean; order_index: number };
        const epItems = ((latestEdition.edition_places as Array<{ photo_url?: string | null; places?: { name?: string | null; place_photos?: EpPhoto[] } | null }>) ?? [])
          .map(ep => {
            const photos = ep.places?.place_photos ?? [];
            const placePhoto = photos.find(p => p.is_primary)?.url ?? [...photos].sort((a, b) => a.order_index - b.order_index)[0]?.url ?? null;
            return {
              src: ep.photo_url || placePhoto,
              name: ep.places?.name ?? undefined,
            };
          })
          .filter(item => item.src)
          .reverse() as PhotoItem[];

        const photos: PhotoItem[] = [];
        if (latestEdition.cover_image_url) photos.push({ src: latestEdition.cover_image_url });
        for (const item of epItems) { if (photos.length < 3) photos.push(item); }

        const rotations = [-4, 2, -2];
        const translateY = [6, 0, 10];

        return (
          <section className="mx-auto mt-8 sm:mt-16 max-w-6xl px-4 sm:px-6">
            {/* Section label */}
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, color: '#E11D2E', letterSpacing: '0.25em', textTransform: 'uppercase' }}>
              EDITORIAL
            </p>
            <div style={{ width: 30, height: 2, backgroundColor: '#E11D2E', marginTop: 6, marginBottom: 20 }} />

            <div className="relative rounded-3xl bg-foreground text-background overflow-hidden">

              {/* Imagen de fondo en mobile */}
              {photos[0] && (
                <div className="absolute inset-0 md:hidden">
                  <img src={photos[0].src} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-[#0A0A0A]/75" />
                </div>
              )}

              <div className="relative flex flex-col md:flex-row md:items-center">

                {/* Texto + CTA */}
                <div className="flex-1 min-w-0 md:min-w-[320px] px-6 py-10 md:px-12 md:py-14">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#E11D2E]">
                    Edición Nº {latestEdition.number}
                  </p>
                  <div className="mt-2 h-[2px] w-8 bg-[#E11D2E]" />
                  <h2 className="mt-3 font-serif text-3xl leading-tight md:text-4xl">
                    {(() => {
                      const idx = latestEdition.title.indexOf('?');
                      if (idx === -1) return latestEdition.title;
                      const before = latestEdition.title.slice(0, idx + 1);
                      const after = latestEdition.title.slice(idx + 1).trim();
                      return (
                        <>
                          {before}
                          {after && (
                            <span style={{ display: 'block', marginTop: '10px' }}>
                              <span style={{
                                background: '#fff',
                                color: '#0A0A0A',
                                padding: '2px 8px',
                                whiteSpace: 'nowrap',
                                boxDecorationBreak: 'clone',
                                WebkitBoxDecorationBreak: 'clone',
                              }}>
                                {after}
                              </span>
                            </span>
                          )}
                        </>
                      );
                    })()}
                  </h2>
                  {latestEdition.subtitle && (
                    <p className="mt-3 text-sm opacity-60 max-w-sm">{latestEdition.subtitle}</p>
                  )}
                  <Link
                    href={`/edicion/${latestEdition.slug}`}
                    className="animate-bounce mt-6 inline-flex items-center gap-1.5 rounded-full bg-[#E11D2E] px-5 py-2.5 text-sm font-semibold text-white shadow-lg"
                    style={{ fontFamily: 'var(--font-sans)' }}
                  >
                    Leé la edición <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                {/* Fotos polaroid — solo desktop */}
                {photos.length > 0 && (
                  <div className="hidden md:flex items-center justify-center gap-3 pr-8 py-6 shrink-0">
                    {photos.map((photo, i) => (
                      <div
                        key={i}
                        style={{
                          width: 200,
                          height: 295,
                          borderRadius: 12,
                          overflow: 'hidden',
                          flexShrink: 0,
                          position: 'relative',
                          transform: `rotate(${rotations[i] ?? 0}deg) translateY(${translateY[i] ?? 0}px)`,
                          boxShadow: '0 20px 56px rgba(0,0,0,0.75)',
                          border: '3px solid rgba(255,255,255,0.09)',
                        }}
                      >
                        {/* Imagen con filtro editorial */}
                        <img
                          src={photo.src}
                          alt={photo.name ?? ''}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block',
                            transform: 'scale(1.12)',
                            transformOrigin: 'center center',
                          }}
                        />
                        {/* Viñeta */}
                        <div style={{
                          position: 'absolute', inset: 0,
                          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.45) 100%)',
                          pointerEvents: 'none',
                        }} />
                        {/* Tinte cálido */}
                        <div style={{
                          position: 'absolute', inset: 0,
                          background: 'rgba(20,10,0,0.12)',
                          pointerEvents: 'none',
                        }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        );
      })()}

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
