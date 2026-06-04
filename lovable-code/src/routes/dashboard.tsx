import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { LayoutGrid, Store, CalendarDays, Tag, Star, BarChart3, CreditCard, ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — GuateLive" }] }),
  component: DashboardLayout,
});

const items = [
  { to: "/dashboard", label: "Overview", icon: LayoutGrid, exact: true },
  { to: "/dashboard", label: "Mi lugar", icon: Store },
  { to: "/dashboard", label: "Eventos", icon: CalendarDays },
  { to: "/dashboard", label: "Promociones", icon: Tag },
  { to: "/dashboard", label: "Reseñas", icon: Star },
  { to: "/dashboard", label: "Analítica", icon: BarChart3 },
  { to: "/dashboard/upgrade", label: "Billing", icon: CreditCard },
];

function DashboardLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="font-serif text-xl font-semibold text-primary">GuateLive <span className="ml-1 rounded bg-secondary px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-secondary-foreground">Business</span></Link>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">CB</div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[220px_1fr]">
        <aside className="lg:sticky lg:top-8 lg:self-start">
          <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-border bg-card p-2 lg:flex-col lg:overflow-visible">
            {items.map((it, i) => {
              const active = (it.exact && pathname === it.to) || (!it.exact && pathname === it.to && i === 0);
              const Icon = it.icon;
              return (
                <Link
                  key={it.label}
                  to={it.to}
                  className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    active ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{it.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <main>
          {pathname === "/dashboard" ? <OverviewContent /> : <Outlet />}
        </main>
      </div>
    </div>
  );
}

function OverviewContent() {
  const stats = [
    { label: "Vistas este mes", value: "12,847", trend: "+18%" },
    { label: "Nuevas reseñas", value: "23", trend: "+4" },
    { label: "Eventos publicados", value: "5", trend: "—" },
    { label: "Plan actual", value: "Free", trend: "Upgrade" },
  ];

  return (
    <div>
      <div>
        <h1 className="font-serif text-3xl text-foreground">Buenas, Cadejo Brewing</h1>
        <p className="mt-1 text-sm text-muted-foreground">Esto es lo que pasó esta semana con tu lugar.</p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-4">
            <div className="text-xs text-muted-foreground">{s.label}</div>
            <div className="mt-2 font-serif text-2xl text-foreground">{s.value}</div>
            <div className="mt-1 text-[11px] text-accent">{s.trend}</div>
          </div>
        ))}
      </div>

      {/* Upgrade banner */}
      <div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-3xl bg-primary p-6 text-primary-foreground md:flex-row md:items-center md:p-8">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] opacity-70">Recomendado</p>
          <h2 className="mt-2 font-serif text-2xl md:text-3xl">Pasá a Pro y duplicá tus vistas.</h2>
          <p className="mt-2 text-sm opacity-80">Promos destacadas, estadísticas avanzadas, soporte prioritario.</p>
        </div>
        <Link to="/dashboard/upgrade" className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground">
          Upgrade a Pro <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      <section className="mt-8">
        <h2 className="font-serif text-xl">Acciones rápidas</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {["Publicar evento", "Agregar promoción", "Responder reseñas"].map((a) => (
            <button key={a} className="rounded-2xl border border-border bg-card p-5 text-left transition-colors hover:border-primary">
              <div className="font-medium">{a}</div>
              <div className="mt-1 text-xs text-muted-foreground">Tarda menos de un minuto</div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
