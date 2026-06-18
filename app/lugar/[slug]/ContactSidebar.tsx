'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MapPin, Phone, Globe, MessageCircle, ChevronDown } from 'lucide-react';

type Props = {
    address: string | null;
    phone: string | null;
    googleMapsUrl: string | null;
    whatsappUrl: string | null;
    website: string | null;
    compact?: boolean; // mobile side-by-side: botones en 1 col
};

export function ContactSidebar({ address, phone, googleMapsUrl, whatsappUrl, website, compact = false, defaultOpen = false }: Props & { defaultOpen?: boolean }) {
    const [open, setOpen] = useState(defaultOpen);

    const hasContent = address || phone || googleMapsUrl || whatsappUrl;
    if (!hasContent) return null;

    const btnClass = 'flex flex-col items-center justify-center gap-1.5 bg-[#FAFAFA] hover:bg-[#F0F0F0] rounded-xl py-3 px-2 transition-colors';

    return (
        <div className="border border-[#E5E5E5] rounded-xl bg-white">
            <button
                type="button"
                onClick={() => setOpen((p) => !p)}
                className="w-full flex items-center justify-between px-5 py-4 text-left"
            >
                <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[#E11D2E]" />
                    <span className="text-sm font-semibold text-[#0A0A0A]">Contacto</span>
                </div>
                <ChevronDown
                    className="w-4 h-4 text-[#666666] transition-transform duration-200"
                    style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
            </button>

            <div
                style={{
                    maxHeight: open ? '500px' : '0',
                    overflow: 'hidden',
                    transition: 'max-height 0.3s ease-in-out',
                }}
            >
                <div className="px-5 pb-8">
                    <div className="space-y-3 mb-4">
                        {!compact && address && (
                            <div className="flex items-start gap-2.5">
                                <MapPin className="w-4 h-4 text-[#666666] flex-shrink-0 mt-0.5" />
                                <span className="text-sm text-[#333333] leading-snug">{address}</span>
                            </div>
                        )}
                        {phone && (
                            <div className="flex items-center gap-2.5">
                                <Phone className="w-4 h-4 text-[#666666] flex-shrink-0" />
                                <a
                                    href={`tel:${phone}`}
                                    className="text-sm text-[#333333] hover:text-[#0A0A0A] transition-colors"
                                >
                                    {phone}
                                </a>
                            </div>
                        )}
                    </div>

                    <div className={`grid gap-2 ${compact ? 'grid-cols-1' : 'grid-cols-2'}`}>
                        {phone && (
                            <a href={`tel:${phone}`} className={btnClass}>
                                <Phone className="w-5 h-5 text-[#0A0A0A]" />
                                <span className="text-xs font-medium text-[#333333]">Llamar</span>
                            </a>
                        )}
                        {whatsappUrl && (
                            <Link href={whatsappUrl} target="_blank" rel="noopener noreferrer" className={btnClass}>
                                <MessageCircle className="w-5 h-5 text-[#0A0A0A]" />
                                <span className="text-xs font-medium text-[#333333]">WhatsApp</span>
                            </Link>
                        )}
                        {googleMapsUrl && (
                            <Link href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className={btnClass}>
                                <MapPin className="w-5 h-5 text-[#0A0A0A]" />
                                <span className="text-xs font-medium text-[#333333]">Cómo llegar</span>
                            </Link>
                        )}
                        {website && (
                            <Link href={website} target="_blank" rel="noopener noreferrer" className={btnClass}>
                                <Globe className="w-5 h-5 text-[#0A0A0A]" />
                                <span className="text-xs font-medium text-[#333333]">Sitio web</span>
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
