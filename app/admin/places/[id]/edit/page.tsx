import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PlaceForm } from '@/components/admin/place-form';
import { updatePlace } from '../../actions';
import type { Place, PlacePhoto } from '@/lib/types';

export const metadata = { title: 'Editar lugar — Admin' };

export default async function EditPlacePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: place } = await supabase
        .from('places')
        .select('*')
        .eq('id', id)
        .single();

    if (!place) notFound();

    const { data: photos } = await supabase
        .from('place_photos')
        .select('*')
        .eq('place_id', id)
        .order('order_index', { ascending: true });

    return (
        <div>
            <h1 className="mb-6 font-serif text-2xl text-[#0A0A0A]">Editar lugar</h1>
            <PlaceForm
                mode="edit"
                place={place as Place}
                photos={(photos ?? []) as PlacePhoto[]}
                action={updatePlace.bind(null, id)}
            />
        </div>
    );
}
