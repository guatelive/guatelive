// Registro de adaptadores por fuente. Agregar una fuente nueva es sumar una línea
// acá + un archivo nuevo tipo guatemala-com.ts/eticket.ts — nada más del pipeline
// (orquestador, dedupe, upsert) necesita cambiar. Facebook Events queda fuera a
// propósito (ver ADR-019 y docs/decisions.md — no se evade protección anti-bot ni
// login de terceros).

import { guatemalaComSource } from './guatemala-com';
import { eticketSource } from './eticket';
import type { EventSource } from './types';

export const EVENT_SOURCES: Record<string, EventSource> = {
    'guatemala-com': guatemalaComSource,
    'eticket': eticketSource,
};
