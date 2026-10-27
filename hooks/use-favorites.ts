'use client';

import { useSyncExternalStore } from 'react';
import { EMPTY_FAVORITES, getFavorites, subscribeFavorites, type Favorites } from '@/lib/favorites';

// En el server (y en el primer render del cliente) no hay favoritos: el ❤️ arranca
// vacío y se ajusta al hidratar, sin hydration mismatch.
export function useFavorites(): Favorites {
    return useSyncExternalStore(subscribeFavorites, getFavorites, () => EMPTY_FAVORITES);
}
