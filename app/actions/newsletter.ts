'use server';

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

    const parsed = newsletterSchema.safeParse({ email: formData.get('email') });
    if (!parsed.success) {
        return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Email inválido' };
    }

    const supabase = await createClient();
    const { error } = await supabase
        .from('newsletter_subscribers')
        .insert({ email: parsed.data.email });

    // Email duplicado: no revelamos si ya existía, solo confirmamos éxito.
    if (error && error.code !== UNIQUE_VIOLATION) {
        console.error('newsletter insert error:', error);
        return { status: 'error', message: 'No se pudo guardar tu email. Intentá de nuevo.' };
    }

    return { status: 'success' };
}
