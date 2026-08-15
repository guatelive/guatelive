import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { deleteEvent } from './actions';

export const metadata = { title: 'Eventos — Admin' };

type SortKey = 'date_asc' | 'date_desc' | 'created_desc';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
    { key: 'date_desc', label: 'Fecha ↓ (más recientes)' },
    { key: 'date_asc',  label: 'Fecha ↑ (más antiguos)' },
    { key: 'created_desc', label: 'Recién creados' },
];

function sortParams(key: SortKey): { column: string; ascending: boolean } {
    if (key === 'date_asc')     return { column: 'date_start',  ascending: true  };
    if (key === 'created_desc') return { column: 'created_at',  ascending: false };
    return                             { column: 'date_start',  ascending: false };
}

export default async function AdminEventsPage({
    searchParams,
}: {
    searchParams: Promise<{ sort?: string }>;
}) {
    const { sort = 'date_desc' } = await searchParams;
    const activeSort = (SORT_OPTIONS.some(o => o.key === sort) ? sort : 'date_desc') as SortKey;
    const { column, ascending } = sortParams(activeSort);

    const supabase = await createClient();
    const { data: events } = await supabase
        .from('events')
        .select('id, title, category, zone, date_start, status, sponsored, source, contact_link')
        .order(column, { ascending });

    const rows = events ?? [];

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <h1 className="font-serif text-2xl text-[#0A0A0A]">Eventos</h1>
                <Link href="/admin/events/new">
                    <Button className="normal-case tracking-normal">+ Nuevo evento</Button>
                </Link>
            </div>

            {/* Sort controls */}
            <div className="mb-4 flex items-center gap-2">
                <span className="text-xs text-[#666666] mr-1">Ordenar:</span>
                {SORT_OPTIONS.map(opt => (
                    <Link
                        key={opt.key}
                        href={`?sort=${opt.key}`}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                            activeSort === opt.key
                                ? 'border-[#0A0A0A] bg-[#0A0A0A] text-white'
                                : 'border-[#E5E5E5] text-[#666666] hover:border-[#0A0A0A] hover:text-[#0A0A0A]'
                        }`}
                    >
                        {opt.label}
                    </Link>
                ))}
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
                                        <button type="submit" className="text-[#E11D2E] hover:underline">
                                            Borrar
                                        </button>
                                    </form>
                                </td>
                            </tr>
                        ))}
                        {rows.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-[#666666]">
                                    No hay eventos todavía.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
