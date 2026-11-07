import type { ActivityLocation, PriceTier } from '@/lib/types';

const DAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export type PriceDisplay =
    | { kind: 'free' }
    | { kind: 'priced'; label: string }
    | { kind: 'unknown' };

// Única fuente de verdad para decidir qué mostrar de precio — reemplaza la lógica
// `is_free ? … : price !== null ? … : null` que estaba duplicada (y ligeramente
// inconsistente) en cards, carrusel del home, explorer, detalle y JSON-LD.
export function priceDisplay(input: { is_free: boolean; price: number | null; price_tiers?: PriceTier[] }): PriceDisplay {
    const tiers = input.price_tiers ?? [];
    if (tiers.length > 0) {
        // Un tier de Q0 (ej. niños gratis) no es el precio "desde": sí se lista en el detalle.
        const paid = tiers.map(t => t.price).filter(price => price > 0);
        if (paid.length === 0) return { kind: 'free' };
        return { kind: 'priced', label: `Desde Q${Math.min(...paid)}` };
    }
    if (input.is_free) return { kind: 'free' };
    if (input.price !== null) return { kind: 'priced', label: `Q${input.price}` };
    return { kind: 'unknown' };
}

export function getCategoryColor(cat: string): string {
    const c = (cat || '').toLowerCase();
    if (c.includes('aventura')) return '#4A8A4A';
    if (
        c.includes('nocturna') || c.includes('cultura') ||
        c.includes('música') || c.includes('musica') ||
        c.includes('concierto') || c.includes('music')
    ) return '#E11D2E';
    if (c.includes('gastronom')) return '#E8A020';
    if (c.includes('familiar')) return '#185FA5';
    return '#666';
}

// dateStart puede ser ISO completo ("2026-07-06T18:00:00") o datetime-local ("2026-07-06T18:00")
export function formatEventDateTime(dateStart: string): string {
    if (!dateStart) return '';
    try {
        const [datePart, timePart = ''] = dateStart.split('T');
        const parts = datePart.split('-');
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        const [h = '00', m = '00'] = timePart.split(':');
        const dateStr = `${DAYS_SHORT[d.getDay()]} ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
        const timeStr = `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
        return `${dateStr} · ${timeStr}`;
    } catch {
        return '';
    }
}

export function eventLocation(event: { venue_name: string | null; zone: string }): string {
    return event.venue_name || event.zone || '';
}

// Todas las categorías de una actividad (la principal primero).
export function activityCategories(activity: { category: string; extra_categories?: string[] }): string[] {
    return [activity.category, ...(activity.extra_categories ?? [])];
}

type ActivityLocationInput = {
    venue_name: string | null;
    zone: string;
    recurrence_text: string | null;
    extra_locations?: ActivityLocation[];
};

// Zonas de todas las sedes de una actividad, sin repetir (la principal primero).
export function activityZones(activity: { zone: string; extra_locations?: ActivityLocation[] }): string[] {
    return Array.from(new Set([activity.zone, ...(activity.extra_locations ?? []).map(l => l.zone)]));
}

// Cuándo/dónde para cards. Con varias sedes no se muestra horario: el de la principal
// sería falso para las demás, el detalle lo lista por sede.
export function activityCardInfo(activity: ActivityLocationInput): { when: string | null; location: string } {
    const extras = activity.extra_locations ?? [];
    if (extras.length === 0) return { when: activity.recurrence_text, location: eventLocation(activity) };
    return { when: null, location: `${extras.length + 1} sedes: ${activityZones(activity).join(', ')}` };
}

// dateStart puede ser ISO completo ("2026-07-06T18:00:00") o datetime-local ("2026-07-06T18:00")
export function formatEventMeta(dateStart: string, zone: string): string {
    if (!dateStart) return '';
    try {
        const [datePart, timePart = ''] = dateStart.split('T');
        const parts = datePart.split('-');
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        const [h = '00', m = '00'] = timePart.split(':');
        const dateStr = `${DAYS_SHORT[d.getDay()]} ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
        const timeStr = `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
        return [dateStr, timeStr, zone].filter(Boolean).join(' · ');
    } catch {
        return zone || '';
    }
}
