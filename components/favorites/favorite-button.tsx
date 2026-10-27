'use client';

import { Heart } from 'lucide-react';
import { logFavoriteEvent } from '@/app/actions/favorites';
import { useFavorites } from '@/hooks/use-favorites';
import { getAnonId, toggleFavorite, type FavoriteType } from '@/lib/favorites';

interface Props {
    type: FavoriteType;
    slug: string;
    name: string;
    // overlay: círculo blanco sobre la imagen de una card. inline: botón con texto en el detalle.
    variant?: 'overlay' | 'inline';
}

export function FavoriteButton({ type, slug, name, variant = 'overlay' }: Props) {
    const favorites = useFavorites();
    const saved = favorites[type].includes(slug);

    function onClick(e: React.MouseEvent) {
        // Las cards están dentro de <Link>: el ❤️ no tiene que navegar.
        e.preventDefault();
        e.stopPropagation();
        const nowSaved = toggleFavorite(type, slug);
        void logFavoriteEvent({ anonId: getAnonId(), type, slug, action: nowSaved ? 'add' : 'remove' }).catch(() => {});
    }

    const label = saved ? `Quitar ${name} de favoritos` : `Guardar ${name} en favoritos`;

    if (variant === 'inline') {
        return (
            <button
                type="button"
                onClick={onClick}
                aria-pressed={saved}
                aria-label={label}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${saved
                    ? 'border-[#E11D2E] bg-[#E11D2E] text-white'
                    : 'border-[#E5E5E5] bg-white text-[#0A0A0A] hover:border-[#0A0A0A]'
                    }`}
            >
                <Heart className="h-4 w-4" fill={saved ? 'currentColor' : 'none'} />
                {saved ? 'Guardado' : 'Guardar'}
            </button>
        );
    }

    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={saved}
            aria-label={label}
            title={saved ? 'Quitar de favoritos' : 'Guardar'}
            className="absolute bottom-2 right-2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm transition hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#E11D2E]"
        >
            <Heart className={`h-[18px] w-[18px] ${saved ? 'text-[#E11D2E]' : 'text-[#0A0A0A]'}`} fill={saved ? 'currentColor' : 'none'} />
        </button>
    );
}
