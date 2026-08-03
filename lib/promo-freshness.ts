import { guatNow } from './hours-utils';
import type { DbBankPromotion } from './types';

// Usa el last_seen_at más reciente de las promos ya fetcheadas (sin query
// nueva) — el scraper sobrescribe last_seen_at en cada corrida del cron,
// aunque el contenido de una promo no haya cambiado, así que esto refleja
// cuándo se revisó el listado de verdad, no solo cuándo cambió el texto.
export function formatUpdatedLabel(promos: DbBankPromotion[]): string {
    const mostRecent = promos.reduce<string | null>(
        (max, p) => (!max || p.last_seen_at > max ? p.last_seen_at : max),
        null
    );
    if (!mostRecent) return 'Actualizado recientemente';

    const diffDays = Math.floor((guatNow().getTime() - new Date(mostRecent).getTime()) / 86_400_000);
    if (diffDays <= 0) return 'Actualizado hoy';
    if (diffDays === 1) return 'Actualizado ayer';
    if (diffDays <= 6) return `Actualizado hace ${diffDays} días`;
    return `Actualizado el ${new Date(mostRecent).toLocaleDateString('es-GT', { day: 'numeric', month: 'short' })}`;
}
