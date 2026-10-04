'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

// El footer público vive en app/layout.tsx, pero el CMS (/admin) y /login tienen su
// propio chrome — ahí no se muestra. Client Component solo para leer el pathname; el
// Footer (Server Component) llega ya renderizado como children.
const HIDDEN_PREFIXES = ['/admin', '/login'];

export function FooterGate({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    if (HIDDEN_PREFIXES.some(p => pathname === p || pathname.startsWith(`${p}/`))) return null;
    return <>{children}</>;
}
