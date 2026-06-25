import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { deleteEvent } from './actions';

export const metadata = { title: 'Eventos — Admin' };

export default async function AdminEventsPage() {
    const supabase = await createClient();
    const { data: events } = await supabase
        .from('events')
        .select('id, title, category, zone, date_start, status, sponsored')
        .order('date_start', { ascending: false });

    const rows = events ?? [];

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <h1 className="font-serif text-2xl text-[#0A0A0A]">Eventos</h1>
                <Link href="/admin/events/new">
                    <Button className="normal-case tracking-normal">+ Nuevo evento</Button>
                </Link>
            </div>

            <div className="overflow-hidden rounded-lg border border-[#E5E5E5] bg-white">
                <table className="w-full text-sm">
                    <thead className="border-b border-[#E5E5E5] bg-[#FAFAFA] text-left text-xs uppercase text-[#666666]">
                        <tr>
                            <th className="px-4 py-3">Título</th>
                            <th className="px-4 py-3">Categoría</th>
                            <th className="px-4 py-3">Zona</th>
                            <th className="px-4 py-3">Fecha</th>
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
                                <td colSpan={6} className="px-4 py-8 text-center text-[#666666]">
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
