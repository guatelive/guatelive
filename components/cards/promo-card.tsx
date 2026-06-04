import Image from "next/image";
import type { Promo } from "@/lib/mock-data";

export function PromoCard({ promo }: { promo: Promo }) {
  return (
    <div className="group overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
        <Image
          src={promo.placeImage}
          alt={promo.placeName}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute right-3 top-3 rounded-lg bg-background/95 px-2 py-1 text-[10px] font-bold tracking-wider text-primary backdrop-blur">
          {promo.bank}
        </div>
        <div className="absolute bottom-3 left-3 rounded-xl bg-primary px-3 py-1.5 text-primary-foreground">
          <span className="font-serif text-2xl font-semibold leading-none">{promo.discount}%</span>
          <span className="ml-1 text-xs font-medium">OFF</span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-serif text-base text-foreground">{promo.placeName}</h3>
        <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
          <span>{promo.days}</span>
          <span>Vence {promo.expires}</span>
        </div>
      </div>
    </div>
  );
}
