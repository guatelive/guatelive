'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { X, MapPin, Clock, UtensilsCrossed, ShieldCheck, CalendarDays, Tag, type LucideIcon } from 'lucide-react';
import type { DbBankPromotion } from '@/lib/types';
import type { PromoPlaceLink } from '@/lib/promo-place-match';
import { parseTermsBlocks } from '@/lib/promo-terms';
import { getBankBrand } from '@/lib/bank-brand';

function headingIcon(text: string): LucideIcon {
    const t = text.toLowerCase();
    if (t.includes('horario') || t.includes('día')) return Clock;
    if (t.includes('participant') || t.includes('plato') || t.includes('producto')) return UtensilsCrossed;
    if (t.includes('condici') || t.includes('restricci') || t.includes('término')) return ShieldCheck;
    if (t.includes('vigencia') || t.includes('válido')) return CalendarDays;
    return Tag;
}

export function PromoDetailModal({
    promo,
    places,
    description,
    validUntilLabel,
    onClose,
}: {
    promo: DbBankPromotion;
    places: PromoPlaceLink[];
    description: string;
    validUntilLabel: string | null;
    onClose: () => void;
}) {
    const brand = getBankBrand(promo.bank);

    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') onClose();
        }
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [onClose]);

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-[#1A1A1A]">
                <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-[#242424]">
                    {promo.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element -- dominio del CDN de BAC no está en next.config images.remotePatterns
                        <img src={promo.image_url} alt={promo.merchant_name} className="h-full w-full object-cover" />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center px-4 text-center font-serif text-lg text-white/60">
                            {promo.merchant_name}
                        </div>
                    )}
                    <button
                        onClick={onClose}
                        aria-label="Cerrar"
                        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                    >
                        <X size={16} />
                    </button>
                    <div
                        className="absolute right-3 bottom-3 rounded-lg bg-white px-2 py-1 text-[10px] font-bold tracking-wider"
                        style={{ color: brand.accent }}
                    >
                        {brand.label}
                    </div>
                    {promo.discount_pct !== null && (
                        <div
                            className="absolute bottom-3 left-3 max-w-[80%] rounded-xl px-3 py-1.5 text-white"
                            style={{ backgroundColor: brand.accent }}
                        >
                            <span className="font-serif text-2xl font-semibold leading-none">{promo.discount_pct}%</span>
                            <span className="ml-1 text-xs font-medium">OFF</span>
                        </div>
                    )}
                </div>

                <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-5">
                    <h2 className="font-serif text-xl leading-snug text-white">{promo.merchant_name}</h2>
                    <p className="text-sm text-white/70">{description}</p>

                    {promo.terms && (
                        <div className="flex flex-col gap-2.5">
                            {parseTermsBlocks(promo.terms).map((block, i) => {
                                if (block.type === 'heading') {
                                    const Icon = headingIcon(block.text);
                                    return (
                                        <div
                                            key={i}
                                            className="mt-2 flex items-center gap-1.5 border-t border-white/10 pt-3 text-[11px] font-semibold uppercase tracking-wider text-[#E11D2E]"
                                        >
                                            <Icon size={13} />
                                            {block.text}
                                        </div>
                                    );
                                }
                                if (block.type === 'bullets') {
                                    return (
                                        <ul key={i} className="flex flex-col gap-1.5">
                                            {block.items.map((item, j) => (
                                                <li key={j} className="flex items-start gap-2 text-sm leading-relaxed text-white/70">
                                                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#E11D2E]" />
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    );
                                }
                                return (
                                    <p key={i} className="text-sm leading-relaxed text-white/70">
                                        {block.text}
                                    </p>
                                );
                            })}
                        </div>
                    )}

                    <div className="mt-2 flex flex-col gap-1.5 border-t border-white/10 pt-3">
                        {places.length === 1 ? (
                            <Link
                                href={`/lugar/${places[0].slug}`}
                                className="inline-flex items-center gap-1 text-sm font-medium text-[#E11D2E] hover:text-[#ff5f6e]"
                            >
                                <MapPin size={14} />
                                Ver en {places[0].name} · {places[0].zone} →
                            </Link>
                        ) : places.length > 1 ? (
                            <span className="inline-flex items-center gap-1 text-sm text-white/50">
                                <MapPin size={14} />
                                Válido en {places.length} sucursales
                            </span>
                        ) : null}

                        {validUntilLabel && <p className="text-xs text-white/50">Vence {validUntilLabel}</p>}

                        <a
                            href={promo.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-white/40 hover:text-white/70"
                        >
                            Ver promoción en {brand.label} →
                        </a>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
