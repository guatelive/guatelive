'use client';

import { useState } from "react";
import Link from "next/link";
import { MapPin } from "lucide-react";
import type { DbBankPromotion } from "@/lib/types";
import type { PromoPlaceLink } from "@/lib/promo-place-match";
import { promoDescription } from "@/lib/promo-title";
import { PromoDetailModal } from "@/components/cards/promo-detail-modal";
import { getBankBrand } from "@/lib/bank-brand";

export function PromoCard({ promo, places = [] }: { promo: DbBankPromotion; places?: PromoPlaceLink[] }) {
  const [detailOpen, setDetailOpen] = useState(false);
  const brand = getBankBrand(promo.bank);
  const validUntilLabel = promo.valid_until
    ? new Date(promo.valid_until).toLocaleDateString("es-GT", { day: "numeric", month: "short" })
    : null;
  const singlePlace = places.length === 1 ? places[0] : null;
  const description = promoDescription(promo.title);

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-xl bg-[#1A1A1A] transition-transform hover:-translate-y-0.5">
      <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-[#242424]">
        <div className="absolute inset-x-0 top-0 z-10 h-1 bg-[#E11D2E]" />
        {promo.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- dominio del CDN de BAC no está en next.config images.remotePatterns, mismo criterio que edition.cover_image_url en app/edicion/page.tsx
          <img
            src={promo.image_url}
            alt={promo.merchant_name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center px-4 text-center font-serif text-lg text-white/60">
            {promo.merchant_name}
          </div>
        )}
        <div
          className="absolute right-3 top-3 rounded-lg bg-white px-2 py-1 text-[10px] font-bold tracking-wider"
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
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="font-serif text-lg leading-snug text-white">{promo.merchant_name}</h3>
        <p className="text-sm text-white/70">{description}</p>
        {promo.terms && (
          <>
            <p className="line-clamp-4 whitespace-pre-line text-xs text-white/50">{promo.terms}</p>
            <button
              onClick={() => setDetailOpen(true)}
              className="w-fit text-xs font-medium text-[#E11D2E] hover:text-[#ff5f6e]"
            >
              Leer más →
            </button>
          </>
        )}

        <div className="mt-auto flex flex-col gap-1.5 pt-2">
          {singlePlace ? (
            <Link
              href={`/lugar/${singlePlace.slug}`}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#E11D2E] hover:text-[#ff5f6e]"
            >
              <MapPin size={12} />
              Ver en {singlePlace.name} · {singlePlace.zone} →
            </Link>
          ) : places.length > 1 ? (
            <span className="inline-flex items-center gap-1 text-xs text-white/50">
              <MapPin size={12} />
              Válido en {places.length} sucursales
            </span>
          ) : null}

          {validUntilLabel && (
            <p className="text-xs text-white/50">Vence {validUntilLabel}</p>
          )}
        </div>
      </div>

      {detailOpen && (
        <PromoDetailModal
          promo={promo}
          places={places}
          description={description}
          validUntilLabel={validUntilLabel}
          onClose={() => setDetailOpen(false)}
        />
      )}
    </div>
  );
}
