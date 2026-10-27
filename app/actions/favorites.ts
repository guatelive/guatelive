'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const favoriteEventSchema = z.object({
    anonId: z.string().uuid(),
    type: z.enum(['place', 'event', 'activity']),
    slug: z.string().trim().min(1).max(200),
    action: z.enum(['add', 'remove']),
});

// Log anónimo para medir si la gente usa favoritos (ADR-028). Fire-and-forget: un
// fallo acá no afecta al ❤️, que ya quedó guardado en el navegador.
export async function logFavoriteEvent(input: z.input<typeof favoriteEventSchema>): Promise<void> {
    const parsed = favoriteEventSchema.safeParse(input);
    if (!parsed.success) return;
    const supabase = await createClient();
    const { error } = await supabase.from('favorite_events').insert({
        anon_id: parsed.data.anonId,
        item_type: parsed.data.type,
        item_slug: parsed.data.slug,
        action: parsed.data.action,
    });
    if (error) console.error('favorite_events insert error:', error.message);
}
