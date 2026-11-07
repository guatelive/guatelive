'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

// Sin este boundary, un error en una Server Action del admin (ej. un 413 de Vercel por
// fotos muy pesadas) reemplaza todo el sitio por la pantalla genérica de Next.
export default function AdminError({
    error,
    unstable_retry,
}: {
    error: Error & { digest?: string };
    unstable_retry: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="max-w-xl rounded-lg border border-[#E5E5E5] bg-white p-6">
            <h1 className="mb-2 font-serif text-xl text-[#0A0A0A]">No se pudo completar la acción</h1>
            <p className="mb-4 text-sm text-[#666666]">
                Los cambios que estabas haciendo no se guardaron. Si estabas subiendo fotos, probá
                con menos a la vez.
            </p>
            <Button onClick={() => unstable_retry()} className="normal-case tracking-normal">
                Volver a intentar
            </Button>
        </div>
    );
}
