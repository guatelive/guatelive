import type { DbBankPromotion } from "@/lib/types";

const BANK_LABELS: Record<string, string> = {
  bac: "BAC",
};

export function PromoCard({ promo }: { promo: DbBankPromotion }) {
  const bankLabel = BANK_LABELS[promo.bank] ?? promo.bank.toUpperCase();
  const validUntilLabel = promo.valid_until
    ? new Date(promo.valid_until).toLocaleDateString("es-GT", { day: "numeric", month: "short" })
    : null;

  return (
    <div className="group overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
        {promo.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- dominio del CDN de BAC no está en next.config images.remotePatterns, mismo criterio que edition.cover_image_url en app/edicion/page.tsx
          <img
            src={promo.image_url}
            alt={promo.merchant_name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-foreground/5 px-4 text-center font-serif text-lg text-muted-foreground">
            {promo.merchant_name}
          </div>
        )}
        <div className="absolute right-3 top-3 rounded-lg bg-background/95 px-2 py-1 text-[10px] font-bold tracking-wider text-primary backdrop-blur">
          {bankLabel}
        </div>
        <div className="absolute bottom-3 left-3 max-w-[80%] rounded-xl bg-primary px-3 py-1.5 text-primary-foreground">
          {promo.discount_pct !== null ? (
            <>
              <span className="font-serif text-2xl font-semibold leading-none">{promo.discount_pct}%</span>
              <span className="ml-1 text-xs font-medium">OFF</span>
            </>
          ) : (
            <span className="text-xs font-semibold leading-tight">{promo.discount_label}</span>
          )}
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-serif text-base text-foreground">{promo.merchant_name}</h3>
        {validUntilLabel && (
          <p className="mt-1 text-xs text-muted-foreground">Vence {validUntilLabel}</p>
        )}
      </div>
    </div>
  );
}
