import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { SiteLayout } from "@/components/layout/site-layout";
import { createClient } from "@/lib/supabase/server";
import { BubbleSearch } from "@/components/home/bubble-search";
import { EditionPeekTab } from "@/components/home/EditionPeekTab";
import { EventsGrid } from "@/components/home/EventsGrid";
import { guatNow } from "@/lib/hours-utils";
import type { DbEvent, DbBankPromotion } from "@/lib/types";
import { PromosCarousel } from "@/components/home/PromosCarousel";
import { resolvePromoPlaces } from "@/lib/promo-place-match";
import { SchemaMarkup } from "@/components/seo/schema-markup";
import { buildOrganizationSchema, buildWebSiteSchema } from "@/lib/schema-builders";

export const metadata = {
  title: "GuateLive — Cafés, restaurantes y eventos en Guate",
  description: "Restaurantes, cafés y eventos en Guatemala. Curados con criterio editorial.",
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

  const [{ data: recentPlaces }, { data: latestEdition }, { data: upcomingEvents }, { data: activePromos }, { data: promoMatchPlaces }] = await Promise.all([
    supabase
      .from("places")
      .select("id, name, slug, zone, rating, primary_category, hours, place_photos(url, is_primary, order_index)")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("editions")
      .select(`number, slug, title, subtitle, cover_image_url, strip_photos,
          edition_places(photo_url, order_index, places(name, place_photos(url, is_primary, order_index)))`)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from("events")
      .select("id, title, slug, description, category, zone, venue_name, place_id, source, date_start, date_end, price, is_free, image_url, contact_link, sponsored, featured, tags, status")
      .eq("status", "published")
      .gte("date_start", guatNow().toISOString())
      .order("featured", { ascending: false })
      .order("date_start", { ascending: true })
      .limit(12),
    supabase
      .from("bank_promotions")
      .select("*")
      .eq("is_active", true)
      .order("discount_pct", { ascending: false, nullsFirst: false })
      .limit(8),
    supabase.from("places").select("name, slug, zone").eq("is_published", true),
  ]);

  const promoPlaces = resolvePromoPlaces((activePromos ?? []) as DbBankPromotion[], promoMatchPlaces ?? []);
  const promosWithPlaces = ((activePromos ?? []) as DbBankPromotion[]).map((promo) => ({
    ...promo,
    places: promoPlaces.get(promo.id) ?? [],
  }));

  return (
    <SiteLayout>
      <SchemaMarkup schema={[buildOrganizationSchema(), buildWebSiteSchema()]} />
      <BubbleSearch />

      <EventsGrid events={(upcomingEvents ?? []) as DbEvent[]} />
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

      <PromosCarousel promos={promosWithPlaces} />

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

      {/* Sección editorial */}
      {latestEdition && (() => {
        type PhotoItem = { src: string; name?: string };
        type EpPhoto = { url: string; is_primary: boolean; order_index: number };

        // Preferir strip_photos si el editor las seleccionó; si no, fallback a edition_places
        const stripUrls: string[] = Array.isArray(latestEdition.strip_photos)
          ? (latestEdition.strip_photos as string[]).filter(Boolean)
          : [];

        const photos: PhotoItem[] = stripUrls.length > 0
          ? stripUrls.slice(0, 3).map(src => ({ src }))
          : ((latestEdition.edition_places as Array<{ photo_url?: string | null; places?: { name?: string | null; place_photos?: EpPhoto[] } | null }>) ?? [])
            .map(ep => {
              const epPhotos = ep.places?.place_photos ?? [];
              const placePhoto = epPhotos.find(p => p.is_primary)?.url ?? [...epPhotos].sort((a, b) => a.order_index - b.order_index)[0]?.url ?? null;
              return { src: ep.photo_url || placePhoto, name: ep.places?.name ?? undefined } as PhotoItem;
            })
            .filter(item => item.src)
            .slice(0, 3);

        const rotations = [-4, 2, -2];
        const translateY = [6, 0, 10];

        return (
          <section className="mx-auto mt-6 max-w-6xl px-4 sm:px-6" style={{ borderTop: '0.5px solid #E5E5E5', paddingBottom: '1.5rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', paddingTop: '0.85rem', paddingBottom: '0.7rem' }}>
              <div>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, color: '#E11D2E', letterSpacing: '0.25em', textTransform: 'uppercase' }}>
                  EDITORIAL
                </p>
                <div style={{ width: 28, height: 2, backgroundColor: '#E11D2E', marginTop: 6 }} />
              </div>
              <Link
                href="/edicion"
                style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, color: '#E11D2E', letterSpacing: '0.02em', textDecoration: 'none' }}
              >
                Ver todas las ediciones →
              </Link>
            </div>

            <div className="relative rounded-3xl bg-foreground text-background overflow-hidden">

              {/* Imagen de fondo en mobile */}
              {photos[0] && (
                <div className="absolute inset-0 md:hidden">
                  <Image src={photos[0].src} alt="" fill sizes="100vw" className="object-cover" />
                  <div className="absolute inset-0 bg-[#0A0A0A]/75" />
                </div>
              )}

              <div className="relative flex flex-col md:flex-row md:items-center">

                {/* Texto + CTA */}
                <div className="flex-1 min-w-0 md:min-w-[420px] px-6 py-10 md:px-12 md:py-14">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#E11D2E]">
                    Edición Nº {latestEdition.number}
                  </p>
                  <div className="mt-2 h-[2px] w-8 bg-[#E11D2E]" />
                  <h2 className="mt-3 font-serif leading-tight" style={{ fontSize: 'clamp(28px, 4vw, 44px)' }}>
                    {(() => {
                      const idx = latestEdition.title.indexOf('?');
                      if (idx === -1) return latestEdition.title;
                      const before = latestEdition.title.slice(0, idx + 1);
                      const after = latestEdition.title.slice(idx + 1).trim();
                      return (
                        <>
                          <span>{before}</span>
                          {after && (
                            <span style={{ display: 'block', marginTop: '10px' }}>
                              <span
                                style={{
                                  background: '#fff',
                                  color: '#0A0A0A',
                                  padding: '2px 8px',
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
                    <p className="mt-3 text-base opacity-60 max-w-sm">{latestEdition.subtitle}</p>
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
                        <Image
                          src={photo.src}
                          alt={photo.name ?? ''}
                          fill
                          sizes="200px"
                          className="object-cover"
                          style={{
                            transform: 'scale(1.12)',
                            transformOrigin: 'center center',
                          }}
                        />
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
