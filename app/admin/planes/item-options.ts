import { createClient } from '@/lib/supabase/server';
import { guatNow } from '@/lib/hours-utils';
import { wallClockNow } from '@/lib/event-showtimes';
import type { PlanItemOption } from '@/components/admin/plan-items-editor';

// Todo lo que se puede agregar a un plan, en una sola carga — el buscador del editor
// filtra en el browser (sin tildes), así no hace falta `unaccent` en la DB. Incluye
// lo no publicado (marcado) para poder armar el plan antes de publicar el lugar.
// Eventos: solo los que todavía tienen alguna función por delante.
export async function loadPlanItemOptions(): Promise<PlanItemOption[]> {
    const supabase = await createClient();
    const [{ data: places }, { data: events }, { data: activities }] = await Promise.all([
        supabase.from('places').select('id, name, zone, primary_category, is_published').order('name').limit(2000),
        supabase
            .from('events')
            .select('id, title, zone, venue_name, date_start, status')
            .gte('date_last', wallClockNow(guatNow()))
            .order('date_start')
            .limit(1000),
        supabase.from('activities').select('id, title, zone, category, status').order('title'),
    ]);

    return [
        ...(places ?? []).map(p => ({
            type: 'place' as const,
            id: p.id,
            title: p.name,
            meta: [p.primary_category, p.zone].filter(Boolean).join(' · '),
            published: p.is_published,
        })),
        ...(events ?? []).map(e => ({
            type: 'event' as const,
            id: e.id,
            title: e.title,
            meta: [e.date_start.slice(0, 10), e.venue_name || e.zone].filter(Boolean).join(' · '),
            published: e.status === 'published',
        })),
        ...(activities ?? []).map(a => ({
            type: 'activity' as const,
            id: a.id,
            title: a.title,
            meta: [a.category, a.zone].filter(Boolean).join(' · '),
            published: a.status === 'published',
        })),
    ];
}
