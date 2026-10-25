'use client';

import { Analytics } from '@vercel/analytics/next';

// Vercel Web Analytics (sin cookies, no requiere banner). Las visitas al CMS (/admin)
// no se cuentan para no inflar los números con el trabajo de Fredy. Es client
// component porque `beforeSend` es una función y no se puede pasar desde el layout
// (server component).
export function SiteAnalytics() {
    return (
        <Analytics
            beforeSend={event => (new URL(event.url).pathname.startsWith('/admin') ? null : event)}
        />
    );
}
