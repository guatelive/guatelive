import { z } from 'zod';
import { NEWSLETTER_INTEREST_VALUES } from '@/lib/newsletter-interests';

export const newsletterSchema = z.object({
    email: z.string().trim().email('Ingresá un email válido'),
    // Opcional. Valores fuera de la lista se rechazan (el form solo manda los de la lista).
    interests: z.array(z.enum(NEWSLETTER_INTEREST_VALUES)).max(NEWSLETTER_INTEREST_VALUES.length).default([]),
});
