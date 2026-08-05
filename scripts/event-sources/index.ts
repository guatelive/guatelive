// Registro de adaptadores por fuente. Agregar una fuente nueva es sumar una línea
// acá + un archivo nuevo tipo eticket.ts — nada más del pipeline (orquestador,
// dedupe, upsert) necesita cambiar.
//
// Facebook Events queda fuera a propósito (ver ADR-019/ADR-020 en docs/decisions.md
// — no se evade login ni ToS de terceros). eventos.guatemala.com también se evaluó
// y se descartó (mismo ADR-020): su robots.txt bloquea explícitamente una lista
// larga de bots de IA/scraping (GPTBot, Claude-Web, anthropic-ai, Scrapy, Diffbot,
// etc.) en todo el sitio — aunque el User-Agent de este scraper no está nombrado
// literalmente ahí, la intención del sitio es clara, y este proyecto ya tiene el
// criterio (ADR-019) de no evadir señales anti-scraping de terceros.

import { eticketSource } from './eticket';
import type { EventSource } from './types';

export const EVENT_SOURCES: Record<string, EventSource> = {
    'eticket': eticketSource,
};
