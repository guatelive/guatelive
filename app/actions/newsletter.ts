'use server';

import { createClient as createServiceClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { newsletterSchema } from '@/lib/validations/newsletter';

export type NewsletterState = {
    status: 'idle' | 'success' | 'error';
    message?: string;
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

    const supabase = await createClient();
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

    return { status: 'success' };
}

async function mergeInterests(email: string, interests: string[]): Promise<void> {
    const admin = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
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
