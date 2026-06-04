import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import type { Place } from "@/lib/mock-data";

function priceLabel(level: 1 | 2 | 3 | 4) {
    return "Q".repeat(level);
}

export function PlaceCard({ place }: { place: Place }) {
    return (
        <Link
            to="/lugar/$slug"
            params={{ slug: place.slug }}
            className="group block overflow-hidden rounded-2xl bg-card transition-shadow hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)]"
        >
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                <img
                    src={place.image}
                    alt={place.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-background/90 px-2.5 py-1 text-[11px] font-medium backdrop-blur">
                    <span
                        className={`h-1.5 w-1.5 rounded-full ${place.openNow ? "bg-emerald-500" : "bg-muted-foreground"
                            }`}
                    />
                    {place.openNow ? "Abierto" : "Cerrado"}
                </div>
            </div>
            <div className="space-y-1.5 p-4">
                <div className="flex items-start justify-between gap-2">
                    <h3 className="font-serif text-lg leading-tight text-foreground">{place.name}</h3>
                    <div className="flex shrink-0 items-center gap-1 text-sm">
                        <Star className="h-3.5 w-3.5 fill-foreground text-foreground" />
                        <span className="font-medium">{place.rating}</span>
                        <span className="text-xs text-muted-foreground">({place.reviews})</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{place.category}</span>
                    <span>·</span>
                    <span>{priceLabel(place.price)}</span>
                    <span>·</span>
                    <span>{place.distance}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                    {place.tags.slice(0, 3).map((t) => (
                        <span
                            key={t}
                            className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] text-secondary-foreground"
                        >
                            {t}
                        </span>
                    ))}
                </div>
            </div>
        </Link>
    );
}
