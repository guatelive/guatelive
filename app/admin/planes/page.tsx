import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { formatPlanDate, isPlanActive, type DbPlan } from '@/lib/plans';
import { deletePlan, setPlanStatus } from './actions';

export const metadata = { title: 'Planes — Admin' };

const STATUS_STYLE: Record<DbPlan['status'], { label: string; className: string }> = {
    published: { label: 'Publicado', className: 'bg-[#EFF4E8] text-[#4A6B22]' },
    draft: { label: 'Borrador', className: 'bg-[#F1EFE8] text-[#5F5E5A]' },
    archived: { label: 'Archivado', className: 'bg-[#EEEEEE] text-[#666666]' },
};

export default async function AdminPlanesPage() {
    const supabase = await createClient();
    const { data } = await supabase
        .from('plans')
        .select('id, slug, title, kind, starts_at, ends_at, status, sponsored, plan_items(count)')
        .order('created_at', { ascending: false });

    const plans = (data ?? []) as unknown as (Pick<DbPlan, 'id' | 'slug' | 'title' | 'kind' | 'starts_at' | 'ends_at' | 'status' | 'sponsored'> & {
        plan_items: { count: number }[];
    })[];

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <h1 className="font-serif text-2xl text-[#0A0A0A]">Planes</h1>
                <Link href="/admin/planes/nuevo">
                    <Button className="normal-case tracking-normal">+ Nuevo plan</Button>
                </Link>
            </div>

            <div className="overflow-x-auto rounded-lg border border-[#E5E5E5] bg-white">
                <table className="w-full text-sm">
                    <thead className="border-b border-[#E5E5E5] bg-[#FAFAFA] text-left text-xs uppercase text-[#666666]">
                        <tr>
                            <th className="px-4 py-3">Título</th>
                            <th className="px-4 py-3">Cuándo</th>
                            <th className="px-4 py-3">Items</th>
                            <th className="px-4 py-3">Estado</th>
                            <th className="px-4 py-3" />
                        </tr>
                    </thead>
                    <tbody>
                        {plans.map(plan => {
                            const expired = !isPlanActive(plan);
                            const status = STATUS_STYLE[plan.status];
                            return (
                                <tr key={plan.id} className="border-b border-[#E5E5E5] last:border-0">
                                    <td className="px-4 py-3 text-[#0A0A0A]">
                                        {plan.title}
                                        {plan.sponsored && (
                                            <span className="ml-2 rounded bg-[#FFE36E] px-1.5 py-0.5 text-[10px] font-semibold text-[#0A0A0A]">
                                                PATROCINADO
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-[#666666]">
                                        {plan.kind === 'siempre' || !plan.starts_at || !plan.ends_at ? 'Siempre' : formatPlanDate(plan.starts_at, plan.ends_at)}
                                        {expired && <span className="ml-2 text-xs text-[#B45309]">ya pasó</span>}
                                    </td>
                                    <td className="px-4 py-3 text-[#666666]">{plan.plan_items[0]?.count ?? 0}</td>
                                    <td className="px-4 py-3">
                                        <span className={`rounded px-2 py-0.5 text-xs ${status.className}`}>{status.label}</span>
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3 text-right">
                                        {plan.status !== 'published' ? (
                                            <form action={setPlanStatus.bind(null, plan.id, 'published')} className="mr-3 inline">
                                                <button type="submit" className="text-[#4A6B22] hover:underline">Publicar</button>
                                            </form>
                                        ) : (
                                            <form action={setPlanStatus.bind(null, plan.id, 'draft')} className="mr-3 inline">
                                                <button type="submit" className="text-[#666666] hover:underline">Pasar a borrador</button>
                                            </form>
                                        )}
                                        {plan.status === 'published' && (
                                            <Link href={`/planes/${plan.slug}`} target="_blank" className="mr-3 text-[#666666] hover:underline">
                                                Ver
                                            </Link>
                                        )}
                                        <Link href={`/admin/planes/${plan.id}/editar`} className="mr-3 text-[#0A0A0A] hover:underline">
                                            Editar
                                        </Link>
                                        <form action={deletePlan.bind(null, plan.id)} className="inline">
                                            <button type="submit" className="text-[#E11D2E] hover:underline">Borrar</button>
                                        </form>
                                    </td>
                                </tr>
                            );
                        })}
                        {plans.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-[#666666]">
                                    No hay planes todavía.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
