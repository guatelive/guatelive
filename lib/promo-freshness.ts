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

// Fecha de hoy en Guatemala como "YYYY-MM-DD" — mismo formato que la columna
// `valid_until` (date), para compararla como string o pasarla a un filtro de
// Supabase.
export function guatTodayISO(): string {
    return guatNow().toISOString().slice(0, 10);
}

// Un banco puede seguir listando una promo después de su fecha de vencimiento
// (pasó con G&T en 2026-10: Osos y Negroni 57 vencidas el 09-30 seguían en su
// sitio), así que "visto hoy en el sitio del banco" no basta para mostrarla.
// `valid_until` es inclusivo: la promo vale todo ese día.
export function isPromoExpired(validUntil: string | null, today: string = guatTodayISO()): boolean {
    return validUntil !== null && validUntil < today;
}

// Filtro para `.or()` de Supabase: promos sin fecha de vencimiento o que
// todavía no vencieron. Va junto a `.eq('is_active', true)` en toda query
// pública de bank_promotions.
export function notExpiredPromoFilter(): string {
    return `valid_until.is.null,valid_until.gte.${guatTodayISO()}`;
}
