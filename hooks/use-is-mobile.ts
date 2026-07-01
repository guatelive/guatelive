'use client';

import { useSyncExternalStore } from 'react';

// 640px — mismo breakpoint que ya usa EventsCarousel (window.innerWidth < 640) y los
// botones de flecha de EventExplorer (sm:flex en Tailwind).
function subscribe(breakpoint: number, callback: () => void) {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    mql.addEventListener('change', callback);
    return () => mql.removeEventListener('change', callback);
}

function getSnapshot(breakpoint: number) {
    return window.matchMedia(`(max-width: ${breakpoint - 1}px)`).matches;
}

function getServerSnapshot() {
    return false;
}

export function useIsMobile(breakpoint = 640): boolean {
    return useSyncExternalStore(
        callback => subscribe(breakpoint, callback),
        () => getSnapshot(breakpoint),
        getServerSnapshot
    );
}
