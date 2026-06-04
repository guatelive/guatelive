import { createFileRoute } from "@tanstack/react-router";
import { Check, X } from "lucide-react";

export const Route = createFileRoute("/dashboard/upgrade")({
  head: () => ({ meta: [{ title: "Upgrade a Pro — GuateLive" }] }),
  component: UpgradePage,
});

const features = [
  { f: "Aparecer en el directorio", free: true, pro: true },
  { f: "Hasta 3 fotos", free: true, pro: false },
  { f: "Fotos ilimitadas + galería", free: false, pro: true },
  { f: "1 evento al mes", free: true, pro: false },
  { f: "Eventos ilimitados", free: false, pro: true },
  { f: "Promociones destacadas", free: false, pro: true },
  { f: "Analítica avanzada", free: false, pro: true },
  { f: "Responder reseñas", free: false, pro: true },
  { f: "Soporte prioritario", free: false, pro: true },
];

const faqs = [
  { q: "¿Cómo me cobran?", a: "Suscripción mensual o anual con Recurrente. Podés cancelar cuando querás." },
  { q: "¿Hay contrato?", a: "No. Sin contratos, sin sorpresas. Si cancelás, mantenés Pro hasta fin del período pagado." },
  { q: "¿Cambio de plan?", a: "Sí, podés cambiar entre mensual y anual desde tu dashboard." },
];

function UpgradePage() {
  return (
    <div>
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Plan Pro</p>
        <h1 className="mt-2 font-serif text-4xl text-foreground md:text-5xl">
          Más vistas. Más reservas. <span className="italic text-accent">Más Pro.</span>
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Todo lo que necesitás para que tu lugar destaque entre miles de opciones en Guate.
        </p>
      </div>

      <div className="mx-auto mt-10 grid max-w-3xl gap-4 md:grid-cols-2">
        <Plan name="Free" price="Q0" cadence="siempre" current>
          <ul className="space-y-2 text-sm">
            {features.map((f) => (
              <Row key={f.f} ok={f.free} label={f.f} />
            ))}
          </ul>
        </Plan>
        <Plan name="Pro" price="Q250" cadence="al mes" highlight tag="Q2,500 / año (ahorrás 17%)">
          <ul className="space-y-2 text-sm">
            {features.map((f) => (
              <Row key={f.f} ok={f.pro} label={f.f} bold={f.pro && !f.free} />
            ))}
          </ul>
          <button className="mt-6 w-full rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90">
            Suscribirme con Recurrente
          </button>
        </Plan>
      </div>

      <section className="mx-auto mt-16 max-w-2xl">
        <h2 className="font-serif text-2xl">Preguntas sobre facturación</h2>
        <div className="mt-4 divide-y divide-border rounded-2xl border border-border bg-card">
          {faqs.map((f) => (
            <details key={f.q} className="group p-5">
              <summary className="cursor-pointer text-sm font-medium">{f.q}</summary>
              <p className="mt-3 text-sm text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}

function Plan({ name, price, cadence, children, highlight, current, tag }: any) {
  return (
    <div className={`rounded-3xl border p-6 ${highlight ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}>
      <div className="flex items-center justify-between">
        <div className="font-serif text-2xl">{name}</div>
        {current && <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">Tu plan</span>}
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="font-serif text-4xl">{price}</span>
        <span className={`text-sm ${highlight ? "opacity-80" : "text-muted-foreground"}`}>/ {cadence}</span>
      </div>
      {tag && <div className="mt-1 text-xs opacity-80">{tag}</div>}
      <div className="mt-5">{children}</div>
    </div>
  );
}

function Row({ ok, label, bold }: { ok: boolean; label: string; bold?: boolean }) {
  return (
    <li className="flex items-center gap-2">
      {ok ? <Check className="h-4 w-4 shrink-0" /> : <X className="h-4 w-4 shrink-0 opacity-40" />}
      <span className={`${bold ? "font-medium" : ""} ${!ok ? "opacity-50 line-through" : ""}`}>{label}</span>
    </li>
  );
}
