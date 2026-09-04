'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { activitySchema } from '@/lib/validations/activity';
import { slugify } from '@/lib/slug';

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

function str(formData: FormData, key: string): string | undefined {
    const value = formData.get(key);
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
}

async function ensureUniqueSlug(
    supabase: SupabaseClient,
    base: string,
    excludeId?: string
): Promise<string> {
    let candidate = base;
    let suffix = 2;
    for (;;) {
        let query = supabase.from('activities').select('id').eq('slug', candidate);
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

async function deleteActivityImage(supabase: SupabaseClient, imageUrl: string | null) {
    if (!imageUrl) return;
    await deleteActivityImages(supabase, [imageUrl]);
}

async function deleteActivityImages(supabase: SupabaseClient, imageUrls: string[]) {
    const paths = imageUrls.map(extractStoragePath).filter((p): p is string => !!p);
    if (paths.length === 0) return;
    const { data, error } = await supabase.storage.from('images').remove(paths);
    if (error) {
        console.error('No se pudo borrar imagen(es) huérfana(s):', error.message);
    } else if (!data || data.length < paths.length) {
        // Supabase Storage no tira error si RLS filtra el archivo silenciosamente
        // (ej. falta política de SELECT) — sin este check, la imagen queda huérfana
        // sin ninguna señal de que algo salió mal.
        console.error(`No se pudieron borrar todas las imágenes huérfanas (${data?.length ?? 0}/${paths.length} removidas, ¿falta política RLS de SELECT?): ${paths.join(', ')}`);
    }
}

async function uploadActivityImage(supabase: SupabaseClient, file: File, slug: string, index?: number): Promise<string> {
    const ext = file.name.split('.').pop() || 'jpg';
    const suffix = index === undefined ? '' : `-${index}`;
    const path = `activities/${slug}-${Date.now()}${suffix}.${ext}`;
    const { error } = await supabase.storage.from('images').upload(path, file);
    if (error) throw new Error(`No se pudo subir la imagen: ${error.message}`);
    const { data } = supabase.storage.from('images').getPublicUrl(path);
    return data.publicUrl;
}

function parsePriceTiers(formData: FormData): unknown {
    const raw = formData.get('price_tiers');
    if (typeof raw !== 'string') return [];
    try {
        return JSON.parse(raw);
    } catch {
        return [];
    }
}

type PhotoUrlMeta = { url: string | null };

function parsePhotoUrlsMeta(formData: FormData): PhotoUrlMeta[] {
    const raw = formData.get('photo_urls_meta');
    if (typeof raw !== 'string') return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

// Para cada slot del editor: si trae un archivo nuevo (`activity_gallery_{i}`) lo sube;
// si no, conserva la `url` existente del slot. Slots sin archivo ni url se descartan.
async function resolveGalleryPhotos(
    supabase: SupabaseClient,
    formData: FormData,
    meta: PhotoUrlMeta[],
    slug: string
): Promise<string[]> {
    const urls: string[] = [];
    for (let i = 0; i < meta.length; i++) {
        const file = formData.get(`activity_gallery_${i}`);
        if (file instanceof File && file.size > 0) {
            urls.push(await uploadActivityImage(supabase, file, slug, i));
        } else if (meta[i]?.url) {
            urls.push(meta[i].url as string);
        }
    }
    return urls;
}

function parseActivityForm(formData: FormData) {
    const priceRaw = str(formData, 'price');
    const tagsRaw = str(formData, 'tags');
    const isFree = formData.get('is_free') === 'on';

    return activitySchema.parse({
        title: str(formData, 'title') ?? '',
        slug: str(formData, 'slug'),
        description: str(formData, 'description'),
        category: str(formData, 'category'),
        zone: str(formData, 'zone') ?? '',
        venue_name: str(formData, 'venue_name'),
        place_id: str(formData, 'place_id'),
        recurrence_text: str(formData, 'recurrence_text') ?? '',
        price: !isFree && priceRaw ? Math.round(parseFloat(priceRaw) * 100) / 100 : undefined,
        is_free: isFree,
        price_tiers: parsePriceTiers(formData),
        contact_link: str(formData, 'contact_link'),
        sponsored: formData.get('sponsored') === 'on',
        featured: formData.get('featured') === 'on',
        tags: tagsRaw ? tagsRaw.split(',').filter(Boolean) : [],
        status: str(formData, 'status') ?? 'pending',
    });
}

function publishedAt(status: string): string | null {
    return status === 'published' ? new Date().toISOString() : null;
}

export async function createActivity(formData: FormData) {
    const supabase = await createClient();
    const parsed = parseActivityForm(formData);

    const baseSlug = slugify(parsed.slug ?? parsed.title);
    const slug = await ensureUniqueSlug(supabase, baseSlug);

    let imageUrl: string | null = null;
    const imageFile = formData.get('image');
    if (imageFile instanceof File && imageFile.size > 0) {
        imageUrl = await uploadActivityImage(supabase, imageFile, slug);
    }

    const photoUrls = await resolveGalleryPhotos(supabase, formData, parsePhotoUrlsMeta(formData), slug);

    const { error } = await supabase.from('activities').insert({
        ...parsed,
        slug,
        image_url: imageUrl,
        photo_urls: photoUrls,
        venue_name: parsed.venue_name ?? null,
        place_id: parsed.place_id ?? null,
        description: parsed.description ?? null,
        contact_link: parsed.contact_link ?? null,
        price: parsed.price ?? null,
        published_at: publishedAt(parsed.status),
        updated_at: new Date().toISOString(),
    });

    if (error) throw new Error(error.message);

    revalidatePath('/admin/activities');
    revalidatePath('/actividades');
    revalidatePath('/');
    redirect('/admin/activities');
}

export async function updateActivity(id: string, formData: FormData) {
    const supabase = await createClient();
    const parsed = parseActivityForm(formData);

    const { data: existing } = await supabase
        .from('activities')
        .select('image_url, photo_urls')
        .eq('id', id)
        .single();

    const baseSlug = slugify(parsed.slug ?? parsed.title);
    const slug = await ensureUniqueSlug(supabase, baseSlug, id);

    let imageUrl = existing?.image_url ?? null;
    const imageFile = formData.get('image');
    if (imageFile instanceof File && imageFile.size > 0) {
        imageUrl = await uploadActivityImage(supabase, imageFile, slug);
        await deleteActivityImage(supabase, existing?.image_url ?? null);
    } else if (str(formData, 'remove_image') === '1') {
        await deleteActivityImage(supabase, existing?.image_url ?? null);
        imageUrl = null;
    }

    const photoUrls = await resolveGalleryPhotos(supabase, formData, parsePhotoUrlsMeta(formData), slug);

    // Limpieza de huérfanos: diff contra lo que ya había en la DB, no un flag del
    // cliente — cualquier URL que estaba antes y ya no está en el resultado final se borra.
    const existingPhotoUrls: string[] = existing?.photo_urls ?? [];
    const keptOrNew = new Set(photoUrls);
    const removedPhotoUrls = existingPhotoUrls.filter(u => !keptOrNew.has(u));
    if (removedPhotoUrls.length > 0) await deleteActivityImages(supabase, removedPhotoUrls);

    const { error } = await supabase
        .from('activities')
        .update({
            ...parsed,
            slug,
            image_url: imageUrl,
            photo_urls: photoUrls,
            venue_name: parsed.venue_name ?? null,
            place_id: parsed.place_id ?? null,
            description: parsed.description ?? null,
            contact_link: parsed.contact_link ?? null,
            price: parsed.price ?? null,
            published_at: publishedAt(parsed.status),
            updated_at: new Date().toISOString(),
        })
        .eq('id', id);

    if (error) throw new Error(error.message);

    revalidatePath('/admin/activities');
    revalidatePath('/actividades');
    revalidatePath('/');
    redirect('/admin/activities');
}

export async function deleteActivity(id: string) {
    const supabase = await createClient();
    const { data: existing } = await supabase
        .from('activities')
        .select('image_url, photo_urls')
        .eq('id', id)
        .single();

    const { error } = await supabase.from('activities').delete().eq('id', id);
    if (error) throw new Error(error.message);

    await deleteActivityImage(supabase, existing?.image_url ?? null);
    await deleteActivityImages(supabase, existing?.photo_urls ?? []);

    revalidatePath('/admin/activities');
    revalidatePath('/actividades');
    revalidatePath('/');
}
