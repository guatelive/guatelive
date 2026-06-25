const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MONTHS = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

// dateStr/endStr se tratan como hora de pared de Guatemala (sin conversión de zona),
// igual que el resto del feature de eventos — ver lib/event-when.ts.
export function formatDateLong(dateStr: string, endStr?: string | null): string {
    const [datePart, timePart = ''] = dateStr.split('T');
    const parts = datePart.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const [h = '00', m = '00'] = timePart.split(':');
    const d = new Date(year, month, day);
    const start = `${DAYS[d.getDay()]} ${day} de ${MONTHS[month]} · ${h.padStart(2, '0')}:${m.padStart(2, '0')}`;

    if (!endStr) return start;
    const [, endTimePart = ''] = endStr.split('T');
    const [endH = '00', endM = '00'] = endTimePart.split(':');
    return `${start}–${endH.padStart(2, '0')}:${endM.padStart(2, '0')}`;
}
