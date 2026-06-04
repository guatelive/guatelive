import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Phone, MessageCircle, MapPin, Instagram, Star, ChevronDown, Clock } from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { PlaceCard } from "@/components/cards/PlaceCard";
import { EventCard } from "@/components/cards/EventCard";
import { PromoCard } from "@/components/cards/PromoCard";
import { events, findPlace, places, promos } from "@/lib/mock-data";

export const Route = createFileRoute("/lugar/$slug")({
  head: ({ params }) => {
    const p = findPlace(params.slug);
    return {
      meta: [
        { title: `${p?.name ?? "Lugar"} — GuateLive` },
        { name: "description", content: p?.description?.[0] ?? "Descubrí este lugar en GuateLive." },
        { property: "og:title", content: p?.name ?? "Lugar" },
        { property: "og:image", content: p?.image ?? "" },
      ],
    };
  },
  loader: ({ params }) => {
    const place = findPlace(params.slug);
    if (!place) throw notFound();
    return { place };
  },
  notFoundComponent: () => (
    <SiteLayout>
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <h1 className="font-serif text-3xl">Lugar no encontrado</h1>
        <Link to="/" className="mt-6 inline-block text-primary underline">Volver al inicio</Link>
      </div>
    </SiteLayout>
  ),
  errorComponent: ({ error }) => (
    <SiteLayout>
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <h1 className="font-serif text-2xl">Algo salió mal</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      </div>
    </SiteLayout>
  ),
  component: PlacePage,
});

const reviews = [
  { name: "Mariana L.", initial: "M", rating: 5, text: "Mi lugar favorito de los jueves. La Cabra siempre fría, la pizza buenísima y el ambiente nunca decepciona.", date: "hace 2 sem" },
  { name: "Carlos R.", initial: "C", rating: 4, text: "Buen lugar para llevar amigos de afuera. A veces se llena demasiado los viernes, ir temprano.", date: "hace 1 mes" },
  { name: "Sofía A.", initial: "S", rating: 5, text: "Stand up del jueves estuvo brutal. Comida rica, cervezas rotativas siempre interesantes.", date: "hace 1 mes" },
  { name: "Diego M.", initial: "D", rating: 5, text: "Probé toda la carta de cervezas en 3 visitas. La Lover IPA y la temporada de calabaza son mis tops.", date: "hace 2 meses" },
];

function PlacePage() {
  const { place } = Route.useLoaderData() as { place: NonNullable<ReturnType<typeof findPlace>> };
  const gallery = place.images ?? [place.image, place.image, place.image, place.image];
  const placePromos = promos.filter((p) => p.placeName === place.name);
  const placeEvents = events.filter((e) => e.venueSlug === place.slug);
  const similar = places.filter((p) => p.slug !== place.slug).slice(0, 3);

  return (
    <SiteLayout>
      {/* Gallery */}
      <section className="mx-auto max-w-6xl md:px-6 md:pt-6">
        <div className="md:hidden">
          <img src={gallery[0]} alt={place.name} className="aspect-[4/3] w-full object-cover" />
        </div>
        <div className="hidden gap-2 md:grid md:grid-cols-4 md:grid-rows-2 md:overflow-hidden md:rounded-3xl" style={{ height: 480 }}>
          <img src={gallery[0]} alt="" className="col-span-2 row-span-2 h-full w-full object-cover" />
          {gallery.slice(1, 5).map((g, i) => (
            <img key={i} src={g} alt="" className="h-full w-full object-cover" />
          ))}
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 pt-6 sm:px-6 lg:grid-cols-[1fr_360px]">
        <div>
          {/* Title block */}
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>{place.category}</span>
              <span>·</span>
              <span>{place.zone}</span>
            </div>
            <h1 className="mt-2 font-serif text-4xl text-foreground md:text-5xl">{place.name}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
              <span className="inline-flex items-center gap-1.5">
                <Star className="h-4 w-4 fill-foreground text-foreground" />
                <span className="font-semibold">{place.rating}</span>
                <span className="text-muted-foreground">({place.reviews} reseñas)</span>
              </span>
              <span className="text-muted-foreground">{"Q".repeat(place.price)}</span>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${place.openNow ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${place.openNow ? "bg-emerald-500" : "bg-muted-foreground"}`} />
                {place.openNow ? `Abierto hasta las 23:00` : "Cerrado"}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {place.tags.map((t) => (
                <span key={t} className="rounded-full bg-secondary px-2.5 py-1 text-[11px] text-secondary-foreground">{t}</span>
              ))}
            </div>
          </div>

          {/* About */}
          <section className="mt-10">
            <h2 className="font-serif text-2xl text-foreground">Sobre el lugar</h2>
            <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-muted-foreground">
              {(place.description ?? [
                "Un lugar querido del barrio, con identidad propia y clientela fiel. Vení a conocerlo.",
              ]).map((p, i) => <p key={i}>{p}</p>)}
            </div>
          </section>

          {placePromos.length > 0 && (
            <section className="mt-10">
              <h2 className="font-serif text-2xl text-foreground">Promociones activas</h2>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {placePromos.map((p) => <PromoCard key={p.id} promo={p} />)}
              </div>
            </section>
          )}

          {/* Hours */}
          <section className="mt-10">
            <details className="rounded-2xl border border-border bg-card p-5 group">
              <summary className="flex cursor-pointer items-center justify-between text-sm font-medium">
                <span className="inline-flex items-center gap-2"><Clock className="h-4 w-4" /> Horarios</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <ul className="mt-4 space-y-1.5 text-sm">
                {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d, i) => (
                  <li key={d} className="flex justify-between text-muted-foreground">
                    <span className={i === 3 ? "font-semibold text-foreground" : ""}>{d}</span>
                    <span>{i === 6 ? "Cerrado" : "16:00 — 00:00"}</span>
                  </li>
                ))}
              </ul>
            </details>
          </section>

          {/* Events */}
          {placeEvents.length > 0 && (
            <section className="mt-10">
              <h2 className="font-serif text-2xl text-foreground">Próximos eventos aquí</h2>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {placeEvents.map((e) => <EventCard key={e.slug} event={e} />)}
              </div>
            </section>
          )}

          {/* Reviews */}
          <section className="mt-12">
            <h2 className="font-serif text-2xl text-foreground">Reseñas</h2>
            <div className="mt-4 flex items-end gap-6 rounded-2xl border border-border bg-card p-5">
              <div>
                <div className="font-serif text-5xl text-foreground">{place.rating}</div>
                <div className="mt-1 flex gap-0.5">
                  {[1,2,3,4,5].map(i => <Star key={i} className={`h-3.5 w-3.5 ${i <= Math.round(place.rating) ? "fill-foreground text-foreground" : "text-border"}`} />)}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{place.reviews} reseñas</div>
              </div>
              <div className="flex-1 space-y-1.5">
                {[5,4,3,2,1].map((s, i) => (
                  <div key={s} className="flex items-center gap-2 text-xs">
                    <span className="w-3 text-muted-foreground">{s}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div className="h-full bg-accent" style={{ width: `${[72, 18, 6, 2, 2][i]}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              {reviews.map((r) => (
                <div key={r.name} className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-serif text-primary-foreground">{r.initial}</div>
                    <div>
                      <div className="text-sm font-medium">{r.name}</div>
                      <div className="text-xs text-muted-foreground">{r.date}</div>
                    </div>
                    <div className="ml-auto flex gap-0.5">
                      {[1,2,3,4,5].map(i => <Star key={i} className={`h-3 w-3 ${i <= r.rating ? "fill-foreground text-foreground" : "text-border"}`} />)}
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{r.text}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Similar */}
          <section className="mt-12">
            <h2 className="font-serif text-2xl text-foreground">Lugares similares cerca</h2>
            <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {similar.map((p) => <PlaceCard key={p.slug} place={p} />)}
            </div>
          </section>
        </div>

        {/* Sidebar actions desktop */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-2xl border border-border bg-card p-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contacto</div>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />{place.address ?? `${place.zone}, Guatemala City`}</div>
              <div className="flex items-start gap-2"><Phone className="mt-0.5 h-4 w-4 text-muted-foreground" />{place.phone ?? "+502 2222 0000"}</div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <ActionBtn icon={Phone} label="Llamar" />
              <ActionBtn icon={MessageCircle} label="WhatsApp" />
              <ActionBtn icon={MapPin} label="Cómo llegar" />
              <ActionBtn icon={Instagram} label="Instagram" />
            </div>
          </div>
        </aside>
      </div>

      {/* Sticky action bar mobile */}
      <div className="fixed inset-x-0 bottom-16 z-30 border-t border-border bg-background/95 px-2 py-2 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-md items-center justify-around">
          <MobileAction icon={Phone} label="Llamar" />
          <MobileAction icon={MessageCircle} label="WhatsApp" />
          <MobileAction icon={MapPin} label="Mapa" />
          <MobileAction icon={Instagram} label="Instagram" />
        </div>
      </div>
    </SiteLayout>
  );
}

function ActionBtn({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <button className="flex flex-col items-center gap-1 rounded-xl border border-border bg-background px-2 py-3 text-xs font-medium hover:border-primary hover:text-primary">
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
function MobileAction({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <button className="flex min-h-[44px] flex-col items-center justify-center gap-0.5 px-4 py-1 text-[10px] font-medium text-foreground">
      <Icon className="h-5 w-5 text-primary" />
      {label}
    </button>
  );
}
