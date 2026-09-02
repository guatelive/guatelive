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
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, color: '#111111' }}>
                Ya somos parte de <span style={{ color: '#E11D2E', fontWeight: 800 }}>…</span> planes en Guate
            </p>
        );
    }

    // Error o tabla no creada aún
    if (count === false || count === 0) return null;

    return (
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, color: '#111111' }}>
            Ya somos parte de <span style={{ color: '#E11D2E', fontWeight: 800 }}>{count.toLocaleString('es-GT')}</span> planes en Guate
        </p>
    );
}
