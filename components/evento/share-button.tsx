'use client';

import { useState } from 'react';
import { Share2, Check } from 'lucide-react';

export function ShareButton({ url, title }: { url: string; title: string }) {
    const [copied, setCopied] = useState(false);

    async function handleShare() {
        if (navigator.share) {
            try {
                await navigator.share({ title, url });
            } catch {
                // Usuario cerró el share sheet — no hacer nada.
            }
            return;
        }
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-2 rounded-md border border-[#E5E5E5] px-4 py-2 text-sm text-[#0A0A0A] hover:bg-[#FAFAFA]"
        >
            {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
            {copied ? 'Copiado' : 'Copiar link'}
        </button>
    );
}
