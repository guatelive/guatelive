import { EventForm } from '@/components/admin/event-form';
import { createEvent } from '../actions';

export const metadata = { title: 'Nuevo evento — Admin' };

export default function NewEventPage() {
    return (
        <div>
            <h1 className="mb-6 font-serif text-2xl text-[#0A0A0A]">Nuevo evento</h1>
            <EventForm mode="create" action={createEvent} />
        </div>
    );
}
