'use server';

import { revalidatePath } from 'next/cache';
import { storagePathsFor, uploadOptimizedImage } from '@/lib/images/upload';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { planSchema, type PlanItemFormData } from '@/lib/validations/plan';
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

async function ensureUniqueSlug(supabase: SupabaseClient, base: string, excludeId?: string): Promise<string> {
    let candidate = base;
    let suffix = 2;
    for (;;) {
        let query = supabase.from('plans').select('id').eq('slug', candidate);
        if (excludeId) query = query.neq('id', excludeId);
        const { data } = await query.maybeSingle();
        if (!data) return candidate;
        candidate = `${base}-${suffix}`;
        suffix += 1;
    }
}

async function deletePlanImage(supabase: SupabaseClient, imageUrl: string | null | undefined) {
    if (!imageUrl) return;
    const paths = storagePathsFor(imageUrl);
    if (paths.length === 0) return;
    const { data, error } = await supabase.storage.from('images').remove(paths);
    if (error) {
        console.error('No se pudo borrar la imagen huérfana:', error.message);
    } else if (!data || data.length === 0) {
        // Supabase Storage no tira error si RLS filtra el archivo silenciosamente
        // (ej. falta política de SELECT) — sin este check, la imagen queda huérfana
        // sin ninguna señal de que algo salió mal.
        console.error(`No se pudo borrar la imagen huérfana (0 archivos removidos, ¿falta política RLS de SELECT?): ${paths.join(', ')}`);
    }
}

async function uploadPlanImage(supabase: SupabaseClient, file: File, slug: string): Promise<string> {
    return uploadOptimizedImage(supabase, file, `plans/${slug}-${Date.now()}`);
}

function parsePlanForm(formData: FormData) {
    const kind = str(formData, 'kind') ?? 'ocasion';
    return planSchema.parse({
        title: str(formData, 'title') ?? '',
        slug: str(formData, 'slug'),
        subtitle: str(formData, 'subtitle'),
        intro_text: str(formData, 'intro_text'),
        kind,
        starts_at: kind === 'ocasion' ? str(formData, 'starts_at') : undefined,
        ends_at: kind === 'ocasion' ? str(formData, 'ends_at') : undefined,
        theme_tags: parseJsonArray<string>(formData, 'theme_tags'),
        status: str(formData, 'status') ?? 'draft',
        sponsored: formData.get('sponsored') === 'on',
        items: parseJsonArray<PlanItemFormData>(formData, 'items'),
    });
}

// Mismo patrón que edition_places: se reemplazan todos los items en cada guardado.
async function replacePlanItems(supabase: SupabaseClient, planId: string, items: PlanItemFormData[]) {
    const { error: deleteError } = await supabase.from('plan_items').delete().eq('plan_id', planId);
    if (deleteError) throw new Error(deleteError.message);
    if (items.length === 0) return;

    const rows = items.map((item, i) => ({
        plan_id: planId,
        order_index: i,
        item_type: item.item_type,
        place_id: item.item_type === 'place' ? item.place_id : null,
        event_id: item.item_type === 'event' ? item.event_id : null,
        activity_id: item.item_type === 'activity' ? item.activity_id : null,
        custom_title: item.item_type === 'custom' ? item.custom_title : null,
        custom_subtitle: item.item_type === 'custom' ? item.custom_subtitle ?? null : null,
        label: item.label ?? null,
        editorial_note: item.editorial_note ?? null,
        sponsored: item.sponsored,
    }));
    const { error } = await supabase.from('plan_items').insert(rows);
    if (error) throw new Error(error.message);
}

function revalidatePlanPaths() {
    revalidatePath('/admin/planes');
    revalidatePath('/planes');
    revalidatePath('/planes/[slug]', 'page');
    revalidatePath('/');
}

export async function createPlan(formData: FormData) {
    const supabase = await createClient();
    const { items, ...parsed } = parsePlanForm(formData);
    const slug = await ensureUniqueSlug(supabase, slugify(parsed.slug ?? parsed.title));

    let coverUrl: string | null = null;
    const coverFile = formData.get('cover');
    if (coverFile instanceof File && coverFile.size > 0) {
        coverUrl = await uploadPlanImage(supabase, coverFile, slug);
    }

    const { data, error } = await supabase
        .from('plans')
        .insert({
            ...parsed,
            slug,
            subtitle: parsed.subtitle ?? null,
            intro_text: parsed.intro_text ?? null,
            starts_at: parsed.starts_at ?? null,
            ends_at: parsed.ends_at ?? null,
            cover_image_url: coverUrl,
            published_at: parsed.status === 'published' ? new Date().toISOString() : null,
        })
        .select('id')
        .single();
    if (error) throw new Error(error.message);

    await replacePlanItems(supabase, data.id, items);

    revalidatePlanPaths();
    redirect('/admin/planes');
}

export async function updatePlan(id: string, formData: FormData) {
    const supabase = await createClient();
    const { items, ...parsed } = parsePlanForm(formData);

    const { data: existing } = await supabase
        .from('plans')
        .select('cover_image_url, published_at')
        .eq('id', id)
        .single();

    const slug = await ensureUniqueSlug(supabase, slugify(parsed.slug ?? parsed.title), id);

    let coverUrl = existing?.cover_image_url ?? null;
    const coverFile = formData.get('cover');
    if (coverFile instanceof File && coverFile.size > 0) {
        coverUrl = await uploadPlanImage(supabase, coverFile, slug);
        await deletePlanImage(supabase, existing?.cover_image_url);
    } else if (str(formData, 'remove_cover') === '1') {
        await deletePlanImage(supabase, existing?.cover_image_url);
        coverUrl = null;
    }

    // published_at = primera vez que se publicó; no se pisa en cada guardado.
    const publishedAt = parsed.status === 'published'
        ? existing?.published_at ?? new Date().toISOString()
        : existing?.published_at ?? null;

    const { error } = await supabase
        .from('plans')
        .update({
            ...parsed,
            slug,
            subtitle: parsed.subtitle ?? null,
            intro_text: parsed.intro_text ?? null,
            starts_at: parsed.starts_at ?? null,
            ends_at: parsed.ends_at ?? null,
            cover_image_url: coverUrl,
            published_at: publishedAt,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id);
    if (error) throw new Error(error.message);

    await replacePlanItems(supabase, id, items);

    revalidatePlanPaths();
    redirect('/admin/planes');
}

export async function setPlanStatus(id: string, status: 'draft' | 'published' | 'archived') {
    const supabase = await createClient();
    const { data: existing } = await supabase.from('plans').select('published_at').eq('id', id).single();
    const { error } = await supabase
        .from('plans')
        .update({
            status,
            published_at: status === 'published' ? existing?.published_at ?? new Date().toISOString() : existing?.published_at ?? null,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id);
    if (error) throw new Error(error.message);
    revalidatePlanPaths();
}

export async function deletePlan(id: string) {
    const supabase = await createClient();
    const { data: existing } = await supabase.from('plans').select('cover_image_url').eq('id', id).single();

    // plan_items se borran solos (on delete cascade).
    const { error } = await supabase.from('plans').delete().eq('id', id);
    if (error) throw new Error(error.message);

    await deletePlanImage(supabase, existing?.cover_image_url);
    revalidatePlanPaths();
}
