'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';

// Borrar en el admin es definitivo (DELETE en DB + imagen en Storage + cascade en
// plan_items), así que pide un segundo click en línea antes de enviar el form.
// Va dentro de un <form action={serverAction}>.
export function ConfirmDeleteButton() {
    const [confirming, setConfirming] = useState(false);
    const { pending } = useFormStatus();

    if (pending) {
        return <span className="text-[#999999]">Borrando…</span>;
    }

    if (!confirming) {
        return (
            <button type="button" onClick={() => setConfirming(true)} className="text-[#E11D2E] hover:underline">
                Borrar
            </button>
        );
    }

    return (
        <span className="inline-flex items-center gap-2">
            <span className="text-xs text-[#666666]">¿Seguro? No se puede deshacer.</span>
            <button type="submit" className="font-semibold text-[#E11D2E] hover:underline">
                Sí, borrar
            </button>
            <button type="button" onClick={() => setConfirming(false)} className="text-[#666666] hover:underline">
                Cancelar
            </button>
        </span>
    );
}
