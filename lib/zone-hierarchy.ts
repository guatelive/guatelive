// Sub-zonas con identidad propia dentro de una zona más grande. Cayalá es un destino
// en sí (se mantiene como zona separada a propósito, decisión de Fredy 2026-10-22),
// pero físicamente está en Zona 16: filtrar por "Zona 16" tiene que incluir Cayalá,
// y filtrar por "Cayalá" solo Cayalá. Sin imports de servidor — se usa también en
// filtros del cliente.
const ZONE_CHILDREN: Record<string, string[]> = {
    'Zona 16': ['Cayalá'],
};

// Zonas que matchea un filtro por `zone`: ella misma + sus sub-zonas.
export function zonesWithin(zone: string): string[] {
    return [zone, ...(ZONE_CHILDREN[zone] ?? [])];
}

export function matchesZone(itemZone: string | null | undefined, selected: string): boolean {
    return !!itemZone && zonesWithin(selected).includes(itemZone);
}

// Suma a cada zona padre los conteos de sus sub-zonas (para listas de zonas con
// conteo, ej. /api/zones). No crea la zona padre si no tenía nada propio ni hijos.
export function rollUpZoneCounts(counts: Record<string, number>): Record<string, number> {
    const out = { ...counts };
    for (const [parent, children] of Object.entries(ZONE_CHILDREN)) {
        const childTotal = children.reduce((n, c) => n + (counts[c] ?? 0), 0);
        if (childTotal > 0) out[parent] = (out[parent] ?? 0) + childTotal;
    }
    return out;
}
