'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MapPin, Phone, Globe, Clock, MessageCircle, ChevronDown } from 'lucide-react';

type HoursRecord = Record<string, string>;

const DAY_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const DAY_LABELS: Record<string, string> = {
    lunes: 'Lunes', martes: 'Martes', miércoles: 'Miércoles',
    jueves: 'Jueves', viernes: 'Viernes', sábado: 'Sábado', domingo: 'Domingo',
};

type Props = {
    hours: HoursRecord | null;
    todayName: string;
    phone: string | null;
    website: string | null;
    address: string | null;
    googleMapsUrl: string | null;
    whatsappUrl: string | null;
    noCard?: boolean; // desktop: renderiza contenido inline sin wrapper ni toggle
};

function InfoContent({
    hours, todayName, phone, website, address, googleMapsUrl, whatsappUrl,
}: Omit<Props, 'noCard'>) {
    return (
        <div className="space-y-5">

            {/* HORARIOS */}
            {hours && Object.keys(hours).length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <Clock className="w-4 h-4 text-[#E11D2E]" />
                        <span className="text-sm font-semibold text-[#0A0A0A]">Horarios</span>
                    </div>
                    <ul className="space-y-1.5">
                        {DAY_NAMES.map((day) => {
                            if (!hours[day]) return null;
                            const isToday = day === todayName;
                            return (
                                <li
                                    key={day}
                                    className={`flex justify-between text-xs ${
                                        isToday ? 'font-semibold text-[#0A0A0A]' : 'text-[#666666]'
                                    }`}
                                >
                                    <span className={isToday ? 'text-[#E11D2E]' : ''}>
                                        {DAY_LABELS[day]}
                                    </span>
                                    <span>{hours[day]}</span>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}

            {/* TELÉFONO */}
            {phone && (
                <div className="flex items-start gap-3">
                    <Phone className="w-4 h-4 text-[#E11D2E] flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-xs font-semibold text-[#0A0A0A] mb-0.5">Teléfono</p>
                        <a
                            href={`tel:${phone}`}
                            className="text-sm text-[#666666] hover:text-[#0A0A0A] transition-colors"
                        >
                            {phone}
                        </a>
                    </div>
                </div>
            )}

            {/* SITIO WEB */}
            {website && (
                <div className="flex items-start gap-3">
                    <Globe className="w-4 h-4 text-[#E11D2E] flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-xs font-semibold text-[#0A0A0A] mb-0.5">Sitio web</p>
                        <Link
                            href={website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-[#666666] hover:text-[#0A0A0A] underline underline-offset-2 transition-colors break-all"
                        >
                            Visitar →
                        </Link>
                    </div>
                </div>
            )}

            {/* DIRECCIÓN */}
            {address && (
                <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-[#E11D2E] flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-xs font-semibold text-[#0A0A0A] mb-0.5">Dirección</p>
                        <p className="text-sm text-[#666666]">{address}</p>
                    </div>
                </div>
            )}

            {/* CTAs */}
            {(googleMapsUrl || whatsappUrl) && (
                <div className="space-y-2 pt-1">
                    {googleMapsUrl && (
                        <Link
                            href={googleMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full bg-[#0A0A0A] text-white py-3 px-4 rounded-xl font-medium text-sm hover:bg-[#1A1A1A] transition-colors"
                        >
                            <MapPin className="w-4 h-4 opacity-70" />
                            Ver en Google Maps →
                        </Link>
                    )}
                    {whatsappUrl && (
                        <Link
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full bg-[#25D366] text-white py-3 px-4 rounded-xl font-medium text-sm hover:bg-[#1EB657] transition-colors"
                        >
                            <MessageCircle className="w-4 h-4" />
                            WhatsApp
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
}

export function InfoAccordion({
    hours, todayName, phone, website, address, googleMapsUrl, whatsappUrl, noCard = false,
}: Props) {
    const [open, setOpen] = useState(false);

    const hasContent =
        (hours && Object.keys(hours).length > 0) ||
        phone || website || address || googleMapsUrl || whatsappUrl;

    if (!hasContent) return null;

    const sharedProps = { hours, todayName, phone, website, address, googleMapsUrl, whatsappUrl };

    // Desktop inline — sin borde ni toggle
    if (noCard) {
        return <InfoContent {...sharedProps} />;
    }

    // Mobile — card con accordion
    return (
        <div className="border border-[#E5E5E5] rounded-xl">
            <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                className="w-full flex items-center justify-between px-5 py-4 text-left"
            >
                <span className="text-sm font-semibold text-[#0A0A0A]">Info del lugar</span>
                <ChevronDown
                    className="w-4 h-4 text-[#666666] transition-transform duration-200"
                    style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
            </button>

            <div className={`${open ? 'block' : 'hidden'} px-5 pb-5`}>
                <InfoContent {...sharedProps} />
            </div>
        </div>
    );
}
