'use client';

import { useState } from 'react';
import { getCategoryColor, formatEventMeta } from '@/lib/event-display';

export type EventPreviewData = {
    title: string;
    category: string;
    zone: string;
    date_start: string;
    price: string; // string from input, empty = no sé el precio (a menos que isFree)
    isFree: boolean;
    imageUrl: string | null;
    venue_name: string;
};

// ─── Card visual ─────────────────────────────────────────────────────────────

function PreviewCard({
    data,
    size,
}: {
    data: EventPreviewData;
    size: 'big' | 'small' | 'mobile-small';
}) {
    const color = getCategoryColor(data.category);
    const isBig = size === 'big';
    const isMsm = size === 'mobile-small';
    const parsed = data.price !== '' ? parseFloat(data.price) : NaN;
    const priceNum = isNaN(parsed) ? null : parsed;
    const isGratis = data.isFree;

    return (
        <div style={{
            position: 'relative',
            borderRadius: isBig ? 10 : 8,
            overflow: 'hidden',
            background: '#111',
            width: '100%',
            height: '100%',
        }}>
            {/* Color bar */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: color, zIndex: 2 }} />

            {/* Background image */}
            {data.imageUrl && (
                <img
                    src={data.imageUrl}
                    alt=""
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                />
            )}

            {/* Gradient */}
            <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.05) 55%)',
            }} />

            {/* Badges (top) */}
            {!isMsm && (
                <div style={{
                    position: 'absolute',
                    top: isBig ? 12 : 8, left: isBig ? 12 : 8, right: isBig ? 12 : 8,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 3,
                }}>
                    {data.category && (
                        <span style={{
                            background: color + '44', color: '#fff',
                            padding: isBig ? '3px 8px' : '2px 6px',
                            borderRadius: 20, fontSize: isBig ? 10 : 9,
                            fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em',
                            fontFamily: 'var(--font-sans)',
                        }}>
                            {data.category}
                        </span>
                    )}
                    {isGratis && (
                        <span style={{
                            background: '#1a3a1a', color: '#6bcb6b',
                            padding: isBig ? '3px 8px' : '2px 6px',
                            borderRadius: 20, fontSize: isBig ? 10 : 9,
                            fontWeight: 600, fontFamily: 'var(--font-sans)',
                        }}>
                            GRATIS
                        </span>
                    )}
                </div>
            )}

            {/* Bottom content */}
            <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                padding: isBig ? '18px 20px' : isMsm ? '6px 8px' : '10px 12px',
                zIndex: 3,
            }}>
                {!isGratis && !isMsm && priceNum !== null && (
                    <p style={{
                        color: '#fff', fontSize: isBig ? 12 : 11, fontWeight: 700,
                        fontFamily: 'var(--font-sans)', marginBottom: isBig ? 4 : 2,
                    }}>
                        Q{priceNum}
                    </p>
                )}
                <h3 style={{
                    color: '#fff',
                    fontSize: isBig ? 26 : isMsm ? 12 : 15,
                    fontFamily: 'var(--font-serif)',
                    lineHeight: 1.2,
                    marginBottom: isMsm ? 2 : isBig ? 6 : 4,
                    display: '-webkit-box',
                    WebkitLineClamp: isBig ? 3 : 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                }}>
                    {data.title || 'Título del evento'}
                </h3>
                {!isMsm && (
                    <p style={{ color: '#aaa', fontSize: isBig ? 11 : 10, fontFamily: 'var(--font-sans)' }}>
                        {formatEventMeta(data.date_start, data.zone)}
                    </p>
                )}
                {isMsm && data.zone && (
                    <p style={{ color: '#aaa', fontSize: 9, fontFamily: 'var(--font-sans)' }}>{data.zone}</p>
                )}
            </div>
        </div>
    );
}

// ─── Placeholder card ─────────────────────────────────────────────────────────

function PlaceholderCard({ label }: { label: string }) {
    return (
        <div style={{
            width: '100%', height: '100%',
            borderRadius: 8, background: '#1a1a1a',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
            <span style={{ color: '#444', fontSize: 11, fontFamily: 'var(--font-sans)' }}>{label}</span>
        </div>
    );
}

// ─── Main preview ─────────────────────────────────────────────────────────────

export function EventPreview({ data }: { data: EventPreviewData }) {
    const [mode, setMode] = useState<'desktop' | 'mobile'>('desktop');
    const desktop = mode === 'desktop';

    return (
        <div className="sticky top-6">
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.15em', fontFamily: 'var(--font-sans)' }}>
                    Vista previa
                </p>
                {/* Toggle pill */}
                <div style={{
                    display: 'inline-flex', borderRadius: 999,
                    border: '1px solid #E5E5E5', overflow: 'hidden',
                }}>
                    {(['desktop', 'mobile'] as const).map(m => (
                        <button
                            key={m}
                            type="button"
                            onClick={() => setMode(m)}
                            style={{
                                padding: '4px 12px', fontSize: 11, fontWeight: 600,
                                fontFamily: 'var(--font-sans)', border: 'none', cursor: 'pointer',
                                background: mode === m ? '#0A0A0A' : 'transparent',
                                color: mode === m ? '#fff' : '#666',
                                textTransform: 'capitalize',
                                transition: 'all 0.15s',
                            }}
                        >
                            {m === 'desktop' ? 'Escritorio' : 'Mobile'}
                        </button>
                    ))}
                </div>
            </div>

            {desktop ? (
                /* ── Desktop: grid renderizado a tamaño real y escalado con CSS ── */
                (() => {
                    const REAL_W = 1100;  // ancho real del grid en la home (max-w-6xl - padding)
                    const PANEL_W = 556; // ancho usable del panel (w-[580px] - 24px)
                    const scale = PANEL_W / REAL_W;
                    const scaledH = Math.round(500 * scale);
                    return (
                        <>
                            <div style={{ width: PANEL_W, height: scaledH, overflow: 'hidden', borderRadius: 10, position: 'relative' }}>
                                <div style={{
                                    width: REAL_W,
                                    height: 500,
                                    transform: `scale(${scale})`,
                                    transformOrigin: 'top left',
                                    display: 'grid',
                                    gridTemplateColumns: '2fr 1fr',
                                    gridTemplateRows: '1fr 1fr',
                                    gap: 12,
                                }}>
                                    <div style={{ gridRow: 'span 2', position: 'relative' }}>
                                        <PreviewCard data={data} size="big" />
                                        <span style={{
                                            position: 'absolute', bottom: 8, right: 10,
                                            fontSize: 11, color: 'rgba(255,255,255,0.55)',
                                            fontFamily: 'var(--font-sans)', pointerEvents: 'none',
                                            background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: 4,
                                        }}>card grande</span>
                                    </div>
                                    <div style={{ position: 'relative' }}>
                                        <PreviewCard data={data} size="small" />
                                        <span style={{
                                            position: 'absolute', bottom: 6, right: 8,
                                            fontSize: 11, color: 'rgba(255,255,255,0.55)',
                                            fontFamily: 'var(--font-sans)', pointerEvents: 'none',
                                            background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: 4,
                                        }}>card pequeña</span>
                                    </div>
                                    <div>
                                        <PlaceholderCard label="otro evento" />
                                    </div>
                                </div>
                            </div>
                            <p style={{ marginTop: 6, fontSize: 10, color: '#999', fontFamily: 'var(--font-sans)' }}>
                                Escala {Math.round(scale * 100)}% · proporciones exactas de la home
                            </p>
                        </>
                    );
                })()
            ) : (
                /* ── Mobile: big card + scroll de minis ── */
                <div style={{ width: 300, margin: '0 auto' }}>
                    <div style={{ position: 'relative', height: 230, marginBottom: 10 }}>
                        <PreviewCard data={data} size="big" />
                        <span style={{
                            position: 'absolute', bottom: 6, right: 8,
                            fontSize: 9, color: 'rgba(255,255,255,0.5)',
                            fontFamily: 'var(--font-sans)', pointerEvents: 'none',
                        }}>card grande</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, overflowX: 'hidden' }}>
                        <div style={{ width: 130, height: 120, flexShrink: 0, position: 'relative' }}>
                            <PreviewCard data={data} size="mobile-small" />
                            <span style={{
                                position: 'absolute', bottom: 4, right: 6,
                                fontSize: 9, color: 'rgba(255,255,255,0.5)',
                                fontFamily: 'var(--font-sans)', pointerEvents: 'none',
                            }}>mini</span>
                        </div>
                        {[1, 2].map(n => (
                            <div key={n} style={{ width: 130, height: 120, flexShrink: 0 }}>
                                <PlaceholderCard label={`otro ${n + 1}`} />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <p style={{
                marginTop: 10, fontSize: 10, color: '#999',
                fontFamily: 'var(--font-sans)', textAlign: 'center',
            }}>
                Solo se muestra este evento. Los demás aparecen como placeholders.
            </p>
        </div>
    );
}
