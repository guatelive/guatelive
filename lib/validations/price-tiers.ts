import { z } from 'zod';

export const priceTierSchema = z.object({
    label: z.string().trim().min(1),
    price: z.number().nonnegative(),
});

export const priceTiersSchema = z.array(priceTierSchema);
