// Filtro de "¿Cuándo?" para eventos — a diferencia de los lugares (horario semanal
// recurrente, ver hours-utils.ts), un evento tiene una fecha puntual (date_start).
// Igual que formatDate en event-card.tsx, se parsean los componentes Y-M-D/H:M
// directo del string ISO en vez de construir un Date y leer campos UTC — date_start
// se trata como hora de pared de Guatemala, no como un instante UTC a convertir.

function parseDateParts(iso: string): { year: number; month: number; day: number; hour: number } {
    const [datePart, timePart = ''] = iso.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour = 0] = timePart.split(':').map(Number);
    return { year, month: month - 1, day, hour };
}

function dayNumber(year: number, month: number, day: number): number {
    return Date.UTC(year, month, day) / 86_400_000;
}

export function eventMatchesWhen(dateStartIso: string, selection: string, now: Date): boolean {
    if (selection === 'anytime') return true;

    const event = parseDateParts(dateStartIso);
    const today = {
        year: now.getUTCFullYear(),
        month: now.getUTCMonth(),
        day: now.getUTCDate(),
    };

    const eventDay = dayNumber(event.year, event.month, event.day);
    const todayDay = dayNumber(today.year, today.month, today.day);

    switch (selection) {
        case 'today':
            return eventDay === todayDay;
        case 'tonight':
            return eventDay === todayDay && event.hour >= 18;
        case 'tomorrow':
            return eventDay === todayDay + 1;
        case 'weekend': {
            const dow = new Date(Date.UTC(today.year, today.month, today.day)).getUTCDay(); // 0=domingo … 6=sábado
            const daysUntilFriday = dow <= 5 ? 5 - dow : 0;
            const fridayDay = todayDay + daysUntilFriday;
            const sundayDay = fridayDay + 2;
            return eventDay >= fridayDay && eventDay <= sundayDay;
        }
        default:
            return true;
    }
}
