import { z } from 'zod';

export const placeSchema = z.object({
    name: z.string().trim().min(1, 'El nombre es obligatorio'),
    slug: z.string().trim().optional(),
    zone: z.string().trim().min(1, 'La zona es obligatoria'),
    city: z.string().trim().optional(),
    address: z.string().trim().optional(),
    primary_category: z.string().trim().optional(),
    category: z.string().trim().optional(),
    description: z.string().trim().optional(),
    tags: z.array(z.string()),
    price_range: z.string().trim().optional(),
    phone: z.string().trim().optional(),
    whatsapp: z.string().trim().optional(),
    website: z.string().trim().optional(),
    google_maps_url: z.string().trim().optional(),
    rating: z.number().min(0).max(5).optional(),
    rating_count: z.number().int().nonnegative().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    hours: z.record(z.string(), z.string()).optional(),
    is_published: z.boolean(),
    is_featured: z.boolean(),
});

export type PlaceFormData = z.infer<typeof placeSchema>;
