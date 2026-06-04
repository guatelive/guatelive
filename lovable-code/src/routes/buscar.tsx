import { createFileRoute } from "@tanstack/react-router";
import { Search, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { PlaceCard } from "@/components/cards/PlaceCard";
import { EventCard } from "@/components/cards/EventCard";
import { PromoCard } from "@/components/cards/PromoCard";
import { events, places, promos } from "@/lib/mock-data";

export const Route = createFileRoute("/buscar")({
  head: () => ({
    meta: [{ title: "Buscar en GuateLive" }],
  }),
  component: SearchPage,
});

function SearchPage() {
  const [q, setQ] = useState("");
  const hasResults = q.length === 0 || places.some((p) => p.name.toLowerCase().includes(q.toLowerCase()));
  const matchedPlaces = q ? places.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()) || p.zone.toLowerCase().includes(q.toLowerCase())) : places.slice(0, 6);
  const matchedEvents = q ? events.filter((e) => e.title.toLowerCase().includes(q.toLowerCase())) : events.slice(0, 3);
  const matchedPromos = promos.slice(0, 3);

  return (
    <SiteLayout>
      <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
        <div className="flex items-center gap-3 rounded-full border border-border bg-card px-4 py-3 shadow-sm">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Busca cafés, restaurantes, eventos…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <button className="rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground">
            Buscar
          </button>
        </div>

        <div className="mt-6 grid gap-8 lg:grid-cols-[240px_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-2xl border border-border bg-card p-5">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <SlidersHorizontal className="h-4 w-4" /> Filtros
              </div>
              {["Categoría", "Zona", "Precio", "Calificación", "Abierto ahora"].map((f) => (
                <div key={f} className="border-t border-border py-3 first:border-0 first:pt-0">
                  <div className="text-xs font-medium text-muted-foreground">{f}</div>
                  <div className="mt-1.5 text-sm">Todos</div>
                </div>
              ))}
            </div>
          </aside>

          <div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {matchedPlaces.length + matchedEvents.length + matchedPromos.length} resultados {q && <>para "<span className="text-foreground">{q}</span>"</>}
              </p>
              <button className="text-xs text-muted-foreground hover:text-primary">Ordenar: Relevancia</button>
            </div>

            {!hasResults && q && (
              <div className="mt-10 rounded-3xl border border-dashed border-border bg-card p-10 text-center">
                <div className="font-serif text-2xl text-foreground">No encontramos nada por aquí.</div>
                <p className="mt-2 text-sm text-muted-foreground">Probá con otra zona o categoría.</p>
              </div>
            )}

            {matchedPlaces.length > 0 && (
              <section className="mt-6">
                <h2 className="mb-3 font-serif text-xl">Lugares</h2>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {matchedPlaces.map((p) => <PlaceCard key={p.slug} place={p} />)}
                </div>
              </section>
            )}

            {matchedEvents.length > 0 && (
              <section className="mt-10">
                <h2 className="mb-3 font-serif text-xl">Eventos</h2>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {matchedEvents.map((e) => <EventCard key={e.slug} event={e} />)}
                </div>
              </section>
            )}

            {matchedPromos.length > 0 && (
              <section className="mt-10">
                <h2 className="mb-3 font-serif text-xl">Promos</h2>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {matchedPromos.map((p) => <PromoCard key={p.id} promo={p} />)}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
