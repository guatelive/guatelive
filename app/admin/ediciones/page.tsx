import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { deleteEdition } from './actions';

export const metadata = { title: 'Ediciones — Admin' };

export default async function AdminEdicionesPage() {
    const supabase = await createClient();
    // Solo las columnas que necesita el listado — intro_text/closing_text/etc. son
    // pesados y no hacen falta acá (ver nota de escalabilidad en el plan).
    const { data: editions } = await supabase
        .from('editions')
        .select('id, number, slug, title, subtitle, status, published_at')
        .order('number', { ascending: false });

    const rows = editions ?? [];

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <h1 className="font-serif text-2xl text-[#0A0A0A]">Ediciones</h1>
                <Link href="/admin/ediciones/nueva">
                    <Button className="normal-case tracking-normal">+ Nueva edición</Button>
                </Link>
            </div>

            <div className="overflow-hidden rounded-lg border border-[#E5E5E5] bg-white">
                <table className="w-full text-sm">
                    <thead className="border-b border-[#E5E5E5] bg-[#FAFAFA] text-left text-xs uppercase text-[#666666]">
                        <tr>
                            <th className="px-4 py-3">Nº</th>
                            <th className="px-4 py-3">Título</th>
                            <th className="px-4 py-3">Estado</th>
                            <th className="px-4 py-3">Publicada</th>
                            <th className="px-4 py-3" />
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map(edition => (
                            <tr key={edition.id} className="border-b border-[#E5E5E5] last:border-0">
                                <td className="px-4 py-3 text-[#666666]">{edition.number}</td>
                                <td className="px-4 py-3 text-[#0A0A0A]">
                                    {edition.title}
                                    {edition.subtitle && (
                                        <p className="text-xs text-[#666666]">{edition.subtitle}</p>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    <span
                                        className={
                                            edition.status === 'published'
                                                ? 'rounded bg-[#EFF4E8] px-2 py-0.5 text-xs text-[#4A6B22]'
                                                : 'rounded bg-[#F1EFE8] px-2 py-0.5 text-xs text-[#5F5E5A]'
                                        }
                                    >
                                        {edition.status === 'published' ? 'Publicada' : 'Borrador'}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-[#666666]">
                                    {edition.published_at
                                        ? new Date(edition.published_at).toLocaleDateString('es-GT', {
                                              day: 'numeric',
                                              month: 'short',
                                              year: 'numeric',
                                          })
                                        : '—'}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <Link href={`/admin/ediciones/${edition.id}/editar`} className="mr-3 text-[#0A0A0A] hover:underline">
                                        Editar
                                    </Link>
                                    <form action={deleteEdition.bind(null, edition.id)} className="inline">
                                        <button type="submit" className="text-[#E11D2E] hover:underline">
                                            Borrar
                                        </button>
                                    </form>
                                </td>
                            </tr>
                        ))}
                        {rows.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-[#666666]">
                                    No hay ediciones todavía.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
