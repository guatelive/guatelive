import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { EditionForm, type EditionWithItems } from '@/components/admin/edition-form';
import type { EditionItem } from '@/components/admin/edition-items-editor';
import { updateEdition } from '../../actions';

export const metadata = { title: 'Editar edición — Admin' };

export default async function EditEditionPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: edition } = await supabase
        .from('editions')
        .select('*')
        .eq('id', id)
        .single();

    if (!edition) notFound();

    const { data: places } = await supabase
        .from('edition_places')
        .select('place_id, title, mention_type, order_index, photo_url, photo_orientation, badges, editorial_text, places(name)')
        .eq('edition_id', id)
        .order('order_index', { ascending: true });

    const items: EditionItem[] = (places ?? []).map(p => ({
        place_id: p.place_id ?? undefined,
        place_name: (p.places as { name?: string } | null)?.name ?? undefined,
        title: p.title ?? undefined,
        mention_type: p.mention_type,
        badges: p.badges ?? [],
        editorial_text: p.editorial_text ?? undefined,
        photo_url: p.photo_url ?? undefined,
        photo_orientation: (p.photo_orientation === 'landscape' ? 'landscape' : 'portrait') as 'portrait' | 'landscape',
    }));

    const editionWithItems: EditionWithItems = {
        slug: edition.slug,
        number: edition.number,
        title: edition.title,
        subtitle: edition.subtitle,
        intro_text: edition.intro_text,
        cover_image_url: edition.cover_image_url,
        strip_photos: edition.strip_photos ?? [],
        summary_items: edition.summary_items ?? [],
        food_rating: edition.food_rating,
        food_verdict: edition.food_verdict,
        place_rating: edition.place_rating,
        place_verdict: edition.place_verdict,
        closing_text: edition.closing_text,
        theme_tags: edition.theme_tags ?? [],
        meta_title: edition.meta_title,
        meta_description: edition.meta_description,
        status: edition.status,
        items,
    };

    return (
        <div>
            <h1 className="mb-6 font-serif text-2xl text-[#0A0A0A]">Editar edición</h1>
            <EditionForm mode="edit" edition={editionWithItems} action={updateEdition.bind(null, id)} />
        </div>
    );
}
