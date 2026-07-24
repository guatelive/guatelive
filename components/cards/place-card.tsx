import { ImageWithSkeleton } from '@/components/ui/image-with-skeleton';
import type { OpenStatus } from '@/lib/hours-utils';

type PlaceCardProps = {
    place: {
        id?: string;
        slug?: string;
        name: string;
        zone?: string | null;
        rating?: number | null;
        rating_count?: number | null;
        primary_category?: string | null;
        category?: string | null;
        primary_photo_url?: string | null;
        tags?: string[] | null;
    };
    openNow?: OpenStatus;
};

export function PlaceCard({ place, openNow }: PlaceCardProps) {
    const imageUrl = place.primary_photo_url;
    const rating = place.rating ?? 0;
    const reviewCount = place.rating_count ?? 0;
    const category = place.primary_category ?? place.category ?? 'Restaurante';
    const tags = place.tags ?? [];

    return (
        <div className="rounded-lg overflow-hidden bg-white border border-border hover:shadow-lg transition-shadow cursor-pointer">
            {/* Imagen */}
            <div className="relative h-48 w-full bg-[#E5E5E5]">
                {imageUrl && (
                    <ImageWithSkeleton
                        src={imageUrl}
                        alt={place.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                )}
                {/* Badge abierto/cerrado */}
                {openNow && openNow !== 'unknown' && (
                    <div
                        style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            padding: '3px 10px',
                            borderRadius: '999px',
                            fontSize: '11px',
                            fontWeight: 600,
                            backgroundColor: openNow === 'open' ? '#16a34a' : '#dc2626',
                            color: '#ffffff',
                            letterSpacing: '0.02em',
                        }}
                    >
                        {openNow === 'open' ? 'Abierto' : 'Cerrado'}
                    </div>
                )}
            </div>

            {/* Contenido */}
            <div className="p-4 flex flex-col">
                <h3 className="font-bold text-lg">{place.name}</h3>

                {category && (
                    <p className="text-sm text-muted-foreground">{category}</p>
                )}

                <div className="flex items-center justify-between mt-2">
                    {rating > 0 ? (
                        <div className="flex items-center gap-2">
                            <span className="text-yellow-500">★</span>
                            <span className="text-sm font-medium">{rating.toFixed(1)}</span>
                            <span className="text-xs text-muted-foreground">({reviewCount})</span>
                        </div>
                    ) : (
                        place.zone ? (
                            <span className="text-xs text-muted-foreground">{place.zone}</span>
                        ) : <span />
                    )}
                    <span
                        className="text-xs font-semibold text-[#E11D2E] transition-transform hover:-translate-y-0.5 hover:drop-shadow-sm"
                        style={{ fontFamily: 'var(--font-sans)' }}
                    >
                        Ver más →
                    </span>
                </div>

                {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                        {tags.slice(0, 3).map((tag: string) => (
                            <span key={tag} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
