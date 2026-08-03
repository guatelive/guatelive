// El orden real de la query (discount_pct desc) puede dejar varias promos del
// mismo banco consecutivas — con 2+ bancos activos, eso se ve como si solo
// hubiera uno. Se reordena solo para DISPLAY (round-robin entre bancos,
// preservando el orden relativo dentro de cada banco) sin tocar el criterio de
// orden real de la base de datos.
export function interleaveByBank<T extends { bank: string }>(items: T[]): T[] {
    const byBank = new Map<string, T[]>();
    for (const item of items) {
        const bucket = byBank.get(item.bank);
        if (bucket) bucket.push(item);
        else byBank.set(item.bank, [item]);
    }

    const buckets = [...byBank.values()];
    const result: T[] = [];
    let round = 0;
    while (result.length < items.length) {
        for (const bucket of buckets) {
            if (round < bucket.length) result.push(bucket[round]);
        }
        round++;
    }
    return result;
}

// Reordenado solo para DISPLAY, igual que interleaveByBank — no toca el
// criterio real de orden en DB (discount_pct desc). Sembrado con la fecha
// (año/mes/día) para que el mismo día produzca el mismo orden para todos los
// visitantes, y el orden cambie de un día a otro sin depender de que el pool
// de promos activas haya cambiado.
export function shuffleByDay<T>(items: T[], seedDate: Date): T[] {
    const seed = seedDate.getFullYear() * 10000 + (seedDate.getMonth() + 1) * 100 + seedDate.getDate();
    let state = seed;
    const rand = () => {
        state = (state * 1103515245 + 12345) & 0x7fffffff;
        return state / 0x7fffffff;
    };
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

// Descuento más alto primero SIEMPRE (el % es lo que llama la atención) — el
// shuffle diario de arriba solo se aplica DENTRO de cada grupo de promos
// empatadas en el mismo discount_pct (o sin %, agrupadas al final). Así el
// top nunca deja de mostrar el mejor descuento real, pero el orden entre
// empates (muy común: muchas promos comparten % o no tienen % numérico) varía
// de un día a otro en vez de quedar fijo por el orden de la query.
export function sortByDiscountWithDailyVariation<T extends { discount_pct: number | null }>(
    items: T[],
    seedDate: Date
): T[] {
    const groups = new Map<number | null, T[]>();
    for (const item of items) {
        const bucket = groups.get(item.discount_pct);
        if (bucket) bucket.push(item);
        else groups.set(item.discount_pct, [item]);
    }

    const sortedKeys = [...groups.keys()].sort((a, b) => {
        if (a === null) return 1;
        if (b === null) return -1;
        return b - a;
    });

    return sortedKeys.flatMap((key) => shuffleByDay(groups.get(key)!, seedDate));
}
