'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { eventSchema } from '@/lib/validations/event';
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
        let query = supabase.from('events').select('id').eq('slug', candidate);
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

async function deleteEventImage(supabase: SupabaseClient, imageUrl: string | null) {
    if (!imageUrl) return;
    const path = extractStoragePath(imageUrl);
    if (!path) return;
    const { error } = await supabase.storage.from('images').remove([path]);
    if (error) console.error('No se pudo borrar la imagen huérfana:', error.message);
}

async function uploadEventImage(supabase: SupabaseClient, file: File, slug: string): Promise<string> {
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `events/${slug}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('images').upload(path, file);
    if (error) throw new Error(`No se pudo subir la imagen: ${error.message}`);
    const { data } = supabase.storage.from('images').getPublicUrl(path);
    return data.publicUrl;
}

function parseEventForm(formData: FormData) {
    const priceRaw = str(formData, 'price');
    const tagsRaw = str(formData, 'tags');
    const isFree = formData.get('is_free') === 'on';

    return eventSchema.parse({
        title: str(formData, 'title') ?? '',
        slug: str(formData, 'slug'),
        description: str(formData, 'description'),
        category: str(formData, 'category'),
        zone: str(formData, 'zone') ?? '',
        venue_name: str(formData, 'venue_name'),
        place_id: str(formData, 'place_id'),
        date_start: str(formData, 'date_start') ?? '',
        date_end: str(formData, 'date_end'),
        price: !isFree && priceRaw ? Math.round(parseFloat(priceRaw) * 100) / 100 : undefined,
        is_free: isFree,
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

export async function createEvent(formData: FormData) {
    const supabase = await createClient();
    const parsed = parseEventForm(formData);

    const baseSlug = slugify(parsed.slug ?? parsed.title);
    const slug = await ensureUniqueSlug(supabase, baseSlug);

    let imageUrl: string | null = null;
    const imageFile = formData.get('image');
    if (imageFile instanceof File && imageFile.size > 0) {
        imageUrl = await uploadEventImage(supabase, imageFile, slug);
    }

    const { error } = await supabase.from('events').insert({
        ...parsed,
        slug,
        image_url: imageUrl,
        venue_name: parsed.venue_name ?? null,
        place_id: parsed.place_id ?? null,
        description: parsed.description ?? null,
        contact_link: parsed.contact_link ?? null,
        price: parsed.price ?? null,
        date_end: parsed.date_end ?? null,
        published_at: publishedAt(parsed.status),
    });

    if (error) throw new Error(error.message);

    revalidatePath('/admin/events');
    revalidatePath('/');
    redirect('/admin/events');
}

export async function updateEvent(id: string, formData: FormData) {
    const supabase = await createClient();
    const parsed = parseEventForm(formData);

    const { data: existing } = await supabase
        .from('events')
        .select('image_url')
        .eq('id', id)
        .single();

    const baseSlug = slugify(parsed.slug ?? parsed.title);
    const slug = await ensureUniqueSlug(supabase, baseSlug, id);

    let imageUrl = existing?.image_url ?? null;
    const imageFile = formData.get('image');
    if (imageFile instanceof File && imageFile.size > 0) {
        imageUrl = await uploadEventImage(supabase, imageFile, slug);
        await deleteEventImage(supabase, existing?.image_url ?? null);
    } else if (str(formData, 'remove_image') === '1') {
        await deleteEventImage(supabase, existing?.image_url ?? null);
        imageUrl = null;
    }

    const { error } = await supabase
        .from('events')
        .update({
            ...parsed,
            slug,
            image_url: imageUrl,
            venue_name: parsed.venue_name ?? null,
            place_id: parsed.place_id ?? null,
            description: parsed.description ?? null,
            contact_link: parsed.contact_link ?? null,
            price: parsed.price ?? null,
            date_end: parsed.date_end ?? null,
            published_at: publishedAt(parsed.status),
        })
        .eq('id', id);

    if (error) throw new Error(error.message);

    revalidatePath('/admin/events');
    revalidatePath('/');
    redirect('/admin/events');
}

export async function deleteEvent(id: string) {
    const supabase = await createClient();
    const { data: existing } = await supabase
        .from('events')
        .select('image_url')
        .eq('id', id)
        .single();

    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) throw new Error(error.message);

    await deleteEventImage(supabase, existing?.image_url ?? null);

    revalidatePath('/admin/events');
    revalidatePath('/');
}
