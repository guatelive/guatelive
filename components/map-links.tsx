import { Navigation } from 'lucide-react';
import type { MapLinks as MapLinksData } from '@/lib/maps-links';

const LINK_CLASS = 'inline-flex items-center gap-1 rounded-full border border-[#E5E5E5] bg-white px-2.5 py-1 text-xs font-medium text-[#0A0A0A] hover:border-[#0A0A0A]';

export function MapLinks({ links }: { links: MapLinksData | null }) {
    if (!links) return null;
    return (
        <span className="mt-2 flex flex-wrap gap-2">
            <a href={links.google} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
                <Navigation className="h-3 w-3" /> Google Maps
            </a>
            <a href={links.waze} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
                <Navigation className="h-3 w-3" /> Waze
            </a>
        </span>
    );
}
