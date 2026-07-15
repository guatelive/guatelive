'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { placeSchema } from '@/lib/validations/place';
import { slugify } from '@/lib/slug';

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

type PlacePhotoFormData = {
    url?: string;
    is_primary: boolean;
};

function str(formData: FormData, key: string): string | undefined {
    const value = formData.get(key);
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
}

function num(formData: FormData, key: string): number | undefined {
    const raw = str(formData, key);
    if (raw === undefined) return undefined;
    const n = Number(raw);
    return Number.isNaN(n) ? undefined : n;
}

function parseJsonObject(formData: FormData, key: string): Record<string, string> | undefined {
    const raw = formData.get(key);
    if (typeof raw !== 'string' || raw.trim() === '') return undefined;
    try {
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : undefined;
    } catch {
        return undefined;
    }
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
        let query = supabase.from('places').select('id').eq('slug', candidate);
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

async function deletePlaceImage(supabase: SupabaseClient, imageUrl: string | null | undefined) {
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

async function uploadPlaceImage(supabase: SupabaseClient, file: File, slug: string, index: number): Promise<string> {
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `places/${slug}-${Date.now()}-${index}.${ext}`;
    const { error } = await supabase.storage.from('images').upload(path, file);
    if (error) throw new Error(`No se pudo subir la imagen: ${error.message}`);
    const { data } = supabase.storage.from('images').getPublicUrl(path);
    return data.publicUrl;
}

async function uploadPlacePhotos(
    supabase: SupabaseClient,
    photos: PlacePhotoFormData[],
    formData: FormData,
    slug: string
): Promise<PlacePhotoFormData[]> {
    return Promise.all(
        photos.map(async (photo, i) => {
            const file = formData.get(`place_photo_${i}`);
            if (file instanceof File && file.size > 0) {
                const url = await uploadPlaceImage(supabase, file, slug, i);
                return { ...photo, url };
            }
            return photo;
        })
    );
}

async function replacePlacePhotos(
    supabase: SupabaseClient,
    placeId: string,
    photos: PlacePhotoFormData[]
) {
    await supabase.from('place_photos').delete().eq('place_id', placeId);
    const withUrl = photos.filter((p): p is PlacePhotoFormData & { url: string } => !!p.url);
    if (withUrl.length === 0) return;

    const rows = withUrl.map((photo, i) => ({
        place_id: placeId,
        url: photo.url,
        is_primary: photo.is_primary,
        order_index: i,
    }));

    const { error } = await supabase.from('place_photos').insert(rows);
    if (error) throw new Error(error.message);
}

function parsePlaceForm(formData: FormData) {
    const tagsRaw = str(formData, 'tags');

    return placeSchema.parse({
        name: str(formData, 'name') ?? '',
        slug: str(formData, 'slug'),
        zone: str(formData, 'zone') ?? '',
        city: str(formData, 'city'),
        address: str(formData, 'address'),
        primary_category: str(formData, 'primary_category'),
        category: str(formData, 'category'),
        description: str(formData, 'description'),
        tags: tagsRaw ? tagsRaw.split(',').filter(Boolean) : [],
        price_range: str(formData, 'price_range'),
        phone: str(formData, 'phone'),
        whatsapp: str(formData, 'whatsapp'),
        website: str(formData, 'website'),
        google_maps_url: str(formData, 'google_maps_url'),
        rating: num(formData, 'rating'),
        rating_count: num(formData, 'rating_count'),
        latitude: num(formData, 'latitude'),
        longitude: num(formData, 'longitude'),
        hours: parseJsonObject(formData, 'hours'),
        is_published: formData.get('is_published') === 'on',
        is_featured: formData.get('is_featured') === 'on',
    });
}

function revalidatePlacePaths(zone?: string | null) {
    revalidatePath('/admin/places');
    revalidatePath('/lugar/[slug]', 'page');
    revalidatePath('/');
    revalidatePath('/buscar');
    if (zone) revalidatePath(`/zona/${slugify(zone)}/restaurantes`);
}

export async function createPlace(formData: FormData) {
    const supabase = await createClient();
    const parsed = parsePlaceForm(formData);
    const photos = parseJsonArray<PlacePhotoFormData>(formData, 'photos');

    const baseSlug = slugify(parsed.slug ?? parsed.name);
    const slug = await ensureUniqueSlug(supabase, baseSlug);

    const photosWithImages = await uploadPlacePhotos(supabase, photos, formData, slug);

    const { data: place, error } = await supabase
        .from('places')
        .insert({
            slug,
            name: parsed.name,
            zone: parsed.zone,
            city: parsed.city ?? null,
            address: parsed.address ?? null,
            primary_category: parsed.primary_category ?? null,
            category: parsed.category ?? null,
            description: parsed.description ?? null,
            tags: parsed.tags,
            price_range: parsed.price_range ?? null,
            phone: parsed.phone ?? null,
            whatsapp: parsed.whatsapp ?? null,
            website: parsed.website ?? null,
            google_maps_url: parsed.google_maps_url ?? null,
            rating: parsed.rating ?? null,
            rating_count: parsed.rating_count ?? null,
            latitude: parsed.latitude ?? null,
            longitude: parsed.longitude ?? null,
            hours: parsed.hours ?? null,
            is_published: parsed.is_published,
            is_featured: parsed.is_featured,
            is_verified: false,
            is_active: true,
            source: 'editorial_discovery',
        })
        .select('id')
        .single();

    if (error) throw new Error(error.message);

    await replacePlacePhotos(supabase, place.id, photosWithImages);

    revalidatePlacePaths(parsed.zone);
    redirect('/admin/places');
}

export async function updatePlace(id: string, formData: FormData) {
    const supabase = await createClient();
    const parsed = parsePlaceForm(formData);
    const photos = parseJsonArray<PlacePhotoFormData>(formData, 'photos');

    const { data: existingPhotos } = await supabase
        .from('place_photos')
        .select('url')
        .eq('place_id', id);

    const baseSlug = slugify(parsed.slug ?? parsed.name);
    const slug = await ensureUniqueSlug(supabase, baseSlug, id);

    const photosWithImages = await uploadPlacePhotos(supabase, photos, formData, slug);

    const { error } = await supabase
        .from('places')
        .update({
            slug,
            name: parsed.name,
            zone: parsed.zone,
            city: parsed.city ?? null,
            address: parsed.address ?? null,
            primary_category: parsed.primary_category ?? null,
            category: parsed.category ?? null,
            description: parsed.description ?? null,
            tags: parsed.tags,
            price_range: parsed.price_range ?? null,
            phone: parsed.phone ?? null,
            whatsapp: parsed.whatsapp ?? null,
            website: parsed.website ?? null,
            google_maps_url: parsed.google_maps_url ?? null,
            rating: parsed.rating ?? null,
            rating_count: parsed.rating_count ?? null,
            latitude: parsed.latitude ?? null,
            longitude: parsed.longitude ?? null,
            hours: parsed.hours ?? null,
            is_published: parsed.is_published,
            is_featured: parsed.is_featured,
        })
        .eq('id', id);

    if (error) throw new Error(error.message);

    await replacePlacePhotos(supabase, id, photosWithImages);

    // Limpiar fotos reemplazadas o eliminadas — cualquier URL vieja que ya no esté en
    // el set nuevo se borra del bucket (mismo patrón que updateEdition para edition_places).
    const newPhotoUrls = new Set(photosWithImages.map(p => p.url).filter(Boolean));
    const orphanedPhotos = (existingPhotos ?? [])
        .map(p => p.url)
        .filter((url): url is string => !!url && !newPhotoUrls.has(url));
    await Promise.all(orphanedPhotos.map(url => deletePlaceImage(supabase, url)));

    revalidatePlacePaths(parsed.zone);
    redirect('/admin/places');
}

export async function deletePlace(id: string) {
    const supabase = await createClient();
    const { data: existing } = await supabase
        .from('places')
        .select('zone')
        .eq('id', id)
        .single();

    const { data: existingPhotos } = await supabase
        .from('place_photos')
        .select('url')
        .eq('place_id', id);

    const { error } = await supabase.from('places').delete().eq('id', id);
    if (error) throw new Error(error.message);

    await Promise.all((existingPhotos ?? []).map(p => deletePlaceImage(supabase, p.url)));

    revalidatePlacePaths(existing?.zone);
}
