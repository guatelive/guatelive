'use client';

import { useCallback, useRef, type WheelEvent } from 'react';

// Carruseles con auto-avance del home (EventsGrid mobile, PromosCarousel,
// ActivitiesGrid): en cuanto el usuario los mueve a mano, el auto-avance se apaga
// PARA SIEMPRE en ese carrusel. Antes se pausaba y retomaba, y el siguiente tick
// partía de un índice viejo (o del "volver al inicio" al llegar al final) y le
// arrancaba el carrusel de las manos mientras deslizaba — feedback de beta 2026-10-19.
//
// Solo cuentan gestos reales (touch, pointer, wheel horizontal): el scrollTo
// programático del propio auto-avance no dispara ninguno de esos eventos, así que
// nunca se confunde con una interacción del usuario.
export function useCarouselTakeover(onTakeover: () => void) {
    const tookControlRef = useRef(false);

    const takeControl = useCallback(() => {
        if (tookControlRef.current) return;
        tookControlRef.current = true;
        onTakeover();
    }, [onTakeover]);

    const onWheel = useCallback((e: WheelEvent<HTMLElement>) => {
        // Solo scroll horizontal — la rueda vertical sobre el carrusel es el usuario
        // bajando por la página, no tomando el control del carrusel.
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) takeControl();
    }, [takeControl]);

    return {
        tookControlRef,
        takeControl,
        takeoverHandlers: { onTouchStart: takeControl, onPointerDown: takeControl, onWheel },
    };
}

// Índice del hijo más cercano al borde izquierdo del contenedor — para que los
// puntos/contador sigan la carta real después de un swipe manual. Relativo al primer
// hijo: el contenedor no siempre es offsetParent de las cartas.
export function nearestChildIndex(container: HTMLElement): number {
    const children = Array.from(container.children) as HTMLElement[];
    const first = children[0];
    if (!first) return 0;
    let best = 0;
    let bestDist = Infinity;
    children.forEach((child, i) => {
        const dist = Math.abs(child.offsetLeft - first.offsetLeft - container.scrollLeft);
        if (dist < bestDist) { bestDist = dist; best = i; }
    });
    return best;
}
