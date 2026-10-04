const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MONTHS = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

function formatTime(timePart: string): string {
    const [h = '00', m = '00'] = timePart.split(':');
    return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
}

// dateStr/endStr se tratan como hora de pared de Guatemala (sin conversión de zona),
// igual que el resto del feature de eventos — ver lib/event-when.ts.
// Fecha y hora por separado, para layouts que las muestran en filas distintas
// (ficha de /evento/[slug]); formatDateLong las une en una sola línea.
export function formatDateParts(dateStr: string, endStr?: string | null): { date: string; time: string } {
    const [datePart, timePart = ''] = dateStr.split('T');
    const parts = datePart.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month, day);
    const date = `${DAYS[d.getDay()]} ${day} de ${MONTHS[month]}`;

    const start = formatTime(timePart);
    if (!endStr) return { date, time: start };
    const [, endTimePart = ''] = endStr.split('T');
    return { date, time: `${start}–${formatTime(endTimePart)}` };
}

export function formatDateLong(dateStr: string, endStr?: string | null): string {
    const { date, time } = formatDateParts(dateStr, endStr);
    return `${date} · ${time}`;
}
