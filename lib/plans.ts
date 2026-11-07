// Planes: combinaciones curadas de lugares, eventos y actividades para una ocasión.
// Ver supabase/migrations/20261104_create_plans.sql.
//
// starts_at/ends_at son hora de pared de Guatemala (timestamp sin zona, igual que
// events.date_start) — se comparan como string "YYYY-MM-DDTHH:MM:SS" contra
// wallClockNow(guatNow()), nunca con new Date() sobre el string sin offset.
import type { SupabaseClient } from '@supabase/supabase-js';
import { guatNow } from '@/lib/hours-utils';
import { toWallClock, wallClockNow } from '@/lib/event-showtimes';

export type PlanKind = 'ocasion' | 'siempre';
export type PlanStatus = 'draft' | 'published' | 'archived';
export type PlanItemType = 'place' | 'event' | 'activity' | 'custom';

export type DbPlan = {
    id: string;
    slug: string;
    title: string;
    subtitle: string | null;
    intro_text: string | null;
    cover_image_url: string | null;
    kind: PlanKind;
    starts_at: string | null;
    ends_at: string | null;
    theme_tags: string[];
    status: PlanStatus;
    sponsored: boolean;
    published_at: string | null;
};

type PhotoRow = { url: string; is_primary: boolean; order_index: number };

export type PlanItemRow = {
    id: string;
    order_index: number;
    item_type: PlanItemType;
    place_id: string | null;
    event_id: string | null;
    activity_id: string | null;
    custom_title: string | null;
    custom_subtitle: string | null;
    label: string | null;
    editorial_note: string | null;
    sponsored: boolean;
    places: { name: string; slug: string; zone: string | null; primary_category: string | null; place_photos: PhotoRow[] } | null;
    events: { title: string; slug: string; zone: string; venue_name: string | null; date_start: string; date_last: string; image_url: string | null } | null;
    activities: { title: string; slug: string; zone: string; category: string; image_url: string | null } | null;
};

// Lo que la ficha pública necesita de cada item, ya resuelto: título, link y tarjeta.
export type ResolvedPlanItem = {
    id: string;
    type: PlanItemType;
    label: string | null;
    title: string;
    subtitle: string | null;
    note: string | null;
    sponsored: boolean;
    link: { href: string; cta: string; image: string | null; meta: string } | null;
};

export const PLAN_FIELDS = 'id, slug, title, subtitle, intro_text, cover_image_url, kind, starts_at, ends_at, theme_tags, status, sponsored, published_at';

export const PLAN_ITEM_FIELDS = `id, order_index, item_type, place_id, event_id, activity_id,
    custom_title, custom_subtitle, label, editorial_note, sponsored,
    places(name, slug, zone, primary_category, place_photos(url, is_primary, order_index)),
    events(title, slug, zone, venue_name, date_start, date_last, image_url),
    activities(title, slug, zone, category, image_url)`;

export function primaryPhoto(photos: PhotoRow[] | null | undefined): string | null {
    if (!photos?.length) return null;
    return photos.find(p => p.is_primary)?.url
        ?? [...photos].sort((a, b) => a.order_index - b.order_index)[0]?.url
        ?? null;
}

export function isPlanActive(plan: Pick<DbPlan, 'kind' | 'ends_at'>, now: Date = guatNow()): boolean {
    if (plan.kind === 'siempre') return true;
    if (!plan.ends_at) return false;
    return toWallClock(plan.ends_at) > wallClockNow(now);
}

// Ocasión primero (por starts_at, el más próximo arriba), después los 'siempre'
// (el publicado más reciente arriba).
export function sortPlans<T extends Pick<DbPlan, 'kind' | 'starts_at' | 'published_at'>>(plans: T[]): T[] {
    return [...plans].sort((a, b) => {
        if (a.kind !== b.kind) return a.kind === 'ocasion' ? -1 : 1;
        if (a.kind === 'ocasion') return (a.starts_at ?? '').localeCompare(b.starts_at ?? '');
        return (b.published_at ?? '').localeCompare(a.published_at ?? '');
    });
}

// Items que el público no debe ver: referencias que RLS ocultó (no publicadas → el
// join llega en null) y eventos cuya última función ya pasó. Nunca rompe la página.
export function resolvePlanItems(rows: PlanItemRow[], now: Date = guatNow()): ResolvedPlanItem[] {
    const nowWall = wallClockNow(now);
    const resolved: ResolvedPlanItem[] = [];
    for (const row of [...rows].sort((a, b) => a.order_index - b.order_index)) {
        const base = { id: row.id, type: row.item_type, label: row.label, note: row.editorial_note, sponsored: row.sponsored };
        if (row.item_type === 'custom') {
            if (!row.custom_title) continue;
            resolved.push({ ...base, title: row.custom_title, subtitle: row.custom_subtitle, link: null });
        } else if (row.item_type === 'place' && row.places) {
            const p = row.places;
            resolved.push({
                ...base,
                title: p.name,
                subtitle: null,
                link: {
                    href: `/lugar/${p.slug}`,
                    cta: 'Ver lugar',
                    image: primaryPhoto(p.place_photos),
                    meta: [p.primary_category, p.zone].filter(Boolean).join(' · '),
                },
            });
        } else if (row.item_type === 'event' && row.events) {
            const e = row.events;
            if (toWallClock(e.date_last) < nowWall) continue;
            resolved.push({
                ...base,
                title: e.title,
                subtitle: null,
                link: {
                    href: `/evento/${e.slug}`,
                    cta: 'Ver evento',
                    image: e.image_url,
                    meta: [formatShortDate(e.date_start), e.venue_name || e.zone].filter(Boolean).join(' · '),
                },
            });
        } else if (row.item_type === 'activity' && row.activities) {
            const a = row.activities;
            resolved.push({
                ...base,
                title: a.title,
                subtitle: null,
                link: {
                    href: `/actividad/${a.slug}`,
                    cta: 'Ver actividad',
                    image: a.image_url,
                    meta: [a.category, a.zone].filter(Boolean).join(' · '),
                },
            });
        }
    }
    return resolved;
}

// Items custom consecutivos con el mismo label se muestran como un solo bloque
// numerado (ej. los 4 partidos de las 2 PM bajo "LOS PARTIDOS").
export type PlanItemGroup =
    | { kind: 'single'; item: ResolvedPlanItem }
    | { kind: 'custom-list'; label: string; items: ResolvedPlanItem[] };

export function groupPlanItems(items: ResolvedPlanItem[]): PlanItemGroup[] {
    const groups: PlanItemGroup[] = [];
    for (const item of items) {
        const last = groups[groups.length - 1];
        if (item.type === 'custom' && item.label && last?.kind === 'custom-list' && last.label === item.label) {
            last.items.push(item);
        } else if (item.type === 'custom' && item.label) {
            groups.push({ kind: 'custom-list', label: item.label, items: [item] });
        } else {
            groups.push({ kind: 'single', item });
        }
    }
    // Un "grupo" de un solo custom se ve mejor como item normal.
    return groups.map(g => (g.kind === 'custom-list' && g.items.length === 1 ? { kind: 'single', item: g.items[0] } : g));
}

// ── Fechas ────────────────────────────────────────────────────────────────

const DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const DAYS_SHORT = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const MONTHS_SHORT = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

type WallParts = { y: number; mo: number; d: number; h: number; mi: number; dow: number; day: string };

function parseWall(iso: string): WallParts {
    const [datePart, timePart = '00:00'] = iso.split('T');
    const [y, mo, d] = datePart.split('-').map(Number);
    const [h, mi] = timePart.split(':').map(Number);
    // Date.UTC solo para sacar el día de la semana de una fecha de pared, sin zona.
    const dow = new Date(Date.UTC(y, mo - 1, d)).getUTCDay();
    return { y, mo: mo - 1, d, h: h || 0, mi: mi || 0, dow, day: datePart };
}

function capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatTime({ h, mi }: WallParts, withMeridiem = true): string {
    const h12 = h % 12 === 0 ? 12 : h % 12;
    const base = `${h12}:${String(mi).padStart(2, '0')}`;
    return withMeridiem ? `${base} ${h < 12 ? 'AM' : 'PM'}` : base;
}

function formatShortDate(iso: string): string {
    const p = parseWall(iso);
    return `${capitalize(DAYS[p.dow].slice(0, 3))} ${p.d} ${MONTHS[p.mo].slice(0, 3)}`;
}

// "Martes 3 de noviembre" · "Sábado 7 – domingo 8 de noviembre" · "Viernes 30 de octubre – domingo 1 de noviembre"
export function formatPlanDate(startsAt: string, endsAt: string): string {
    const s = parseWall(startsAt);
    const e = parseWall(endsAt);
    if (s.day === e.day) return `${capitalize(DAYS[s.dow])} ${s.d} de ${MONTHS[s.mo]}`;
    if (s.mo === e.mo && s.y === e.y) return `${capitalize(DAYS[s.dow])} ${s.d} – ${DAYS[e.dow]} ${e.d} de ${MONTHS[e.mo]}`;
    return `${capitalize(DAYS[s.dow])} ${s.d} de ${MONTHS[s.mo]} – ${DAYS[e.dow]} ${e.d} de ${MONTHS[e.mo]}`;
}

// Solo para planes de un día: "12:00 – 5:00 PM", "10:00 AM – 2:00 PM".
export function formatPlanTimeRange(startsAt: string, endsAt: string): string | null {
    const s = parseWall(startsAt);
    const e = parseWall(endsAt);
    if (s.day !== e.day) return null;
    const sameMeridiem = (s.h < 12) === (e.h < 12);
    return `${formatTime(s, !sameMeridiem)} – ${formatTime(e)}`;
}

// Badge de las tarjetas: "HOY · 12 – 5 PM", "MAR 10 NOV", "SÁB 7 – DOM 8 NOV".
export function formatPlanBadge(startsAt: string, endsAt: string, now: Date = guatNow()): string {
    const s = parseWall(startsAt);
    const e = parseWall(endsAt);
    const today = wallClockNow(now).slice(0, 10);
    const short = (p: WallParts) => `${p.h % 12 === 0 ? 12 : p.h % 12}${p.mi ? `:${String(p.mi).padStart(2, '0')}` : ''}`;
    if (s.day === e.day) {
        const meridiem = (p: WallParts) => (p.h < 12 ? 'AM' : 'PM');
        if (s.day === today) {
            const startMeridiem = meridiem(s) === meridiem(e) ? '' : ` ${meridiem(s)}`;
            return `HOY · ${short(s)}${startMeridiem} – ${short(e)} ${meridiem(e)}`;
        }
        return `${DAYS_SHORT[s.dow]} ${s.d} ${MONTHS_SHORT[s.mo]}`;
    }
    // En curso (empezó antes de hoy y sigue): "HASTA EL DOM 8 NOV".
    if (s.day < today) return `HASTA EL ${DAYS_SHORT[e.dow]} ${e.d} ${MONTHS_SHORT[e.mo]}`;
    if (s.mo === e.mo) return `${DAYS_SHORT[s.dow]} ${s.d} – ${DAYS_SHORT[e.dow]} ${e.d} ${MONTHS_SHORT[e.mo]}`;
    return `${DAYS_SHORT[s.dow]} ${s.d} ${MONTHS_SHORT[s.mo]} – ${DAYS_SHORT[e.dow]} ${e.d} ${MONTHS_SHORT[e.mo]}`;
}

// ── Queries ───────────────────────────────────────────────────────────────

export type PlanCard = DbPlan & { cover: string | null };

type PlanWithItemPhotos = DbPlan & {
    plan_items: Pick<PlanItemRow, 'order_index' | 'places' | 'events' | 'activities'>[];
};

const PLAN_CARD_SELECT = `${PLAN_FIELDS},
    plan_items(order_index,
        places(name, slug, zone, primary_category, place_photos(url, is_primary, order_index)),
        events(title, slug, zone, venue_name, date_start, date_last, image_url),
        activities(title, slug, zone, category, image_url))`;

// Portada del plan, o la foto del primer item que tenga una.
function coverFor(plan: PlanWithItemPhotos): string | null {
    if (plan.cover_image_url) return plan.cover_image_url;
    for (const item of [...(plan.plan_items ?? [])].sort((a, b) => a.order_index - b.order_index)) {
        const photo = primaryPhoto(item.places?.place_photos) ?? item.events?.image_url ?? item.activities?.image_url;
        if (photo) return photo;
    }
    return null;
}

// Planes publicados y vigentes, en el orden de /planes y del carrusel del home.
// RLS ya limita a status = 'published'; la vigencia se filtra acá.
export async function getActivePlans(
    supabase: SupabaseClient,
    { excludeId, limit }: { excludeId?: string; limit?: number } = {}
): Promise<PlanCard[]> {
    const now = guatNow();
    let query = supabase
        .from('plans')
        .select(PLAN_CARD_SELECT)
        .eq('status', 'published')
        .or(`kind.eq.siempre,ends_at.gt.${wallClockNow(now)}`);
    if (excludeId) query = query.neq('id', excludeId);
    const { data, error } = await query;
    if (error) {
        console.error('No se pudieron cargar los planes:', error.message);
        return [];
    }
    const plans = sortPlans(((data ?? []) as unknown as PlanWithItemPhotos[]).filter(p => isPlanActive(p, now)));
    const cards: PlanCard[] = plans.map(plan => ({ ...plan, cover: coverFor(plan) }));
    return limit ? cards.slice(0, limit) : cards;
}
