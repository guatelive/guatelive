'use client';

import { useState } from 'react';
import { PromoDetailModal } from '@/components/cards/promo-detail-modal';
import { promoDescription } from '@/lib/promo-title';
import { getBankBrand } from '@/lib/bank-brand';
import type { DbBankPromotion } from '@/lib/types';

export function PromoBadge({ promo }: { promo: DbBankPromotion }) {
    const [open, setOpen] = useState(false);
    const brand = getBankBrand(promo.bank);
    const description = promoDescription(promo.title);
    const validUntilLabel = promo.valid_until
        ? new Date(promo.valid_until).toLocaleDateString('es-GT', { day: 'numeric', month: 'short' })
        : null;

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="group mb-4 inline-flex w-full max-w-full items-stretch gap-3 overflow-hidden rounded-xl bg-[#1A1A1A] text-left transition-transform hover:-translate-y-0.5 sm:w-auto sm:max-w-sm"
            >
                <div className="relative h-auto w-20 shrink-0 overflow-hidden bg-[#242424] sm:w-24">
                    {promo.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element -- dominio del CDN de BAC no está en next.config images.remotePatterns
                        <img
                            src={promo.image_url}
                            alt={promo.merchant_name}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-center text-[10px] text-white/40">
                            {brand.label}
                        </div>
                    )}
                </div>

                <div className="flex flex-1 flex-col justify-center gap-0.5 py-2.5 pr-4">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: brand.accent }}>
                            {brand.label}
                        </span>
                        {promo.discount_pct !== null && (
                            <span className="text-xs font-semibold text-white">{promo.discount_pct}% OFF</span>
                        )}
                    </div>
                    <p className="text-sm font-medium text-white">{description}</p>
                    <div className="flex items-center gap-2">
                        {validUntilLabel && (
                            <span className="text-xs text-white/40">Vence {validUntilLabel}</span>
                        )}
                        <span className="text-xs font-medium text-[#E11D2E] group-hover:text-[#ff5f6e]">
                            Ver detalle →
                        </span>
                    </div>
                </div>
            </button>

            {open && (
                <PromoDetailModal
                    promo={promo}
                    places={[]}
                    description={description}
                    validUntilLabel={validUntilLabel}
                    onClose={() => setOpen(false)}
                />
            )}
        </>
    );
}
