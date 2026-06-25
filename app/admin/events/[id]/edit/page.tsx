import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { EventForm } from '@/components/admin/event-form';
import { updateEvent } from '../../actions';
import type { DbEvent } from '@/lib/types';

export const metadata = { title: 'Editar evento — Admin' };

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();
    const { data } = await supabase
        .from('events')
        .select('*, places(name)')
        .eq('id', id)
        .single();

    if (!data) notFound();

    const { places: relatedPlace, ...event } = data;

    return (
        <div>
            <h1 className="mb-6 font-serif text-2xl text-[#0A0A0A]">Editar evento</h1>
            <EventForm
                mode="edit"
                event={event as DbEvent}
                initialPlaceName={relatedPlace?.name}
                action={updateEvent.bind(null, id)}
            />
        </div>
    );
}
