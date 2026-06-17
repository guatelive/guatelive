'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

const DISMISSED_KEY = 'edition-tab-v3';
const DISMISS_TTL = 24 * 60 * 60 * 1000;

type Edition = { slug: string; title: string; number: number };

export function EditionPeekTab() {
    const [edition, setEdition] = useState<Edition | null>(null);
    const [desktopShow, setDesktopShow] = useState(false);
    const [desktopDismissed, setDesktopDismissed] = useState(false);
    const [wiggle, setWiggle] = useState(false);
    const wiggleRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        fetch('/api/latest-edition')
            .then(r => r.json())
            .then((data: Edition | null) => {
                if (!data?.slug) return;
                setEdition(data);
            })
            .catch(() => null);
    }, []);

    useEffect(() => {
        if (!edition) return;
        const raw = localStorage.getItem(DISMISSED_KEY);
        if (raw && Date.now() - parseInt(raw, 10) < DISMISS_TTL) {
            setDesktopDismissed(true);
            return;
        }
        const t = setTimeout(() => setDesktopShow(true), 1500);
        return () => clearTimeout(t);
    }, [edition]);

    useEffect(() => {
        if (!desktopShow) return;
        wiggleRef.current = setInterval(() => {
            setWiggle(true);
            setTimeout(() => setWiggle(false), 400);
        }, 9000);
        return () => { if (wiggleRef.current) clearInterval(wiggleRef.current); };
    }, [desktopShow]);

    function dismissDesktop(e: React.MouseEvent) {
        e.preventDefault();
        e.stopPropagation();
        localStorage.setItem(DISMISSED_KEY, String(Date.now()));
        setDesktopDismissed(true);
        setDesktopShow(false);
    }

    if (!edition) return null;

    const label = edition.title.length > 30 ? edition.title.slice(0, 30) + '…' : edition.title;
    const labelShort = edition.title.length > 22 ? edition.title.slice(0, 22) + '…' : edition.title;

    return (
        <>
            <style>{`
                @keyframes peekSlideIn {
                    from { transform: translateX(110%); opacity: 0; }
                    to   { transform: translateX(0);    opacity: 1; }
                }
                @keyframes peekWiggle {
                    0%,100% { transform: translateX(0); }
                    35%     { transform: translateX(-10px); }
                    65%     { transform: translateX(-5px); }
                }
                @keyframes peekBounce {
                    0%, 100% { transform: translateY(0); animation-timing-function: cubic-bezier(0.8,0,1,1); }
                    50%      { transform: translateY(-5px); animation-timing-function: cubic-bezier(0,0,0.2,1); }
                }
                .peek-desktop-enter { animation: peekSlideIn 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards; }
                .peek-desktop-wiggle { animation: peekWiggle 0.4s ease-in-out forwards; }
                .peek-mobile-bounce { animation: peekBounce 1.8s ease-in-out infinite; }
            `}</style>

            {/* ── MOBILE: banner inline, siempre visible ── */}
            <div className="md:hidden mx-4 mt-4">
                <Link
                    href={`/edicion/${edition.slug}`}
                    className="peek-mobile-bounce"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: '#0A0A0A',
                        color: '#fff',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        textDecoration: 'none',
                        borderLeft: '3px solid #E11D2E',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                    }}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#E11D2E', fontFamily: 'var(--font-sans)' }}>
                            Edición Nº {edition.number}
                        </span>
                        <span style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.3, fontFamily: 'var(--font-sans)', color: '#fff' }}>
                            {label}
                        </span>
                    </div>
                    <span style={{ fontSize: 18, fontWeight: 700, marginLeft: 12, flexShrink: 0, color: '#E11D2E' }}>→</span>
                </Link>
            </div>

            {/* ── DESKTOP: tab fijo lado derecho ── */}
            {desktopShow && !desktopDismissed && (
                <div
                    className={`hidden md:block ${wiggle ? 'peek-desktop-wiggle' : 'peek-desktop-enter'}`}
                    style={{ position: 'fixed', right: 0, top: '42%', zIndex: 9999 }}
                >
                    <button
                        onClick={dismissDesktop}
                        aria-label="Cerrar"
                        style={{
                            position: 'absolute', top: -10, left: -10,
                            width: 22, height: 22, borderRadius: '50%',
                            background: '#0A0A0A', color: '#fff', border: 'none',
                            cursor: 'pointer', fontSize: 14, fontWeight: 700,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1,
                        }}
                    >×</button>

                    <Link
                        href={`/edicion/${edition.slug}`}
                        style={{
                            display: 'flex', flexDirection: 'column', gap: 3,
                            backgroundColor: '#0A0A0A', color: '#fff',
                            padding: '12px 16px',
                            borderRadius: '8px 0 0 8px',
                            textDecoration: 'none',
                            borderLeft: '3px solid #E11D2E',
                            boxShadow: '-4px 4px 20px rgba(0,0,0,0.4)',
                            maxWidth: 170, minWidth: 140,
                        }}
                    >
                        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#E11D2E', fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap' }}>
                            Edición Nº {edition.number}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.35, fontFamily: 'var(--font-sans)' }}>
                            {labelShort} →
                        </span>
                    </Link>
                </div>
            )}
        </>
    );
}
