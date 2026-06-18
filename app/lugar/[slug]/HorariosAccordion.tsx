'use client';

import { useState } from 'react';
import { Clock, ChevronDown } from 'lucide-react';

type HoursRecord = Record<string, string>;

const DAY_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const DAY_LABELS: Record<string, string> = {
    lunes: 'Lunes', martes: 'Martes', miércoles: 'Miércoles',
    jueves: 'Jueves', viernes: 'Viernes', sábado: 'Sábado', domingo: 'Domingo',
};
const DAY_ABBR: Record<string, string> = {
    lunes: 'Lun', martes: 'Mar', miércoles: 'Mié',
    jueves: 'Jue', viernes: 'Vie', sábado: 'Sáb', domingo: 'Dom',
};

export function HorariosAccordion({ hours, todayName, compact = false, defaultOpen = false }: { hours: HoursRecord | null; todayName: string; compact?: boolean; defaultOpen?: boolean }) {
    const [open, setOpen] = useState(defaultOpen);

    if (!hours || Object.keys(hours).length === 0) return null;

    return (
        <div className="border border-[#E5E5E5] rounded-xl">
            <button
                type="button"
                onClick={() => setOpen((p) => !p)}
                className="w-full flex items-center justify-between px-5 py-4 text-left"
            >
                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#E11D2E]" />
                    <span className="text-sm font-semibold text-[#0A0A0A]">Horarios</span>
                </div>
                <ChevronDown
                    className="w-4 h-4 text-[#666666] transition-transform duration-200"
                    style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
            </button>

            <div
                style={{
                    maxHeight: open ? '400px' : '0',
                    overflow: 'hidden',
                    transition: 'max-height 0.3s ease-in-out',
                }}
            >
            <div className="px-5 pb-8">
                <ul className="space-y-1.5">
                    {DAY_NAMES.map((day) => {
                        if (!hours[day]) return null;
                        const isToday = day === todayName;
                        return (
                            <li
                                key={day}
                                className={`flex justify-between gap-1 ${compact ? 'text-[10px]' : 'text-xs'} ${isToday ? 'font-semibold text-[#0A0A0A]' : 'text-[#666666]'}`}
                            >
                                <span className={`flex-shrink-0 ${isToday ? 'text-[#E11D2E]' : ''}`}>
                                    {compact ? DAY_ABBR[day] : DAY_LABELS[day]}
                                </span>
                                <span className="text-right">{hours[day]}</span>
                            </li>
                        );
                    })}
                </ul>
            </div>
            </div>
        </div>
    );
}
