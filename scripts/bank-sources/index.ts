// Registro de adaptadores por banco. Agregar un banco nuevo es sumar una línea
// acá + un archivo nuevo tipo bac.ts/promerica.ts — nada más del pipeline
// (matching, upsert, tabla, UI) necesita cambiar. BI/Industrial y BAM quedaron
// descartados por ahora: sus sitios están detrás de un firewall anti-bot
// (Incapsula) que devuelve solo una página de reto en JS, sin importar la ruta.
//
// `promericaSource` sigue registrado acá (por si se necesita correr a mano
// para probar si el bloqueo se revirtió) pero NO está en el matrix del cron
// (.github/workflows/scrape-bank-promos.yml) desde 2026-08-14 — su sitio
// bloquea explícitamente bots de IA/scraping en robots.txt. Ver ADR-019 en
// docs/decisions.md.

import { bacSource } from './bac';
import { promericaSource } from './promerica';
import { gtcSource } from './gtc';
import type { BankPromoSource } from './types';

export const BANK_SOURCES: Record<string, BankPromoSource> = {
    bac: bacSource,
    promerica: promericaSource,
    gtc: gtcSource,
};
