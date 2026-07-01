const DAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

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

export type CategoryStyle = { bar: string; pillBg: string; pillText: string; dot: string };

const CATEGORY_STYLES: Record<string, CategoryStyle> = {
    aventura: { bar: '#4A8A4A', pillBg: '#1a3a1a', pillText: '#6bcb6b', dot: '#4A8A4A' },
    nocturna: { bar: '#E11D2E', pillBg: '#3a1212', pillText: '#f08080', dot: '#E11D2E' },
    gastronomia: { bar: '#E8A020', pillBg: '#2a1f08', pillText: '#f5c842', dot: '#E8A020' },
    familiar: { bar: '#185FA5', pillBg: '#0e1f38', pillText: '#7ab8f5', dot: '#185FA5' },
    cultura: { bar: '#7040C0', pillBg: '#20103a', pillText: '#c09ff5', dot: '#7040C0' },
    default: { bar: '#666666', pillBg: '#222222', pillText: '#aaaaaa', dot: '#666666' },
};

export function getCategoryStyle(cat: string): CategoryStyle {
    const c = (cat || '').toLowerCase();
    if (c.includes('aventura')) return CATEGORY_STYLES.aventura;
    if (
        c.includes('nocturna') || c.includes('música') ||
        c.includes('musica') || c.includes('concierto') || c.includes('music')
    ) return CATEGORY_STYLES.nocturna;
    if (c.includes('gastronom')) return CATEGORY_STYLES.gastronomia;
    if (c.includes('familiar')) return CATEGORY_STYLES.familiar;
    if (c.includes('cultura') || c.includes('taller')) return CATEGORY_STYLES.cultura;
    return CATEGORY_STYLES.default;
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
