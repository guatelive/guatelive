import { z } from 'zod';

const optionalText = z.string().trim().optional().transform(v => (v ? v : undefined));

export const planItemSchema = z
    .object({
        item_type: z.enum(['place', 'event', 'activity', 'custom']),
        place_id: z.string().uuid().optional(),
        event_id: z.string().uuid().optional(),
        activity_id: z.string().uuid().optional(),
        custom_title: optionalText,
        custom_subtitle: optionalText,
        label: optionalText,
        editorial_note: optionalText,
        sponsored: z.boolean().default(false),
    })
    // Mismo criterio que plan_items_ref_check en la DB — acá para dar un error legible.
    .refine(
        i =>
            (i.item_type === 'place' && !!i.place_id) ||
            (i.item_type === 'event' && !!i.event_id) ||
            (i.item_type === 'activity' && !!i.activity_id) ||
            (i.item_type === 'custom' && !!i.custom_title),
        { message: 'Cada item custom necesita un título' }
    );

// starts_at/ends_at llegan del input datetime-local ("2026-11-03T12:00"), hora de
// pared de Guatemala — se guardan tal cual, igual que events.date_start.
export const planSchema = z
    .object({
        title: z.string().trim().min(1, 'El título es obligatorio'),
        slug: optionalText,
        subtitle: optionalText,
        intro_text: optionalText,
        kind: z.enum(['ocasion', 'siempre']),
        starts_at: optionalText,
        ends_at: optionalText,
        theme_tags: z.array(z.string()),
        status: z.enum(['draft', 'published', 'archived']),
        sponsored: z.boolean(),
        items: z.array(planItemSchema),
    })
    .refine(p => p.kind === 'siempre' || (!!p.starts_at && !!p.ends_at), {
        message: 'Un plan de ocasión necesita fecha de inicio y de fin',
    })
    .refine(p => p.kind === 'siempre' || !p.starts_at || !p.ends_at || p.ends_at > p.starts_at, {
        message: 'La fecha de fin tiene que ser después de la de inicio',
    });

export type PlanFormData = z.infer<typeof planSchema>;
export type PlanItemFormData = z.infer<typeof planItemSchema>;
