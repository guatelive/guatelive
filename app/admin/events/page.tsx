import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { AdminSortChips } from '@/components/admin/admin-sort-chips';
import { ConfirmDeleteButton } from '@/components/admin/confirm-delete-button';
import { showtimesLabel } from '@/lib/event-showtimes';
import { guatNow } from '@/lib/hours-utils';
import { deleteEvent } from './actions';

export const metadata = { title: 'Eventos — Admin' };

type SortKey = 'date_asc' | 'date_desc' | 'created_desc' | 'published_desc' | 'updated_desc';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
    { key: 'date_desc', label: 'Fecha ↓ (más recientes)' },
    { key: 'date_asc',  label: 'Fecha ↑ (más antiguos)' },
    { key: 'created_desc', label: 'Recién creados' },
    { key: 'published_desc', label: 'Recién publicados' },
    { key: 'updated_desc', label: 'Recién editados' },
];

type Tab = 'upcoming' | 'past';

function sortParams(key: SortKey): { column: string; ascending: boolean } {
    if (key === 'date_asc')     return { column: 'date_start',  ascending: true  };
    if (key === 'created_desc') return { column: 'created_at',  ascending: false };
    if (key === 'published_desc') return { column: 'published_at', ascending: false };
    if (key === 'updated_desc') return { column: 'updated_at',  ascending: false };
    return                             { column: 'date_start',  ascending: false };
}

export default async function AdminEventsPage({
    searchParams,
}: {
    searchParams: Promise<{ sort?: string; tab?: string }>;
}) {
    const { sort = 'date_desc', tab: tabParam } = await searchParams;
    const activeSort = (SORT_OPTIONS.some(o => o.key === sort) ? sort : 'date_desc') as SortKey;
    const tab: Tab = tabParam === 'past' ? 'past' : 'upcoming';
    const { column, ascending } = sortParams(activeSort);

    // Mismo criterio que los listados públicos: un evento es "pasado" cuando ya pasó su
    // ÚLTIMA función (date_last, columna generada), no la primera — una obra con 4
    // funciones sigue en "Próximos" hasta la última.
    const now = guatNow().toISOString();

    const supabase = await createClient();
    let query = supabase
        .from('events')
        .select('id, title, category, zone, date_start, extra_dates, status, sponsored, source, contact_link');
    query = tab === 'past' ? query.lt('date_last', now) : query.gte('date_last', now);
    const [{ data: events }, { count: upcomingCount }, { count: pastCount }] = await Promise.all([
        // nullsFirst: false — sin esto, en "Recién publicados" los borradores salen primero.
        query.order(column, { ascending, nullsFirst: false }),
        supabase.from('events').select('id', { count: 'exact', head: true }).gte('date_last', now),
        supabase.from('events').select('id', { count: 'exact', head: true }).lt('date_last', now),
    ]);

    const rows = events ?? [];
    const tabs: { key: Tab; label: string; count: number | null }[] = [
        { key: 'upcoming', label: 'Próximos', count: upcomingCount },
        { key: 'past', label: 'Pasados', count: pastCount },
    ];

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <h1 className="font-serif text-2xl text-[#0A0A0A]">Eventos</h1>
                <Link href="/admin/events/new">
                    <Button className="normal-case tracking-normal">+ Nuevo evento</Button>
                </Link>
            </div>

            <div className="mb-4 flex gap-6 border-b border-[#E5E5E5]">
                {tabs.map(t => (
                    <Link
                        key={t.key}
                        href={`?${new URLSearchParams({ tab: t.key, sort: activeSort })}`}
                        className={`-mb-px border-b-2 pb-2 text-sm font-medium transition-colors ${
                            tab === t.key
                                ? 'border-[#0A0A0A] text-[#0A0A0A]'
                                : 'border-transparent text-[#666666] hover:text-[#0A0A0A]'
                        }`}
                    >
                        {t.label}
                        {t.count !== null && <span className="ml-1.5 text-xs text-[#999999]">{t.count}</span>}
                    </Link>
                ))}
            </div>

            <div className="mb-4">
                <AdminSortChips options={SORT_OPTIONS} active={activeSort} params={{ tab }} />
            </div>

            <div className="overflow-hidden rounded-lg border border-[#E5E5E5] bg-white">
                <table className="w-full text-sm">
                    <thead className="border-b border-[#E5E5E5] bg-[#FAFAFA] text-left text-xs uppercase text-[#666666]">
                        <tr>
                            <th className="px-4 py-3">Título</th>
                            <th className="px-4 py-3">Categoría</th>
                            <th className="px-4 py-3">Zona</th>
                            <th className="px-4 py-3">Fuente</th>
                            <th className="px-4 py-3">
                                Fecha
                                {activeSort === 'date_desc' && ' ↓'}
                                {activeSort === 'date_asc'  && ' ↑'}
                            </th>
                            <th className="px-4 py-3">Estado</th>
                            <th className="px-4 py-3" />
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map(event => (
                            <tr key={event.id} className="border-b border-[#E5E5E5] last:border-0">
                                <td className="px-4 py-3 text-[#0A0A0A]">
                                    {event.title}
                                    {event.sponsored && (
                                        <span className="ml-2 rounded bg-[#E11D2E]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#E11D2E]">
                                            PATROCINADO
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-[#666666]">{event.category}</td>
                                <td className="px-4 py-3 text-[#666666]">{event.zone}</td>
                                <td className="px-4 py-3 text-[#666666]">
                                    {event.source ? (
                                        event.contact_link ? (
                                            <a
                                                href={event.contact_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="underline hover:text-[#0A0A0A]"
                                            >
                                                {event.source}
                                            </a>
                                        ) : (
                                            event.source
                                        )
                                    ) : (
                                        '—'
                                    )}
                                </td>
                                <td className="px-4 py-3 text-[#666666]">
                                    {new Date(event.date_start).toLocaleDateString('es-GT', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric',
                                    })}
                                    {event.extra_dates?.length > 0 && (
                                        <span className="ml-1 text-xs text-[#999999]">
                                            {showtimesLabel(event.extra_dates.length)}
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    <span
                                        className={
                                            event.status === 'published'
                                                ? 'rounded bg-[#EFF4E8] px-2 py-0.5 text-xs text-[#4A6B22]'
                                                : 'rounded bg-[#F1EFE8] px-2 py-0.5 text-xs text-[#5F5E5A]'
                                        }
                                    >
                                        {event.status === 'published' ? 'Publicado' : 'Borrador'}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <Link href={`/admin/events/${event.id}/edit`} className="mr-3 text-[#0A0A0A] hover:underline">
                                        Editar
                                    </Link>
                                    <form action={deleteEvent.bind(null, event.id)} className="inline">
                                        <ConfirmDeleteButton />
                                    </form>
                                </td>
                            </tr>
                        ))}
                        {rows.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-[#666666]">
                                    {tab === 'past' ? 'No hay eventos pasados.' : 'No hay eventos próximos.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
