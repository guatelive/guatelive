import { createClient } from '@/lib/supabase/server';
import { EditionForm } from '@/components/admin/edition-form';
import { createEdition } from '../actions';

export const metadata = { title: 'Nueva edición — Admin' };

export default async function NewEditionPage() {
    const supabase = await createClient();
    const { data: last } = await supabase
        .from('editions')
        .select('number')
        .order('number', { ascending: false })
        .limit(1)
        .maybeSingle();

    const nextNumber = (last?.number ?? 0) + 1;

    return (
        <div>
            <h1 className="mb-6 font-serif text-2xl text-[#0A0A0A]">Nueva edición</h1>
            <EditionForm mode="create" nextNumber={nextNumber} action={createEdition} />
        </div>
    );
}
