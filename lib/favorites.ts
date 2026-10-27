// Favoritos sin cuenta: viven en el localStorage del navegador (ver ADR-028). Un
// store mínimo con suscripción, para que todos los ❤️ y el contador del header se
// actualicen juntos (useSyncExternalStore en hooks/use-favorites.ts), también entre
// pestañas vía el evento `storage`. Si el navegador bloquea el storage (modo privado,
// datos bloqueados), funciona en memoria durante la sesión.

export type FavoriteType = 'place' | 'event' | 'activity';
export type Favorites = Record<FavoriteType, string[]>;

const KEY = 'guatelive:favorites';
const ANON_KEY = 'guatelive:anon-id';
export const EMPTY_FAVORITES: Favorites = { place: [], event: [], activity: [] };

let cache: Favorites | null = null;
const listeners = new Set<() => void>();

function read(): Favorites {
    try {
        const raw = localStorage.getItem(KEY);
        const parsed = raw ? (JSON.parse(raw) as Partial<Favorites>) : {};
        return {
            place: Array.isArray(parsed.place) ? parsed.place : [],
            event: Array.isArray(parsed.event) ? parsed.event : [],
            activity: Array.isArray(parsed.activity) ? parsed.activity : [],
        };
    } catch {
        return EMPTY_FAVORITES;
    }
}

export function getFavorites(): Favorites {
    if (cache === null) cache = read();
    return cache;
}

function emit() {
    listeners.forEach(l => l());
}

export function subscribeFavorites(listener: () => void): () => void {
    listeners.add(listener);
    const onStorage = (e: StorageEvent) => {
        if (e.key === KEY) {
            cache = read();
            emit();
        }
    };
    window.addEventListener('storage', onStorage);
    return () => {
        listeners.delete(listener);
        window.removeEventListener('storage', onStorage);
    };
}

// Devuelve true si quedó guardado, false si se quitó.
export function toggleFavorite(type: FavoriteType, slug: string): boolean {
    const current = getFavorites();
    const saved = current[type].includes(slug);
    cache = {
        ...current,
        [type]: saved ? current[type].filter(s => s !== slug) : [slug, ...current[type]],
    };
    try {
        localStorage.setItem(KEY, JSON.stringify(cache));
    } catch {
        // storage bloqueado: queda en memoria
    }
    emit();
    return !saved;
}

export function countFavorites(f: Favorites): number {
    return f.place.length + f.event.length + f.activity.length;
}

// Id anónimo y estable por navegador, solo para contar usuarios únicos en el log.
export function getAnonId(): string {
    try {
        const existing = localStorage.getItem(ANON_KEY);
        if (existing) return existing;
        const id = crypto.randomUUID();
        localStorage.setItem(ANON_KEY, id);
        return id;
    } catch {
        return crypto.randomUUID();
    }
}
