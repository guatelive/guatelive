import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { deletePlace } from './actions';

export const metadata = { title: 'Lugares — Admin' };

type FilterKey = 'all' | 'published' | 'draft';

const FILTER_OPTIONS: { key: FilterKey; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'published', label: 'Publicados' },
    { key: 'draft', label: 'Borradores' },
];

export default async function AdminPlacesPage({
    searchParams,
}: {
    searchParams: Promise<{ filter?: string; q?: string }>;
}) {
    const { filter = 'all', q = '' } = await searchParams;
    const activeFilter = (FILTER_OPTIONS.some(o => o.key === filter) ? filter : 'all') as FilterKey;

    const supabase = await createClient();
    let query = supabase
        .from('places')
        .select('id, name, zone, primary_category, is_published, place_photos(count)')
        .order('name', { ascending: true });

    if (activeFilter === 'published') query = query.eq('is_published', true);
    if (activeFilter === 'draft') query = query.eq('is_published', false);
    if (q.trim()) query = query.ilike('name', `%${q.trim()}%`);

    const { data: places } = await query;
    const rows = places ?? [];

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <h1 className="font-serif text-2xl text-[#0A0A0A]">Lugares</h1>
                <Link href="/admin/places/new">
                    <Button className="normal-case tracking-normal">+ Nuevo lugar</Button>
                </Link>
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-4">
                <form action="/admin/places" method="GET" className="flex items-center gap-2">
                    <input type="hidden" name="filter" value={activeFilter} />
                    <input
                        type="text"
                        name="q"
                        defaultValue={q}
                        placeholder="Buscar por nombre..."
                        className="w-64 rounded-md border border-[#E5E5E5] px-3 py-1.5 text-sm text-[#0A0A0A] placeholder:text-[#999999] focus:border-[#0A0A0A] focus:outline-none"
                    />
                    <button
                        type="submit"
                        className="rounded-md border border-[#E5E5E5] px-3 py-1.5 text-xs font-medium text-[#666666] hover:border-[#0A0A0A] hover:text-[#0A0A0A]"
                    >
                        Buscar
                    </button>
                    {q && (
                        <Link href={`/admin/places?filter=${activeFilter}`} className="text-xs text-[#666666] hover:underline">
                            Limpiar
                        </Link>
                    )}
                </form>

                <div className="flex items-center gap-2">
                    <span className="text-xs text-[#666666] mr-1">Filtro:</span>
                    {FILTER_OPTIONS.map(opt => (
                        <Link
                            key={opt.key}
                            href={`?filter=${opt.key}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
                            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                                activeFilter === opt.key
                                    ? 'border-[#0A0A0A] bg-[#0A0A0A] text-white'
                                    : 'border-[#E5E5E5] text-[#666666] hover:border-[#0A0A0A] hover:text-[#0A0A0A]'
                            }`}
                        >
                            {opt.label}
                        </Link>
                    ))}
                </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-[#E5E5E5] bg-white">
                <table className="w-full text-sm">
                    <thead className="border-b border-[#E5E5E5] bg-[#FAFAFA] text-left text-xs uppercase text-[#666666]">
                        <tr>
                            <th className="px-4 py-3">Nombre</th>
                            <th className="px-4 py-3">Zona</th>
                            <th className="px-4 py-3">Categoría</th>
                            <th className="px-4 py-3">Publicado</th>
                            <th className="px-4 py-3">Fotos</th>
                            <th className="px-4 py-3" />
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map(place => {
                            const photoCount = (place.place_photos as { count: number }[] | null)?.[0]?.count ?? 0;
                            return (
                                <tr key={place.id} className="border-b border-[#E5E5E5] last:border-0">
                                    <td className="px-4 py-3 text-[#0A0A0A]">{place.name}</td>
                                    <td className="px-4 py-3 text-[#666666]">{place.zone}</td>
                                    <td className="px-4 py-3 text-[#666666]">{place.primary_category}</td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={
                                                place.is_published
                                                    ? 'rounded bg-[#EFF4E8] px-2 py-0.5 text-xs text-[#4A6B22]'
                                                    : 'rounded bg-[#F1EFE8] px-2 py-0.5 text-xs text-[#5F5E5A]'
                                            }
                                        >
                                            {place.is_published ? 'Sí' : 'No'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-[#666666]">
                                        {photoCount === 0 ? (
                                            <span className="text-[#E11D2E]">0</span>
                                        ) : photoCount}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Link href={`/admin/places/${place.id}/edit`} className="mr-3 text-[#0A0A0A] hover:underline">
                                            Editar
                                        </Link>
                                        <form action={deletePlace.bind(null, place.id)} className="inline">
                                            <button type="submit" className="text-[#E11D2E] hover:underline">
                                                Borrar
                                            </button>
                                        </form>
                                    </td>
                                </tr>
                            );
                        })}
                        {rows.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-[#666666]">
                                    {q ? `Sin resultados para "${q}".` : 'No hay lugares todavía.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
