'use client';

import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useFavorites } from '@/hooks/use-favorites';
import { countFavorites } from '@/lib/favorites';

// Acceso a /favoritos en el header. El número solo aparece si hay algo guardado.
export function FavoritesNavLink() {
    const count = countFavorites(useFavorites());
    return (
        <Link
            href="/favoritos"
            aria-label={count > 0 ? `Mis favoritos (${count})` : 'Mis favoritos'}
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-[#111111] transition-colors hover:bg-[#F5F5F5]"
        >
            <Heart className="h-5 w-5" fill={count > 0 ? '#E11D2E' : 'none'} color={count > 0 ? '#E11D2E' : 'currentColor'} />
            {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#111111] px-1 text-[10px] font-bold text-white">
                    {count}
                </span>
            )}
        </Link>
    );
}
