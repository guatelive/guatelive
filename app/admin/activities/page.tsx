import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { AdminSortChips } from '@/components/admin/admin-sort-chips';
import { activityCategories } from '@/lib/event-display';
import { deleteActivity } from './actions';

export const metadata = { title: 'Actividades — Admin' };

type SortKey = 'created_desc' | 'published_desc' | 'updated_desc' | 'title_asc';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
    { key: 'created_desc', label: 'Recién creados' },
    { key: 'published_desc', label: 'Recién publicados' },
    { key: 'updated_desc', label: 'Recién editados' },
    { key: 'title_asc', label: 'Título A-Z' },
];

function sortParams(key: SortKey): { column: string; ascending: boolean } {
    if (key === 'title_asc') return { column: 'title', ascending: true };
    if (key === 'published_desc') return { column: 'published_at', ascending: false };
    if (key === 'updated_desc') return { column: 'updated_at', ascending: false };
    return { column: 'created_at', ascending: false };
}

export default async function AdminActivitiesPage({
    searchParams,
}: {
    searchParams: Promise<{ sort?: string }>;
}) {
    const { sort = 'created_desc' } = await searchParams;
    const activeSort = (SORT_OPTIONS.some(o => o.key === sort) ? sort : 'created_desc') as SortKey;
    const { column, ascending } = sortParams(activeSort);

    const supabase = await createClient();
    const { data: activities } = await supabase
        .from('activities')
        .select('id, title, category, extra_categories, zone, status, sponsored, recurrence_text')
        // nullsFirst: false — sin esto, en "Recién publicados" los borradores salen primero.
        .order(column, { ascending, nullsFirst: false });

    const rows = activities ?? [];

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <h1 className="font-serif text-2xl text-[#0A0A0A]">Actividades</h1>
                <Link href="/admin/activities/new">
                    <Button className="normal-case tracking-normal">+ Nueva actividad</Button>
                </Link>
            </div>

            <div className="mb-4">
                <AdminSortChips options={SORT_OPTIONS} active={activeSort} />
            </div>

            <div className="overflow-hidden rounded-lg border border-[#E5E5E5] bg-white">
                <table className="w-full text-sm">
                    <thead className="border-b border-[#E5E5E5] bg-[#FAFAFA] text-left text-xs uppercase text-[#666666]">
                        <tr>
                            <th className="px-4 py-3">Título</th>
                            <th className="px-4 py-3">Categoría</th>
                            <th className="px-4 py-3">Zona</th>
                            <th className="px-4 py-3">Cuándo</th>
                            <th className="px-4 py-3">Estado</th>
                            <th className="px-4 py-3" />
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map(activity => (
                            <tr key={activity.id} className="border-b border-[#E5E5E5] last:border-0">
                                <td className="px-4 py-3 text-[#0A0A0A]">
                                    {activity.title}
                                    {activity.sponsored && (
                                        <span className="ml-2 rounded bg-[#E11D2E]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#E11D2E]">
                                            PATROCINADO
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-[#666666]">{activityCategories(activity).join(', ')}</td>
                                <td className="px-4 py-3 text-[#666666]">{activity.zone}</td>
                                <td className="px-4 py-3 text-[#666666]">{activity.recurrence_text || '—'}</td>
                                <td className="px-4 py-3">
                                    <span
                                        className={
                                            activity.status === 'published'
                                                ? 'rounded bg-[#EFF4E8] px-2 py-0.5 text-xs text-[#4A6B22]'
                                                : 'rounded bg-[#F1EFE8] px-2 py-0.5 text-xs text-[#5F5E5A]'
                                        }
                                    >
                                        {activity.status === 'published' ? 'Publicado' : 'Borrador'}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <Link href={`/admin/activities/${activity.id}/edit`} className="mr-3 text-[#0A0A0A] hover:underline">
                                        Editar
                                    </Link>
                                    <form action={deleteActivity.bind(null, activity.id)} className="inline">
                                        <button type="submit" className="text-[#E11D2E] hover:underline">
                                            Borrar
                                        </button>
                                    </form>
                                </td>
                            </tr>
                        ))}
                        {rows.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-[#666666]">
                                    No hay actividades todavía.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
