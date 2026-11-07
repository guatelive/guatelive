import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PlanForm } from '@/components/admin/plan-form';
import type { PlanEditorItemInput } from '@/components/admin/plan-items-editor';
import { PLAN_FIELDS, type DbPlan } from '@/lib/plans';
import { updatePlan } from '../../actions';
import { loadPlanItemOptions } from '../../item-options';

export const metadata = { title: 'Editar plan — Admin' };

type ItemRow = {
    order_index: number;
    item_type: PlanEditorItemInput['item_type'];
    place_id: string | null;
    event_id: string | null;
    activity_id: string | null;
    custom_title: string | null;
    custom_subtitle: string | null;
    label: string | null;
    editorial_note: string | null;
    sponsored: boolean;
    places: { name: string; zone: string | null; is_published: boolean } | null;
    events: { title: string; zone: string; date_start: string; status: string } | null;
    activities: { title: string; zone: string; status: string } | null;
};

function toEditorItem(row: ItemRow): PlanEditorItemInput {
    const base = {
        item_type: row.item_type,
        custom_title: row.custom_title ?? undefined,
        custom_subtitle: row.custom_subtitle ?? undefined,
        label: row.label ?? undefined,
        editorial_note: row.editorial_note ?? undefined,
        sponsored: row.sponsored,
    };
    if (row.item_type === 'place') {
        return { ...base, ref_id: row.place_id ?? undefined, ref_title: row.places?.name, ref_meta: row.places?.zone ?? undefined, ref_published: row.places?.is_published };
    }
    if (row.item_type === 'event') {
        return { ...base, ref_id: row.event_id ?? undefined, ref_title: row.events?.title, ref_meta: row.events?.date_start.slice(0, 10), ref_published: row.events?.status === 'published' };
    }
    if (row.item_type === 'activity') {
        return { ...base, ref_id: row.activity_id ?? undefined, ref_title: row.activities?.title, ref_meta: row.activities?.zone, ref_published: row.activities?.status === 'published' };
    }
    return base;
}

export default async function EditPlanPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();
    const [{ data }, options] = await Promise.all([
        supabase
            .from('plans')
            .select(`${PLAN_FIELDS},
                plan_items(order_index, item_type, place_id, event_id, activity_id, custom_title, custom_subtitle, label, editorial_note, sponsored,
                    places(name, zone, is_published), events(title, zone, date_start, status), activities(title, zone, status))`)
            .eq('id', id)
            .single(),
        loadPlanItemOptions(),
    ]);

    if (!data) notFound();

    const { plan_items, ...plan } = data as unknown as DbPlan & { plan_items: ItemRow[] };
    const items = [...(plan_items ?? [])].sort((a, b) => a.order_index - b.order_index).map(toEditorItem);

    return (
        <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <h1 className="font-serif text-2xl text-[#0A0A0A]">Editar plan</h1>
                {plan.status === 'published' && (
                    <Link href={`/planes/${plan.slug}`} target="_blank" className="text-sm text-[#666666] hover:text-[#0A0A0A]">
                        Ver en el sitio ↗
                    </Link>
                )}
            </div>
            <PlanForm mode="edit" plan={plan} items={items} options={options} action={updatePlan.bind(null, id)} />
        </div>
    );
}
