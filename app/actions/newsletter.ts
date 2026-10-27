'use server';

import { createClient as createServiceClient } from '@supabase/supabase-js';
import { newsletterSchema } from '@/lib/validations/newsletter';
import { NEWSLETTER_INTEREST_VALUES } from '@/lib/newsletter-interests';
import { z } from 'zod';

export type NewsletterState = {
    status: 'idle' | 'success' | 'error';
    message?: string;
    // Email ya validado y guardado: lo usa el paso 2 (intereses).
    email?: string;
};

const UNIQUE_VIOLATION = '23505';

export async function subscribeToNewsletter(
    _prevState: NewsletterState,
    formData: FormData
): Promise<NewsletterState> {
    // Honeypot: campo oculto que un humano nunca completa. Si viene con
    // valor, respondemos éxito sin insertar para no delatar al bot.
    if (typeof formData.get('company') === 'string' && formData.get('company') !== '') {
        return { status: 'success' };
    }

    const rawInterests = formData.get('interests');
    const parsed = newsletterSchema.safeParse({
        email: formData.get('email'),
        interests: typeof rawInterests === 'string' && rawInterests !== '' ? rawInterests.split(',') : [],
    });
    if (!parsed.success) {
        return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Email inválido' };
    }

    // Escribe con service role desde el server (input ya validado con Zod + honeypot).
    // Con el cliente de cookies, un visitante con sesión de admin abierta entraba como
    // `authenticated` y la RLS de la base solo permite insert a `anon`: "No se pudo
    // guardar tu email" (bug encontrado 2026-10-26). Así no depende de la sesión.
    const supabase = serviceClient();
    const { error } = await supabase
        .from('newsletter_subscribers')
        .insert({ email: parsed.data.email, interests: parsed.data.interests });

    // Email ya suscrito que ahora eligió intereses: se suman a los que tenía. anon
    // no puede leer ni actualizar la tabla (ADR-017), así que esto usa service role,
    // solo acá en el server. La respuesta sigue sin revelar si el email ya existía.
    if (error?.code === UNIQUE_VIOLATION && parsed.data.interests.length > 0) {
        await mergeInterests(parsed.data.email, parsed.data.interests);
    }

    // Email duplicado: no revelamos si ya existía, solo confirmamos éxito.
    if (error && error.code !== UNIQUE_VIOLATION) {
        console.error('newsletter insert error:', error);
        return { status: 'error', message: 'No se pudo guardar tu email. Intentá de nuevo.' };
    }

    return { status: 'success', email: parsed.data.email };
}

function serviceClient() {
    return createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

async function mergeInterests(email: string, interests: string[]): Promise<void> {
    const admin = serviceClient();
    const { data, error } = await admin
        .from('newsletter_subscribers')
        .select('interests')
        .eq('email', email)
        .single();
    if (error || !data) {
        console.error('newsletter merge read error:', error);
        return;
    }
    const merged = [...new Set([...((data.interests as string[] | null) ?? []), ...interests])];
    const { error: updateError } = await admin
        .from('newsletter_subscribers')
        .update({ interests: merged })
        .eq('email', email);
    if (updateError) console.error('newsletter merge update error:', updateError);
}

const interestsSchema = z.object({
    email: z.string().trim().email(),
    interests: z.array(z.enum(NEWSLETTER_INTEREST_VALUES)).min(1).max(NEWSLETTER_INTEREST_VALUES.length),
});

// Paso 2 del newsletter: el usuario ya se suscribió y elige qué le interesa. Se
// unen con los que tuviera. Quien conozca un email ajeno podría sumarle intereses;
// es un riesgo menor (solo preferencias, no expone datos) y evita pedir login.
export async function saveNewsletterInterests(email: string, interests: string[]): Promise<{ ok: boolean }> {
    const parsed = interestsSchema.safeParse({ email, interests });
    if (!parsed.success) return { ok: false };
    await mergeInterests(parsed.data.email, parsed.data.interests);
    return { ok: true };
}
