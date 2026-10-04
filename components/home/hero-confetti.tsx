import type { CSSProperties } from 'react';

// Confeti del hero mobile (diseño "M · Confeti lento difuminado"): cae lento, gira
// despacio y tiene profundidad de campo — las piezas grandes ("cerca") más borrosas,
// las chicas ("lejos") más nítidas. Valores fijos (no Math.random) para que el SSR y
// la hidratación coincidan. Estilos y keyframes en globals.css (.hero-confetti).

// Paleta "marca": rojo, blanco, dorado, gris.
const COLORS = ['#E11D2E', '#FFFFFF', '#E8B64C', '#8A8A8A'] as const;

interface ConfettiPiece {
    left: number;
    w: number;
    h: number;
    round: boolean;
    blur: number;
    opacity: number;
    fall: number;
    delay: number;
    dx: number;
    color: number;
    spin: number;
}

const PIECES: ConfettiPiece[] = [
    { left: 45.2, w: 7, h: 7, round: true, blur: 1.4, opacity: 0.62, fall: 23.3, delay: 4.9, dx: -10, color: 0, spin: 5.7 },
    { left: 53.2, w: 4, h: 15, round: false, blur: 1.7, opacity: 0.58, fall: 22.0, delay: 13.2, dx: 20, color: 1, spin: 6.4 },
    { left: 26.9, w: 7, h: 11, round: false, blur: 1.4, opacity: 0.61, fall: 23.0, delay: 14.1, dx: -20, color: 2, spin: 7.9 },
    { left: 63.0, w: 10, h: 15, round: false, blur: 3.0, opacity: 0.45, fall: 17.5, delay: 11.2, dx: -20, color: 3, spin: 8.1 },
    { left: 88.0, w: 7, h: 7, round: true, blur: 1.2, opacity: 0.64, fall: 23.9, delay: 17.7, dx: 20, color: 0, spin: 5.1 },
    { left: 69.4, w: 4, h: 14, round: false, blur: 1.4, opacity: 0.62, fall: 23.1, delay: 23.4, dx: -20, color: 1, spin: 5.5 },
    { left: 5.5, w: 11, h: 17, round: false, blur: 3.7, opacity: 0.38, fall: 15.0, delay: 0.2, dx: 10, color: 2, spin: 8.8 },
    { left: 17.2, w: 10, h: 16, round: false, blur: 3.3, opacity: 0.42, fall: 16.3, delay: 17.5, dx: -20, color: 3, spin: 6.8 },
    { left: 64.4, w: 6, h: 9, round: false, blur: 0.6, opacity: 0.70, fall: 25.9, delay: 20.1, dx: -10, color: 0, spin: 6.7 },
    { left: 77.8, w: 11, h: 17, round: false, blur: 3.8, opacity: 0.37, fall: 14.7, delay: 25.3, dx: -20, color: 1, spin: 8.7 },
    { left: 18.0, w: 8, h: 13, round: false, blur: 2.3, opacity: 0.53, fall: 20.1, delay: 15.7, dx: -20, color: 2, spin: 5.3 },
    { left: 52.6, w: 6, h: 19, round: false, blur: 3.1, opacity: 0.45, fall: 17.3, delay: 12.5, dx: 20, color: 3, spin: 5.3 },
    { left: -2.6, w: 9, h: 14, round: false, blur: 2.6, opacity: 0.49, fall: 19.0, delay: 0.2, dx: -10, color: 0, spin: 5.4 },
    { left: 74.7, w: 10, h: 10, round: true, blur: 3.2, opacity: 0.43, fall: 16.8, delay: 19.9, dx: -10, color: 1, spin: 8.4 },
    { left: 63.2, w: 6, h: 6, round: true, blur: 0.7, opacity: 0.69, fall: 25.5, delay: 14.9, dx: -10, color: 2, spin: 6.6 },
    { left: 53.7, w: 8, h: 13, round: false, blur: 2.3, opacity: 0.52, fall: 20.0, delay: 18.8, dx: 10, color: 3, spin: 7.5 },
    { left: 81.5, w: 7, h: 7, round: true, blur: 1.5, opacity: 0.61, fall: 22.7, delay: 25.7, dx: -10, color: 0, spin: 6.9 },
    { left: 32.8, w: 6, h: 6, round: true, blur: 0.7, opacity: 0.69, fall: 25.5, delay: 2.1, dx: -10, color: 1, spin: 8.5 },
    { left: 92.5, w: 4, h: 14, round: false, blur: 1.6, opacity: 0.60, fall: 22.5, delay: 20.5, dx: -20, color: 2, spin: 6.0 },
    { left: 88.6, w: 7, h: 11, round: false, blur: 1.3, opacity: 0.63, fall: 23.6, delay: 20.8, dx: 10, color: 3, spin: 7.8 },
    { left: 84.2, w: 8, h: 13, round: false, blur: 2.2, opacity: 0.54, fall: 20.4, delay: 14.6, dx: 20, color: 0, spin: 6.1 },
    { left: 36.5, w: 7, h: 12, round: false, blur: 1.7, opacity: 0.59, fall: 22.2, delay: 4.9, dx: 10, color: 1, spin: 5.9 },
    { left: 30.8, w: 6, h: 6, round: true, blur: 0.9, opacity: 0.66, fall: 24.8, delay: 17.8, dx: 20, color: 2, spin: 5.5 },
    { left: -2.9, w: 9, h: 9, round: true, blur: 3.0, opacity: 0.46, fall: 17.7, delay: 3.4, dx: -10, color: 3, spin: 5.1 },
    { left: 14.3, w: 7, h: 7, round: true, blur: 1.6, opacity: 0.59, fall: 22.3, delay: 5.5, dx: 20, color: 0, spin: 7.8 },
    { left: 59.7, w: 10, h: 16, round: false, blur: 3.4, opacity: 0.41, fall: 16.1, delay: 0.4, dx: 20, color: 1, spin: 7.4 },
    { left: 30.1, w: 7, h: 11, round: false, blur: 1.4, opacity: 0.61, fall: 23.0, delay: 18.6, dx: 20, color: 2, spin: 7.2 },
    { left: 67.2, w: 8, h: 8, round: true, blur: 2.0, opacity: 0.56, fall: 21.1, delay: 19.1, dx: 10, color: 3, spin: 5.4 },
    { left: 19.5, w: 6, h: 22, round: false, blur: 3.8, opacity: 0.37, fall: 14.5, delay: 15.1, dx: -10, color: 0, spin: 5.9 },
    { left: 78.3, w: 4, h: 15, round: false, blur: 1.9, opacity: 0.57, fall: 21.4, delay: 6.2, dx: 20, color: 1, spin: 5.2 },
];

export function HeroConfetti() {
    return (
        <div className="hero-confetti-layer md:hidden" aria-hidden="true">
            {PIECES.map((p, i) => (
                <span
                    key={i}
                    className="hero-confetti-piece"
                    style={{
                        left: `${p.left}%`,
                        width: p.w,
                        height: p.h,
                        borderRadius: p.round ? '50%' : 1,
                        filter: `blur(${p.blur}px)`,
                        opacity: p.opacity,
                        animationDuration: `${p.fall}s`,
                        animationDelay: `-${p.delay}s`,
                        '--dx': `${p.dx}px`,
                    } as CSSProperties}
                >
                    <i style={{ background: COLORS[p.color], animationDuration: `${p.spin}s` }} />
                </span>
            ))}
        </div>
    );
}
