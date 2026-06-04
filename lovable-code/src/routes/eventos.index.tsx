import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { EventCard } from "@/components/cards/EventCard";
import { events } from "@/lib/mock-data";

export const Route = createFileRoute("/eventos/")({
  head: () => ({
    meta: [
      { title: "Eventos en Guate — GuateLive" },
      { name: "description", content: "Eventos esta semana en Guatemala City y Antigua: música, cine, cultura y más." },
    ],
  }),
  component: EventsIndex,
});

function EventsIndex() {
  return (
    <SiteLayout>
      <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
        <header className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Agenda</p>
          <h1 className="mt-2 font-serif text-4xl md:text-5xl">Esta semana en Guate</h1>
          <p className="mt-3 text-muted-foreground">Jazz, cine francés, ferias, stand up. Todo lo que pasa de jueves a domingo.</p>
        </header>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {events.concat(events).map((e, i) => (
            <EventCard key={`${e.slug}-${i}`} event={e} />
          ))}
        </div>
      </div>
    </SiteLayout>
  );
}
