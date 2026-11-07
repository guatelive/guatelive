import { z } from 'zod';
import { EVENT_CATEGORIES } from '@/lib/event-categories';
import { priceTiersSchema } from '@/lib/validations/price-tiers';

export const activityLocationSchema = z.object({
    name: z.string().trim().min(1, 'Cada sede necesita un nombre'),
    zone: z.string().trim().min(1, 'Cada sede necesita una zona'),
    schedule: z.string().trim().min(1, 'Cada sede necesita un horario'),
});

export const activitySchema = z.object({
    title: z.string().trim().min(1, 'El título es obligatorio'),
    slug: z.string().trim().optional(),
    description: z.string().trim().optional(),
    category: z.enum(EVENT_CATEGORIES),
    extra_categories: z.array(z.enum(EVENT_CATEGORIES)).default([]),
    zone: z.string().trim().min(1, 'La zona es obligatoria'),
    venue_name: z.string().trim().optional(),
    place_id: z.string().uuid().optional(),
    recurrence_text: z.string().trim().min(1, 'Contá cuándo se puede hacer (ej. "Todos los sábados 8am")'),
    extra_locations: z.array(activityLocationSchema).default([]),
    price: z.number().nonnegative().optional(),
    is_free: z.boolean(),
    price_tiers: priceTiersSchema.default([]),
    extra_prices: priceTiersSchema.default([]),
    image_url: z.string().url().optional(),
    photo_urls: z.array(z.string().url()).default([]),
    contact_link: z.string().url().optional(),
    sponsored: z.boolean(),
    featured: z.boolean(),
    tags: z.array(z.string()),
    status: z.enum(['pending', 'published']),
});

export type ActivityFormData = z.infer<typeof activitySchema>;
