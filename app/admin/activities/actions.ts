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

async function uploadActivityImage(supabase: SupabaseClient, file: File, slug: string): Promise<string> {
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `activities/${slug}-${Date.now()}.${ext}`;
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

    const { error } = await supabase.from('activities').insert({
        ...parsed,
        slug,
        image_url: imageUrl,
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
        .select('image_url')
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

    const { error } = await supabase
        .from('activities')
        .update({
            ...parsed,
            slug,
            image_url: imageUrl,
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
        .select('image_url')
        .eq('id', id)
        .single();

    const { error } = await supabase.from('activities').delete().eq('id', id);
    if (error) throw new Error(error.message);

    await deleteActivityImage(supabase, existing?.image_url ?? null);

    revalidatePath('/admin/activities');
    revalidatePath('/actividades');
    revalidatePath('/');
}
