import { z } from 'zod';

export const editionItemSchema = z.object({
    place_id: z.string().uuid().optional(),
    title: z.string().trim().optional(),
    mention_type: z.enum(['highlighted', 'mentioned', 'drinks', 'desserts', 'not_recommended']),
    badges: z.array(z.string()),
    editorial_text: z.string().trim().optional(),
    photo_url: z.string().url().optional(),
    photo_orientation: z.enum(['portrait', 'landscape']).default('portrait'),
});

export const summaryItemSchema = z.object({
    label: z.string().trim().min(1),
    value: z.string().trim().min(1),
});

export const editionSchema = z.object({
    slug: z.string().trim().optional(),
    number: z.number().int().positive(),
    title: z.string().trim().min(1, 'El título es obligatorio'),
    subtitle: z.string().trim().optional(),
    intro_text: z.string().trim().optional(),
    summary_items: z.array(summaryItemSchema),
    food_rating: z.number().min(0).max(5).optional(),
    food_verdict: z.string().trim().optional(),
    place_rating: z.number().min(0).max(5).optional(),
    place_verdict: z.string().trim().optional(),
    closing_text: z.string().trim().optional(),
    theme_tags: z.array(z.string()),
    meta_title: z.string().trim().optional(),
    meta_description: z.string().trim().optional(),
    status: z.enum(['draft', 'published']),
    items: z.array(editionItemSchema),
});

export type EditionFormData = z.infer<typeof editionSchema>;
export type EditionItemFormData = z.infer<typeof editionItemSchema>;
export type SummaryItemFormData = z.infer<typeof summaryItemSchema>;
