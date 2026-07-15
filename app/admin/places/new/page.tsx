import { PlaceForm } from '@/components/admin/place-form';
import { createPlace } from '../actions';

export const metadata = { title: 'Nuevo lugar — Admin' };

export default function NewPlacePage() {
    return (
        <div>
            <h1 className="mb-6 font-serif text-2xl text-[#0A0A0A]">Nuevo lugar</h1>
            <PlaceForm mode="create" action={createPlace} />
        </div>
    );
}
