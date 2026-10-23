import { getEventTagGroupsWithCustom } from '@/lib/custom-event-tags';
import { ActivityForm } from '@/components/admin/activity-form';
import { createActivity } from '../actions';

export const metadata = { title: 'Nueva actividad — Admin' };

export default async function NewActivityPage() {
    const tagGroups = await getEventTagGroupsWithCustom();

    return (
        <div>
            <h1 className="mb-6 font-serif text-2xl text-[#0A0A0A]">Nueva actividad</h1>
            <ActivityForm mode="create" tagGroups={tagGroups} action={createActivity} />
        </div>
    );
}
