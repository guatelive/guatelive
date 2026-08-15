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
