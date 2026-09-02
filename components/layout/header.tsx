import Link from 'next/link';

export function Header() {
    return (
        <header className="sticky top-0 z-40 border-b border-[#E5E5E5] bg-white">
            <div className="mx-auto flex h-16 items-center justify-between px-6 md:px-10" style={{ maxWidth: '1400px' }}>
                <Link
                    href="/"
                    className="font-display text-xl font-extrabold tracking-[-0.01em] text-[#111111] hover:opacity-80 transition-opacity"
                >
                    Guate<span className="text-[#E11D2E]">Live</span>
                </Link>
                <nav className="flex items-center gap-3">
                    <Link
                        href="/edicion"
                        className="inline-flex items-center rounded-full border-2 border-[#111111] px-4 py-1.5 text-sm font-bold text-[#111111] transition-colors hover:bg-[#F5F5F5]"
                    >
                        Ediciones
                    </Link>
                    <Link
                        href="/promos"
                        className="rounded-full bg-[#111111] px-4 py-1.5 text-sm font-bold text-white transition-colors hover:bg-[#2a2a2a]"
                    >
                        Promos
                    </Link>
                </nav>
            </div>
        </header>
    );
}
