import { z } from 'zod';
import { EVENT_CATEGORIES } from '@/lib/event-categories';
import { priceTiersSchema } from '@/lib/validations/price-tiers';

export const eventSchema = z.object({
    title: z.string().trim().min(1, 'El título es obligatorio'),
    slug: z.string().trim().optional(),
    description: z.string().trim().optional(),
    category: z.enum(EVENT_CATEGORIES),
    zone: z.string().trim().min(1, 'La zona es obligatoria'),
    venue_name: z.string().trim().optional(),
    place_id: z.string().uuid().optional(),
    date_start: z.string().min(1, 'La fecha es obligatoria'),
    date_end: z.string().optional(),
    extra_dates: z.array(z.string().min(1)).max(60).default([]),
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

export type EventFormData = z.infer<typeof eventSchema>;
