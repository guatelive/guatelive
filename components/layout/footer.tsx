import Link from "next/link";
import { getPublishedPlaceZones } from "@/lib/zones";

export async function Footer() {
  const zones = await getPublishedPlaceZones();

  return (
    <footer className="mt-24 hidden border-t border-border bg-background pb-10 pt-16 md:block">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <div className="font-serif text-2xl text-primary">GuateLive</div>
            <p className="mt-3 text-sm text-muted-foreground">
              Todo lo que pasa en Guate, en un solo lugar.
            </p>
          </div>
          <div>
            <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Zonas
            </div>
            <ul className="space-y-2 text-sm">
              {zones.slice(0, 6).map((z) => (
                <li key={z.slug}>
                  <Link
                    href={`/zona/${z.slug}/restaurantes`}
                    className="text-foreground/80 hover:text-primary"
                  >
                    Lugares en {z.zone}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          {/* Explorar — comentado hasta tener /promos y /eventos activos
          <div>
            <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Explorar
            </div>
            <ul className="space-y-2 text-sm">
              <li><Link href="/promos" className="text-foreground/80 hover:text-primary">Promos bancarias</Link></li>
              <li><Link href="/eventos" className="text-foreground/80 hover:text-primary">Eventos esta semana</Link></li>
              <li><Link href="/dashboard" className="text-foreground/80 hover:text-primary">Para negocios</Link></li>
            </ul>
          </div> */}
          {/* Legal — comentado hasta tener páginas de términos y privacidad
          <div>
            <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Legal
            </div>
            <ul className="space-y-2 text-sm">
              <li><a className="text-foreground/80 hover:text-primary" href="#">Términos</a></li>
              <li><a className="text-foreground/80 hover:text-primary" href="#">Privacidad</a></li>
              <li><a className="text-foreground/80 hover:text-primary" href="#">Contacto</a></li>
            </ul>
          </div> */}
        </div>
        <div className="mt-10 border-t border-border pt-6 text-xs text-muted-foreground">
          © 2026 GuateLive. Hecho en Guatemala.
        </div>
      </div>
    </footer>
  );
}
