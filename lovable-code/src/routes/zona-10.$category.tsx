import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Map, SlidersHorizontal, ChevronDown } from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { PlaceCard } from "@/components/cards/PlaceCard";
import { places } from "@/lib/mock-data";

export const Route = createFileRoute("/zona-10/$category")({
  head: ({ params }) => {
    const cat = params.category === "cafeterias" ? "Cafeterías" : params.category;
    return {
      meta: [
        { title: `${cat} en Zona 10 — GuateLive` },
        {
          name: "description",
          content: `Las mejores ${cat.toLowerCase()} en Zona 10, Guatemala City. Horarios, fotos, precios y reseñas reales.`,
        },
        { property: "og:title", content: `${cat} en Zona 10` },
      ],
    };
  },
  component: CategoryListingPage,
});

const filters = ["Precio", "Abierto ahora", "Con WiFi", "Pet friendly", "Mejor calificados"];

const faqs = [
  {
    q: "¿Cuáles son las cafeterías para trabajar con WiFi en Zona 10?",
    a: "Las favoritas para trabajar son Sophos, ByOscar y Café Barista. Las tres tienen WiFi estable, suficientes enchufes y staff que no te apura aunque te quedes 4 horas.",
  },
  {
    q: "¿Hay cafés pet friendly en Zona 10?",
    a: "Sí. ByOscar tiene patio para mascotas, y varios espacios al aire libre en Zona Viva permiten perros bajo la mesa. Confirmá llamando antes de ir.",
  },
  {
    q: "¿A qué hora abren las cafeterías en Zona 10?",
    a: "La mayoría abre entre 7:00 y 8:00 entre semana. Fines de semana algunas abren un poco más tarde, alrededor de las 8:30 o 9:00.",
  },
  {
    q: "¿Dónde encuentro café de especialidad en Zona 10?",
    a: "ByOscar y Saúl Coffee trabajan con tostadores locales y métodos como V60 y aeropress. Si te gusta el café de origen, son tu mejor parada.",
  },
];

function CategoryListingPage() {
  const { category } = Route.useParams();
  const label = category === "cafeterias" ? "Cafeterías" : category;
  const list = [...places, ...places].slice(0, 12);

  return (
    <SiteLayout>
      <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-primary">Guate</Link>
          <ChevronRight className="h-3 w-3" />
          <span>Zona 10</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">{label}</span>
        </nav>

        {/* Title */}
        <header className="mt-4 max-w-3xl">
          <h1 className="font-serif text-4xl text-foreground md:text-5xl">
            {label} en Zona 10
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
            Zona 10 es probablemente el barrio cafetero más activo de Guatemala City. Entre la Avenida Reforma y el Boulevard Los Próceres encontrás desde cafeterías de especialidad con tostado propio hasta espacios tipo librería donde podés quedarte una tarde entera trabajando.
            <br /><br />
            Esta lista cubre los lugares que la gente de Zona 10 realmente frecuenta: Sophos para una tarde de lectura, ByOscar para una cita rápida, Café Barista para reuniones de trabajo, y Saúl para el brunch del domingo. Todos con WiFi confiable, baños limpios y baristas que conocen su oficio. Si buscás algo más alternativo, tirate dos zonas para Zona 4; pero si querés calidad consistente y ambiente cuidado, este es tu mapa.
          </p>
        </header>

        {/* Filter bar */}
        <div className="sticky top-16 z-30 -mx-4 mt-6 border-y border-border bg-background/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
          <div className="no-scrollbar flex items-center gap-2 overflow-x-auto">
            <button className="flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium md:hidden">
              <SlidersHorizontal className="h-3.5 w-3.5" /> Filtros
            </button>
            {filters.map((f) => (
              <button
                key={f}
                className="flex shrink-0 items-center gap-1 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary"
              >
                {f} <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </button>
            ))}
            <button className="ml-auto hidden shrink-0 items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground md:flex">
              <Map className="h-3.5 w-3.5" /> Ver mapa
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{list.length}</span> lugares
          </p>
          <button className="text-xs text-muted-foreground hover:text-primary">
            Ordenar: Recomendados
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p, i) => (
            <PlaceCard key={`${p.slug}-${i}`} place={p} />
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <button className="rounded-full border border-border bg-card px-6 py-3 text-sm font-medium hover:border-primary">
            Mostrar más
          </button>
        </div>

        {/* FAQ */}
        <section className="mt-16">
          <h2 className="font-serif text-2xl text-foreground md:text-3xl">Preguntas frecuentes</h2>
          <div className="mt-6 divide-y divide-border rounded-2xl border border-border bg-card">
            {faqs.map((f) => (
              <details key={f.q} className="group p-5">
                <summary className="flex cursor-pointer items-center justify-between gap-4 text-sm font-medium text-foreground">
                  {f.q}
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Related */}
        <section className="mt-12">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Búsquedas relacionadas
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              "Cafés con WiFi Zona 10",
              "Cafés para trabajar",
              "Cafeterías abiertas ahora",
              "Brunch en Zona 10",
              "Cafés pet friendly",
              "Café de especialidad Guate",
            ].map((t) => (
              <a
                key={t}
                href="/buscar"
                className="rounded-full border border-border bg-card px-3.5 py-1.5 text-xs text-foreground hover:border-primary"
              >
                {t}
              </a>
            ))}
          </div>
        </section>
      </div>
    </SiteLayout>
  );
}
