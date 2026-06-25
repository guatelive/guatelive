'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function signIn(formData: FormData) {
    const email = String(formData.get('email') ?? '');
    const password = String(formData.get('password') ?? '');
    const redirectTo = String(formData.get('redirect') ?? '/admin/events');

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        const params = new URLSearchParams({ error: error.message, redirect: redirectTo });
        redirect(`/login?${params.toString()}`);
    }

    redirect(redirectTo);
}

export async function signOut() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/login');
}
