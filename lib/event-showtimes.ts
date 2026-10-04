// Eventos con varias funciones (ej. obra de teatro con 4 fechas) — ver ADR-026 en
// docs/decisions.md. En DB, date_start es la PRIMERA función y extra_dates las demás.
//
// Los listados públicos no muestran la primera función sino la PRÓXIMA: los fetchers
// pasan cada evento por toUpcomingEvents()/focusWhen() antes de entregarlo a los
// componentes, que reescriben date_start = próxima función y extra_dates = las que
// quedan después. Así EventCard/EventsGrid/EventHeroPanel/EventExplorer muestran la
// fecha correcta sin tocar su formateo, y extra_dates.length es el "+N funciones".
//
// Fechas como hora de pared de Guatemala, comparadas como string "YYYY-MM-DDTHH:MM:SS"
// (igual que lib/event-when.ts) — nunca con new Date(), que en el browser aplicaría la
// zona local a un string sin offset.
import { eventMatchesWhen } from '@/lib/event-when';

type WithShowtimes = { date_start: string; date_end: string | null; extra_dates?: string[] | null };

// "2026-10-12T20:00" (datetime-local) y "2026-10-12T20:00:00" (DB) → mismo formato.
export function toWallClock(iso: string): string {
    const base = iso.slice(0, 19);
    return base.length === 16 ? `${base}:00` : base;
}

// guatNow() devuelve un Date "corrido" -6h; su ISO UTC ya es la hora de pared.
export function wallClockNow(now: Date): string {
    return now.toISOString().slice(0, 19);
}

export function getShowtimes(event: WithShowtimes): string[] {
    return [event.date_start, ...(event.extra_dates ?? [])];
}

function refocus<T extends WithShowtimes>(event: T, showtimes: string[]): T {
    const hasMany = (event.extra_dates ?? []).length > 0;
    return {
        ...event,
        date_start: showtimes[0],
        extra_dates: showtimes.slice(1),
        // date_end solo aplica a eventos de una función — con varias es ambiguo.
        date_end: hasMany ? null : event.date_end,
    };
}

// null si ya no le queda ninguna función (no debería pasar: los fetchers ya filtran
// date_last >= ahora en la query).
export function upcomingFrom<T extends WithShowtimes>(event: T, now: Date): T | null {
    const nowWall = wallClockNow(now);
    const upcoming = getShowtimes(event).filter(s => toWallClock(s) >= nowWall);
    return upcoming.length > 0 ? refocus(event, upcoming) : null;
}

// Filtro "¿Cuándo?" (hoy/esta noche/mañana/finde): el evento matchea si CUALQUIER
// función próxima cae en la ventana, y se enfoca en la primera que matchea — así
// "finde" muestra la función del sábado aunque la próxima sea el jueves.
export function focusWhen<T extends WithShowtimes>(event: T, selection: string, now: Date): T | null {
    const upcoming = upcomingFrom(event, now);
    if (!upcoming) return null;
    const showtimes = getShowtimes(upcoming);
    const firstMatch = showtimes.findIndex(s => eventMatchesWhen(s, selection, now));
    return firstMatch === -1 ? null : refocus(upcoming, showtimes.slice(firstMatch));
}

// Orden de los listados: próxima función asc, con featured primero si se pide.
export function sortByNextShowtime<T extends WithShowtimes & { featured?: boolean }>(
    events: T[],
    featuredFirst = false,
): T[] {
    return [...events].sort((a, b) => {
        if (featuredFirst && a.featured !== b.featured) return a.featured ? -1 : 1;
        return toWallClock(a.date_start).localeCompare(toWallClock(b.date_start));
    });
}

export function toUpcomingEvents<T extends WithShowtimes & { featured?: boolean }>(
    events: T[],
    now: Date,
    featuredFirst = false,
): T[] {
    const upcoming = events.map(e => upcomingFrom(e, now)).filter((e): e is T => e !== null);
    return sortByNextShowtime(upcoming, featuredFirst);
}

// Normaliza lo que manda el CMS: dedup, orden asc, y la más temprana pasa a ser
// date_start (si el admin agrega una función anterior a la "principal", no se rechaza).
export function normalizeShowtimes(dateStart: string, extraDates: string[]): { date_start: string; extra_dates: string[] } {
    const all = [...new Set([dateStart, ...extraDates].filter(Boolean).map(toWallClock))].sort();
    return { date_start: all[0], extra_dates: all.slice(1) };
}

export function showtimesLabel(count: number): string {
    return count === 1 ? '+1 función' : `+${count} funciones`;
}
