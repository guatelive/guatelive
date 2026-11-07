import { PlanForm } from '@/components/admin/plan-form';
import { createPlan } from '../actions';
import { loadPlanItemOptions } from '../item-options';

export const metadata = { title: 'Nuevo plan — Admin' };

export default async function NewPlanPage() {
    const options = await loadPlanItemOptions();

    return (
        <div>
            <h1 className="mb-6 font-serif text-2xl text-[#0A0A0A]">Nuevo plan</h1>
            <PlanForm mode="create" options={options} action={createPlan} />
        </div>
    );
}
