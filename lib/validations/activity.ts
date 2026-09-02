import { z } from 'zod';
import { EVENT_CATEGORIES } from '@/lib/event-categories';
import { priceTiersSchema } from '@/lib/validations/price-tiers';

export const activitySchema = z.object({
    title: z.string().trim().min(1, 'El título es obligatorio'),
    slug: z.string().trim().optional(),
    description: z.string().trim().optional(),
    category: z.enum(EVENT_CATEGORIES),
    zone: z.string().trim().min(1, 'La zona es obligatoria'),
    venue_name: z.string().trim().optional(),
    place_id: z.string().uuid().optional(),
    recurrence_text: z.string().trim().min(1, 'Contá cuándo se puede hacer (ej. "Todos los sábados 8am")'),
    price: z.number().nonnegative().optional(),
    is_free: z.boolean(),
    price_tiers: priceTiersSchema.default([]),
    image_url: z.string().url().optional(),
    contact_link: z.string().url().optional(),
    sponsored: z.boolean(),
    featured: z.boolean(),
    tags: z.array(z.string()),
    status: z.enum(['pending', 'published']),
});

export type ActivityFormData = z.infer<typeof activitySchema>;
