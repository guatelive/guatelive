import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ActivityForm } from '@/components/admin/activity-form';
import { updateActivity } from '../../actions';
import type { DbActivity } from '@/lib/types';

export const metadata = { title: 'Editar actividad — Admin' };

export default async function EditActivityPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();
    const { data } = await supabase
        .from('activities')
        .select('*, places(name)')
        .eq('id', id)
        .single();

    if (!data) notFound();

    const { places: relatedPlace, ...activity } = data;

    return (
        <div>
            <h1 className="mb-6 font-serif text-2xl text-[#0A0A0A]">Editar actividad</h1>
            <ActivityForm
                mode="edit"
                activity={activity as DbActivity}
                initialPlaceName={relatedPlace?.name}
                action={updateActivity.bind(null, id)}
            />
        </div>
    );
}
