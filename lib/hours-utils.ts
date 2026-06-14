type HoursRecord = Record<string, string>;

const EN_TO_ES: Record<string, string> = {
    monday: 'lunes', tuesday: 'martes', wednesday: 'miércoles',
    thursday: 'jueves', friday: 'viernes', saturday: 'sábado', sunday: 'domingo',
};
const DAY_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

export function normalizeHours(raw: unknown): HoursRecord | null {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    const obj = raw as Record<string, unknown>;

    if (Object.keys(obj).some(k => DAY_NAMES.includes(k))) {
        return obj as HoursRecord;
    }

    if (Array.isArray(obj.weekday_text)) {
        const result: HoursRecord = {};
        (obj.weekday_text as string[]).forEach(line => {
            const colonIdx = line.indexOf(':');
            if (colonIdx > 0) {
                const rawDay = line.slice(0, colonIdx).toLowerCase().trim();
                const day = EN_TO_ES[rawDay] ?? rawDay;
                result[day] = line.slice(colonIdx + 1).trim();
            }
        });
        return Object.keys(result).length > 0 ? result : null;
    }

    return null;
}

function parseMinutes(timeStr: string): number {
    const amPm = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (amPm) {
        let h = parseInt(amPm[1]);
        const m = parseInt(amPm[2]);
        if (amPm[3].toUpperCase() === 'PM' && h !== 12) h += 12;
        if (amPm[3].toUpperCase() === 'AM' && h === 12) h = 0;
        return h * 60 + m;
    }
    const h24 = timeStr.match(/(\d+):(\d+)/);
    if (h24) return parseInt(h24[1]) * 60 + parseInt(h24[2]);
    return -1;
}

// Guatemala = UTC-6, sin horario de verano
export function guatNow(): Date {
    return new Date(Date.now() - 6 * 60 * 60 * 1000);
}

export type OpenStatus = 'open' | 'closed' | 'unknown';

export function getOpenStatus(hours: HoursRecord | null, at: Date): OpenStatus {
    if (!hours) return 'unknown';
    const dayName = DAY_NAMES[at.getUTCDay()];
    const hoursStr = hours[dayName];
    if (!hoursStr) return 'unknown';

    const lower = hoursStr.toLowerCase();
    if (lower.includes('cerrado') || lower.includes('closed')) return 'closed';
    if (lower.includes('24 horas') || lower.includes('24 hours') || lower.includes('open 24')) return 'open';

    const range = hoursStr.match(/(.+?)\s*[–\-]\s*(.+)/);
    if (!range) return 'unknown';

    const openMin = parseMinutes(range[1].trim());
    const closeMin = parseMinutes(range[2].trim());
    if (openMin === -1 || closeMin === -1) return 'unknown';

    const nowMin = at.getUTCHours() * 60 + at.getUTCMinutes();

    // Si cierra después de medianoche (ej: 22:00 – 2:00)
    const isOpen = closeMin < openMin
        ? nowMin >= openMin || nowMin < closeMin
        : nowMin >= openMin && nowMin < closeMin;

    return isOpen ? 'open' : 'closed';
}

// ¿Está abierto en algún momento hoy?
export function isOpenToday(hours: HoursRecord | null, date: Date): boolean {
    if (!hours) return true; // sin datos → asumir abierto
    const dayName = DAY_NAMES[date.getUTCDay()];
    const hoursStr = hours[dayName]?.toLowerCase() ?? '';
    if (!hoursStr) return true;
    return !hoursStr.includes('cerrado') && !hoursStr.includes('closed');
}

// ¿Está abierto esta noche? (checkea si está abierto a las 20:00)
export function isOpenTonight(hours: HoursRecord | null, date: Date): boolean {
    if (!hours) return true;
    const evening = new Date(date);
    evening.setUTCHours(20, 0, 0, 0);
    const status = getOpenStatus(hours, evening);
    return status !== 'closed';
}

// ¿Está abierto el fin de semana?
export function isOpenWeekend(hours: HoursRecord | null): boolean {
    if (!hours) return true;
    const sat = hours['sábado']?.toLowerCase() ?? '';
    const sun = hours['domingo']?.toLowerCase() ?? '';
    const satOpen = sat && !sat.includes('cerrado') && !sat.includes('closed');
    const sunOpen = sun && !sun.includes('cerrado') && !sun.includes('closed');
    return !!(satOpen || sunOpen);
}

// ¿Está abierto mañana en horario normal?
export function isOpenTomorrow(hours: HoursRecord | null, today: Date): boolean {
    if (!hours) return true;
    const tomorrowIdx = (today.getUTCDay() + 1) % 7;
    const dayName = DAY_NAMES[tomorrowIdx];
    const hoursStr = hours[dayName]?.toLowerCase() ?? '';
    if (!hoursStr) return true;
    return !hoursStr.includes('cerrado') && !hoursStr.includes('closed');
}

// OpenStatus para una selección de "Cuándo" — usado para badge y sorting
// 'unknown' = sin datos de horario o selección 'anytime' (sin badge)
export function openStatusForSelection(
    hours: HoursRecord | null,
    selection: string,
    now: Date
): OpenStatus {
    if (selection === 'anytime') return 'unknown';
    if (!hours) return 'unknown';

    switch (selection) {
        case 'today':
            return getOpenStatus(hours, now);
        case 'tonight': {
            const evening = new Date(now);
            evening.setUTCHours(20, 0, 0, 0);
            return getOpenStatus(hours, evening);
        }
        case 'tomorrow':
            return isOpenTomorrow(hours, now) ? 'open' : 'closed';
        case 'weekend':
            return isOpenWeekend(hours) ? 'open' : 'closed';
        default:
            return 'unknown';
    }
}
