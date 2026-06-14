import { getPlacePhotoUrl } from '@/lib/google-places';
import Image from 'next/image';
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
        photo_reference?: string | null;
        tags?: string[] | null;
    };
    openNow?: OpenStatus;
};

export function PlaceCard({ place, openNow }: PlaceCardProps) {
    const imageUrl = getPlacePhotoUrl(place.photo_reference);
    const rating = place.rating ?? 0;
    const reviewCount = place.rating_count ?? 0;
    const category = place.primary_category ?? place.category ?? 'Restaurante';
    const tags = place.tags ?? [];

    return (
        <div className="rounded-lg overflow-hidden bg-white border border-border hover:shadow-lg transition-shadow cursor-pointer">
            {/* Imagen */}
            <div className="relative h-48 w-full bg-gray-200">
                <Image
                    src={imageUrl}
                    alt={place.name}
                    fill
                    className="object-cover"
                    priority={false}
                    unoptimized
                />
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
            <div className="p-4">
                <h3 className="font-bold text-lg">{place.name}</h3>

                {category && (
                    <p className="text-sm text-muted-foreground">{category}</p>
                )}

                {rating > 0 && (
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-yellow-500">★</span>
                        <span className="text-sm font-medium">{rating.toFixed(1)}</span>
                        <span className="text-xs text-muted-foreground">({reviewCount})</span>
                    </div>
                )}

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
