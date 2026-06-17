'use client';

import { useState, useEffect } from 'react';

type Photo = { url: string; is_primary: boolean; order_index: number };

const DESKTOP_H = 400;
const MOBILE_H  = 320;
const AUTO_MS   = 3500;

export default function GalleryClient({ photos }: { photos: Photo[] }) {
    const [mobileActive,  setMobileActive]  = useState(0);
    const [desktopActive, setDesktopActive] = useState(0);

    // Auto-avance mobile con crossfade
    useEffect(() => {
        if (photos.length <= 1) return;
        const t = setInterval(() => setMobileActive((i) => (i + 1) % photos.length), AUTO_MS);
        return () => clearInterval(t);
    }, [photos.length]);

    if (!photos || photos.length === 0) return null;

    const n         = photos.length;
    const dotsCount = Math.min(n, 8);

    // Desktop: 3 fotos circulares a partir de desktopActive
    const big    = photos[desktopActive % n];
    const top    = photos[(desktopActive + 1) % n];
    const bottom = n >= 3 ? photos[(desktopActive + 2) % n] : null;
    const remaining = n > 3 ? n - 3 : 0;

    const advanceDesktop = (steps: number) =>
        setDesktopActive((desktopActive + steps) % n);

    return (
        <>
            {/* ── MOBILE: full-bleed crossfade carousel ── */}
            <div
                className="md:hidden"
                style={{
                    position: 'relative',
                    left: '50%',
                    marginLeft: '-50vw',
                    width: '100vw',
                    height: `${MOBILE_H}px`,
                    marginBottom: '24px',
                    overflow: 'hidden',
                    background: '#F0F0F0',
                }}
            >
                {photos.map((photo, i) => (
                    <img
                        key={`${i}-${photo.url}`}
                        src={photo.url}
                        alt={i === 0 ? 'Foto principal del lugar' : 'Foto del lugar'}
                        style={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            opacity: i === mobileActive ? 1 : 0,
                            transition: 'opacity 300ms ease-in-out',
                        }}
                        fetchPriority={i === 0 ? 'high' : 'low'}
                    />
                ))}
                {n > 1 && (
                    <div style={{ position: 'absolute', bottom: '14px', left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px', zIndex: 1 }}>
                        {Array.from({ length: dotsCount }).map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setMobileActive(i)}
                                style={{
                                    width: i === mobileActive ? '18px' : '6px',
                                    height: '6px',
                                    borderRadius: '3px',
                                    background: i === mobileActive ? '#fff' : 'rgba(255,255,255,0.5)',
                                    border: 'none',
                                    padding: 0,
                                    cursor: 'pointer',
                                    transition: 'width 0.25s ease, background 0.25s ease',
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* ── DESKTOP: 1 foto ── */}
            {n === 1 && (
                <div className="hidden md:block" style={{ height: `${DESKTOP_H}px`, borderRadius: '16px', overflow: 'hidden', marginBottom: '32px', background: '#F0F0F0' }}>
                    <img src={big.url} alt="Foto del lugar"
                        style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
                        fetchPriority="high"
                    />
                </div>
            )}

            {/* ── DESKTOP: 2 fotos ── */}
            {n === 2 && (
                <div className="hidden md:block" style={{ marginBottom: '32px' }}>
                    <div style={{ display: 'flex', flexDirection: 'row', gap: '8px', height: `${DESKTOP_H}px` }}>
                        <div style={{ flex: '0 0 60%', borderRadius: '16px', overflow: 'hidden', background: '#F0F0F0', position: 'relative' }}>
                            {photos.slice(0, 2).map((photo, i) => (
                                <img key={`${i}-${photo.url}`} src={i === 0 ? big.url : top.url} alt="Foto del lugar"
                                    style={{
                                        position: 'absolute', inset: 0,
                                        display: 'block', width: '100%', height: '100%', objectFit: 'cover',
                                        opacity: i === 0 ? 1 : 0,
                                        transition: 'opacity 300ms ease-in-out',
                                    }}
                                    fetchPriority={i === 0 ? 'high' : 'low'}
                                />
                            ))}
                        </div>
                        <div
                            onClick={() => advanceDesktop(1)}
                            style={{ flex: '1 1 0', borderRadius: '16px', overflow: 'hidden', cursor: 'pointer', background: '#F0F0F0' }}
                        >
                            <img src={top.url} alt=""
                                style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                    </div>
                </div>
            )}

            {/* ── DESKTOP: 3+ fotos ── */}
            {n >= 3 && (
                <div className="hidden md:block" style={{ marginBottom: '32px' }}>
                    <div style={{ display: 'flex', flexDirection: 'row', gap: '8px', height: `${DESKTOP_H}px` }}>
                        {/* Foto grande con crossfade */}
                        <div style={{ flex: '0 0 60%', borderRadius: '16px', overflow: 'hidden', position: 'relative', background: '#F0F0F0' }}>
                            {photos.map((photo, i) => (
                                <img
                                    key={`${i}-${photo.url}`}
                                    src={photo.url}
                                    alt={i === 0 ? 'Foto principal del lugar' : ''}
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        display: 'block',
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        opacity: i === desktopActive ? 1 : 0,
                                        transition: 'opacity 300ms ease-in-out',
                                    }}
                                    fetchPriority={i === 0 ? 'high' : 'low'}
                                />
                            ))}
                        </div>
                        {/* Apiladas clickeables */}
                        <div style={{ flex: '1 1 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div
                                onClick={() => advanceDesktop(1)}
                                style={{ flex: 1, borderRadius: '16px', overflow: 'hidden', cursor: 'pointer', background: '#F0F0F0' }}
                            >
                                <img src={top.url} alt=""
                                    style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.2s' }}
                                    onMouseEnter={(e) => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.03)'; }}
                                    onMouseLeave={(e) => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)'; }}
                                />
                            </div>
                            <div
                                onClick={() => advanceDesktop(2)}
                                style={{ flex: 1, borderRadius: '16px', overflow: 'hidden', position: 'relative', cursor: 'pointer', background: '#F0F0F0' }}
                            >
                                <img src={bottom!.url} alt=""
                                    style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.2s' }}
                                    onMouseEnter={(e) => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.03)'; }}
                                    onMouseLeave={(e) => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)'; }}
                                />
                                {remaining > 0 && (
                                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '16px', pointerEvents: 'none' }}>
                                        <span style={{ color: '#fff', fontWeight: 600, fontSize: '18px' }}>+{remaining} fotos</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
