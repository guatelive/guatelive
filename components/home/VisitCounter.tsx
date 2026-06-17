'use client';

import { useEffect, useState } from 'react';

export function VisitCounter() {
    const [count, setCount] = useState<number | null | false>(null); // null=cargando, false=error

    useEffect(() => {
        fetch('/api/stats')
            .then((r) => r.json())
            .then((d) => setCount(d.total_visits ?? false))
            .catch(() => setCount(false));
    }, []);

    // Cargando
    if (count === null) {
        return (
            <p className="text-sm text-muted-foreground">
                Ya somos parte de <span className="font-semibold text-foreground">…</span> planes en Guate
            </p>
        );
    }

    // Error o tabla no creada aún
    if (count === false || count === 0) return null;

    return (
        <p className="text-sm text-muted-foreground">
            Ya somos parte de{' '}
            <span className="font-semibold text-foreground">
                {count.toLocaleString('es-GT')}
            </span>{' '}
            planes en Guate
        </p>
    );
}
