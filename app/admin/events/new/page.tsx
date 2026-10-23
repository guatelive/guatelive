import { getEventTagGroupsWithCustom } from '@/lib/custom-event-tags';
import { EventForm } from '@/components/admin/event-form';
import { createEvent } from '../actions';

export const metadata = { title: 'Nuevo evento — Admin' };

export default async function NewEventPage() {
    const tagGroups = await getEventTagGroupsWithCustom();

    return (
        <div>
            <h1 className="mb-6 font-serif text-2xl text-[#0A0A0A]">Nuevo evento</h1>
            <EventForm mode="create" tagGroups={tagGroups} action={createEvent} />
        </div>
    );
}
