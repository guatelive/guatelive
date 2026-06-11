'use client';

import { useState } from 'react';

type Props = {
    author: string;
    rating: number;
    text: string;
    relativeTime?: string;
};

function abbreviateName(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0];
    return `${parts[0]} ${parts[1].charAt(0)}.`;
}

export function ReviewCard({ author, rating, text, relativeTime }: Props) {
    const [expanded, setExpanded] = useState(false);
    const isLong = text.length > 140;
    const initial = author.trim().charAt(0).toUpperCase();
    const displayName = abbreviateName(author);

    return (
        <div className="border border-[#E5E5E5] rounded-xl p-4 bg-white">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div
                        className="flex items-center justify-center flex-shrink-0"
                        style={{ width: '40px', height: '26px', borderRadius: '8px', backgroundColor: '#0A0A0A' }}
                    >
                        <span className="text-white text-sm font-bold leading-none">{initial}</span>
                    </div>
                    <span className="text-sm font-medium text-[#0A0A0A] truncate max-w-[140px]">
                        {displayName}
                    </span>
                </div>
                <span className="text-xs text-[#E11D2E] flex-shrink-0 ml-2">
                    {'★'.repeat(Math.min(rating, 5))}
                </span>
            </div>

            <p className={`text-xs text-[#666666] leading-relaxed overflow-hidden ${expanded ? '' : 'line-clamp-3'}`}>
                {text}
            </p>

            {isLong && (
                <button
                    type="button"
                    onClick={() => setExpanded((s) => !s)}
                    className="mt-1.5 text-xs text-[#E11D2E] hover:underline underline-offset-2 transition-colors"
                >
                    {expanded ? 'Leer menos ↑' : 'Leer más →'}
                </button>
            )}

            {relativeTime && (
                <p className="mt-3 text-xs text-[#999999]">{relativeTime}</p>
            )}
        </div>
    );
}
