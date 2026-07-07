// Registro de adaptadores por banco. Agregar un banco nuevo (BI, Industrial,
// Promerica) es sumar una línea acá + un archivo nuevo tipo bac.ts — nada más
// del pipeline (matching, upsert, tabla, UI) necesita cambiar.

import { bacSource } from './bac';
import type { BankPromoSource } from './types';

export const BANK_SOURCES: Record<string, BankPromoSource> = {
    bac: bacSource,
};
