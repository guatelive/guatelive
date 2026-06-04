import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import type { Place } from "@/lib/mock-data";

function priceLabel(level: 1 | 2 | 3 | 4) {
  return "Q".repeat(level);
}

export function PlaceCard({ place }: { place: any }) {
  // Fallback para imagen si no existe
  const imageUrl = place.image || "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&h=600&q=80";
  const rating = place.rating || place.rate || 0;
  const reviews = place.rating_count || place.reviews || 0;
  const category = place.primary_category || place.category || "Restaurante";
  const price = place.price || 2;
  const distance = place.distance || "—";
  const tags = place.tags || [];

  return (
    <Link
      href={`/lugar/${place.slug}`}
      className="group block overflow-hidden rounded-2xl bg-card transition-shadow hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)]"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        <Image
          src={imageUrl}
          alt={place.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-background/90 px-2.5 py-1 text-[11px] font-medium backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Disponible
        </div>
      </div>
      <div className="space-y-1.5 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-serif text-lg leading-tight text-foreground">{place.name}</h3>
          <div className="flex shrink-0 items-center gap-1 text-sm">
            {rating > 0 && (
              <>
                <Star className="h-3.5 w-3.5 fill-foreground text-foreground" />
                <span className="font-medium">{rating.toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">({reviews})</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{category}</span>
          <span>·</span>
          <span>{typeof price === 'number' ? "Q".repeat(Math.min(price, 4)) : "Q"}</span>
          <span>·</span>
          <span>{distance}</span>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {tags.slice(0, 3).map((t: string) => (
              <span
                key={t}
                className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] text-secondary-foreground"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
