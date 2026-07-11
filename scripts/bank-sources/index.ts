// Registro de adaptadores por banco. Agregar un banco nuevo es sumar una línea
// acá + un archivo nuevo tipo bac.ts/promerica.ts — nada más del pipeline
// (matching, upsert, tabla, UI) necesita cambiar. BI/Industrial y BAM quedaron
// descartados por ahora: sus sitios están detrás de un firewall anti-bot
// (Incapsula) que devuelve solo una página de reto en JS, sin importar la ruta.

import { bacSource } from './bac';
import { promericaSource } from './promerica';
import type { BankPromoSource } from './types';

export const BANK_SOURCES: Record<string, BankPromoSource> = {
    bac: bacSource,
    promerica: promericaSource,
};
