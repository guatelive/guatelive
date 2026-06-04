import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { MapPin, Clock, Calendar } from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { EventCard } from "@/components/cards/EventCard";
import { events, findEvent } from "@/lib/mock-data";

export const Route = createFileRoute("/eventos/$slug")({
  head: ({ params }) => {
    const e = findEvent(params.slug);
    return {
      meta: [
        { title: `${e?.title ?? "Evento"} — GuateLive` },
        { name: "description", content: e?.description ?? "Evento en GuateLive." },
        { property: "og:title", content: e?.title ?? "" },
        { property: "og:image", content: e?.image ?? "" },
      ],
    };
  },
  loader: ({ params }) => {
    const event = findEvent(params.slug);
    if (!event) throw notFound();
    return { event };
  },
  notFoundComponent: () => (
    <SiteLayout>
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <h1 className="font-serif text-3xl">Evento no encontrado</h1>
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
  component: EventPage,
});

function EventPage() {
  const { event } = Route.useLoaderData() as { event: NonNullable<ReturnType<typeof findEvent>> };
  const others = events.filter((e) => e.slug !== event.slug).slice(0, 4);

  return (
    <SiteLayout>
      <section className="mx-auto max-w-6xl md:px-6 md:pt-6">
        <img src={event.image} alt={event.title} className="aspect-[16/9] w-full object-cover md:rounded-3xl" />
      </section>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 pt-8 sm:px-6 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="flex items-start gap-5">
            <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <span className="font-serif text-3xl leading-none">{event.day}</span>
              <span className="mt-1 text-[10px] font-semibold tracking-wider opacity-80">{event.month}</span>
            </div>
            <div>
              <h1 className="font-serif text-3xl text-foreground md:text-4xl">{event.title}</h1>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {event.time}</span>
                {event.venueSlug ? (
                  <Link to="/lugar/$slug" params={{ slug: event.venueSlug }} className="inline-flex items-center gap-1 text-primary hover:underline">
                    <MapPin className="h-3.5 w-3.5" /> {event.venue}
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {event.venue}</span>
                )}
              </div>
            </div>
          </div>

          <section className="mt-10">
            <h2 className="font-serif text-2xl">Sobre este evento</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
              {event.description ??
                "Un evento imperdible para quienes buscan algo distinto el fin de semana. Cupos limitados, llegá temprano para asegurar buen lugar."}
            </p>
          </section>

          <section className="mt-10">
            <h2 className="font-serif text-2xl">Más eventos en este lugar</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {others.slice(0, 4).map((e) => <EventCard key={e.slug} event={e} />)}
            </div>
          </section>
        </div>

        <aside>
          <div className="sticky top-24 space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Entrada</div>
              <div className="mt-1 font-serif text-3xl text-foreground">{event.price}</div>
              <button className="mt-4 w-full rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90">
                Comprar entrada — {event.price}
              </button>
              <p className="mt-2 text-center text-[11px] text-muted-foreground">Pago seguro con Recurrente</p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Lugar</div>
              <div className="mt-1 font-medium">{event.venue}</div>
              <div className="mt-3 aspect-[4/3] overflow-hidden rounded-xl bg-muted">
                <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=600&q=80" alt="" className="h-full w-full object-cover" />
              </div>
              <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" /> {event.day} {event.month} · {event.time}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </SiteLayout>
  );
}
