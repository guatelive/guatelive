'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { editionSchema, type EditionItemFormData } from '@/lib/validations/edition';
import { slugify } from '@/lib/slug';

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

function str(formData: FormData, key: string): string | undefined {
    const value = formData.get(key);
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
}

function parseJsonArray<T>(formData: FormData, key: string): T[] {
    const raw = formData.get(key);
    if (typeof raw !== 'string' || raw.trim() === '') return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

async function ensureUniqueSlug(
    supabase: SupabaseClient,
    base: string,
    excludeId?: string
): Promise<string> {
    let candidate = base;
    let suffix = 2;
    for (;;) {
        let query = supabase.from('editions').select('id').eq('slug', candidate);
        if (excludeId) query = query.neq('id', excludeId);
        const { data } = await query.maybeSingle();
        if (!data) return candidate;
        candidate = `${base}-${suffix}`;
        suffix += 1;
    }
}

function extractStoragePath(imageUrl: string): string | null {
    const marker = '/storage/v1/object/public/images/';
    const idx = imageUrl.indexOf(marker);
    return idx === -1 ? null : imageUrl.slice(idx + marker.length);
}

async function deleteEditionImage(supabase: SupabaseClient, imageUrl: string | null | undefined) {
    if (!imageUrl) return;
    const path = extractStoragePath(imageUrl);
    if (!path) return;
    const { data, error } = await supabase.storage.from('images').remove([path]);
    if (error) {
        console.error('No se pudo borrar la imagen huérfana:', error.message);
    } else if (!data || data.length === 0) {
        // Supabase Storage no tira error si RLS filtra el archivo silenciosamente
        // (ej. falta política de SELECT) — sin este check, la imagen queda huérfana
        // sin ninguna señal de que algo salió mal.
        console.error(`No se pudo borrar la imagen huérfana (0 archivos removidos, ¿falta política RLS de SELECT?): ${path}`);
    }
}

async function uploadEditionImage(supabase: SupabaseClient, file: File, name: string): Promise<string> {
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `editions/${name}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('images').upload(path, file);
    if (error) throw new Error(`No se pudo subir la imagen: ${error.message}`);
    const { data } = supabase.storage.from('images').getPublicUrl(path);
    return data.publicUrl;
}

function parseEditionForm(formData: FormData) {
    const numberRaw = str(formData, 'number');
    const foodRatingRaw = str(formData, 'food_rating');
    const placeRatingRaw = str(formData, 'place_rating');
    const themeTagsRaw = str(formData, 'theme_tags');

    return editionSchema.parse({
        slug: str(formData, 'slug'),
        number: numberRaw ? Number(numberRaw) : undefined,
        title: str(formData, 'title') ?? '',
        subtitle: str(formData, 'subtitle'),
        intro_text: str(formData, 'intro_text'),
        summary_items: parseJsonArray(formData, 'summary_items'),
        food_rating: foodRatingRaw ? Number(foodRatingRaw) : undefined,
        food_verdict: str(formData, 'food_verdict'),
        place_rating: placeRatingRaw ? Number(placeRatingRaw) : undefined,
        place_verdict: str(formData, 'place_verdict'),
        closing_text: str(formData, 'closing_text'),
        theme_tags: themeTagsRaw ? themeTagsRaw.split(',').filter(Boolean) : [],
        meta_title: str(formData, 'meta_title'),
        meta_description: str(formData, 'meta_description'),
        status: str(formData, 'status') ?? 'draft',
        items: parseJsonArray(formData, 'items'),
    });
}

function publishedAt(status: string): string | null {
    return status === 'published' ? new Date().toISOString() : null;
}

function revalidateEditionPaths(slug: string) {
    revalidatePath('/admin/ediciones');
    revalidatePath(`/edicion/${slug}`);
    revalidatePath('/edicion');
    revalidatePath('/');
    revalidatePath('/api/latest-edition');
}

async function uploadStripPhotos(
    supabase: SupabaseClient,
    formData: FormData,
    slug: string,
    existing: (string | null)[] = []
): Promise<string[]> {
    const results: string[] = [];
    for (let i = 0; i < 3; i++) {
        const file = formData.get(`strip_photo_${i}`);
        const removed = formData.get(`remove_strip_photo_${i}`) === '1';
        if (file instanceof File && file.size > 0) {
            const url = await uploadEditionImage(supabase, file, `${slug}-strip-${i}`);
            // Borrar la imagen anterior de ese slot si existía
            if (existing[i]) await deleteEditionImage(supabase, existing[i]);
            results.push(url);
        } else if (removed) {
            if (existing[i]) await deleteEditionImage(supabase, existing[i]);
        } else if (existing[i]) {
            results.push(existing[i] as string);
        }
        // Si no hay archivo nuevo, no se removió y tampoco había foto existente,
        // no se agrega nada (el slot queda vacío)
    }
    return results;
}

async function uploadItemImages(
    supabase: SupabaseClient,
    items: EditionItemFormData[],
    formData: FormData,
    slug: string
): Promise<EditionItemFormData[]> {
    return Promise.all(
        items.map(async (item, i) => {
            const file = formData.get(`item_image_${i}`);
            if (file instanceof File && file.size > 0) {
                const photo_url = await uploadEditionImage(supabase, file, `${slug}-item-${i}`);
                return { ...item, photo_url };
            }
            return item;
        })
    );
}

async function replaceEditionPlaces(
    supabase: SupabaseClient,
    editionId: string,
    items: EditionItemFormData[]
) {
    await supabase.from('edition_places').delete().eq('edition_id', editionId);
    if (items.length === 0) return;

    const rows = items.map((item, i) => ({
        edition_id: editionId,
        place_id: item.place_id ?? null,
        title: item.title ?? null,
        mention_type: item.mention_type,
        order_index: i,
        photo_url: item.photo_url ?? null,
        photo_orientation: item.photo_orientation ?? 'portrait',
        badges: item.badges,
        editorial_text: item.editorial_text ?? null,
    }));

    const { error } = await supabase.from('edition_places').insert(rows);
    if (error) throw new Error(error.message);
}

export async function createEdition(formData: FormData) {
    const supabase = await createClient();
    const parsed = parseEditionForm(formData);

    const baseSlug = slugify(parsed.slug ?? parsed.title);
    const slug = await ensureUniqueSlug(supabase, baseSlug);

    let coverImageUrl: string | null = null;
    const coverFile = formData.get('cover_image');
    if (coverFile instanceof File && coverFile.size > 0) {
        coverImageUrl = await uploadEditionImage(supabase, coverFile, `${slug}-cover`);
    }

    const itemsWithImages = await uploadItemImages(supabase, parsed.items, formData, slug);
    const stripPhotoUrls = await uploadStripPhotos(supabase, formData, slug);

    const { data: edition, error } = await supabase
        .from('editions')
        .insert({
            slug,
            number: parsed.number,
            title: parsed.title,
            subtitle: parsed.subtitle ?? null,
            intro_text: parsed.intro_text ?? null,
            cover_image_url: coverImageUrl,
            strip_photos: stripPhotoUrls,
            summary_items: parsed.summary_items,
            food_rating: parsed.food_rating ?? null,
            food_verdict: parsed.food_verdict ?? null,
            place_rating: parsed.place_rating ?? null,
            place_verdict: parsed.place_verdict ?? null,
            closing_text: parsed.closing_text ?? null,
            theme_tags: parsed.theme_tags,
            meta_title: parsed.meta_title ?? null,
            meta_description: parsed.meta_description ?? null,
            status: parsed.status,
            published_at: publishedAt(parsed.status),
        })
        .select('id')
        .single();

    if (error) throw new Error(error.message);

    await replaceEditionPlaces(supabase, edition.id, itemsWithImages);

    revalidateEditionPaths(slug);
    redirect('/admin/ediciones');
}

export async function updateEdition(id: string, formData: FormData) {
    const supabase = await createClient();
    const parsed = parseEditionForm(formData);

    const { data: existing } = await supabase
        .from('editions')
        .select('cover_image_url, strip_photos')
        .eq('id', id)
        .single();

    const { data: existingPlaces } = await supabase
        .from('edition_places')
        .select('photo_url')
        .eq('edition_id', id);

    const baseSlug = slugify(parsed.slug ?? parsed.title);
    const slug = await ensureUniqueSlug(supabase, baseSlug, id);

    let coverImageUrl = existing?.cover_image_url ?? null;
    const coverFile = formData.get('cover_image');
    if (coverFile instanceof File && coverFile.size > 0) {
        coverImageUrl = await uploadEditionImage(supabase, coverFile, `${slug}-cover`);
        await deleteEditionImage(supabase, existing?.cover_image_url);
    } else if (formData.get('remove_cover_image') === '1') {
        await deleteEditionImage(supabase, existing?.cover_image_url);
        coverImageUrl = null;
    }

    const itemsWithImages = await uploadItemImages(supabase, parsed.items, formData, slug);
    const existingStrip = (existing?.strip_photos ?? []) as (string | null)[];
    const stripPhotoUrls = await uploadStripPhotos(supabase, formData, slug, existingStrip);

    const { error } = await supabase
        .from('editions')
        .update({
            slug,
            number: parsed.number,
            title: parsed.title,
            subtitle: parsed.subtitle ?? null,
            intro_text: parsed.intro_text ?? null,
            cover_image_url: coverImageUrl,
            strip_photos: stripPhotoUrls,
            summary_items: parsed.summary_items,
            food_rating: parsed.food_rating ?? null,
            food_verdict: parsed.food_verdict ?? null,
            place_rating: parsed.place_rating ?? null,
            place_verdict: parsed.place_verdict ?? null,
            closing_text: parsed.closing_text ?? null,
            theme_tags: parsed.theme_tags,
            meta_title: parsed.meta_title ?? null,
            meta_description: parsed.meta_description ?? null,
            status: parsed.status,
            published_at: publishedAt(parsed.status),
        })
        .eq('id', id);

    if (error) throw new Error(error.message);

    await replaceEditionPlaces(supabase, id, itemsWithImages);

    // Limpiar fotos de items reemplazados o eliminados — cualquier URL vieja que ya no
    // esté en el set nuevo se borra del bucket.
    const newPhotoUrls = new Set(itemsWithImages.map(i => i.photo_url).filter(Boolean));
    const orphanedPhotos = (existingPlaces ?? [])
        .map(p => p.photo_url)
        .filter((url): url is string => !!url && !newPhotoUrls.has(url));
    await Promise.all(orphanedPhotos.map(url => deleteEditionImage(supabase, url)));

    revalidateEditionPaths(slug);
    redirect('/admin/ediciones');
}

export async function deleteEdition(id: string) {
    const supabase = await createClient();
    const { data: existing } = await supabase
        .from('editions')
        .select('slug, cover_image_url, strip_photos')
        .eq('id', id)
        .single();

    const { data: existingPlaces } = await supabase
        .from('edition_places')
        .select('photo_url')
        .eq('edition_id', id);

    await supabase.from('edition_places').delete().eq('edition_id', id);

    const { error } = await supabase.from('editions').delete().eq('id', id);
    if (error) throw new Error(error.message);

    await deleteEditionImage(supabase, existing?.cover_image_url);
    await Promise.all((existing?.strip_photos ?? []).map((url: string) => deleteEditionImage(supabase, url)));
    await Promise.all((existingPlaces ?? []).map(p => deleteEditionImage(supabase, p.photo_url)));

    if (existing?.slug) {
        revalidateEditionPaths(existing.slug);
    } else {
        revalidatePath('/admin/ediciones');
    }
}
