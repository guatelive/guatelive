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
