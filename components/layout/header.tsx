import Link from 'next/link';

export function Header() {
    return (
        <header className="sticky top-0 z-40 border-b border-[#E5E5E5] bg-white">
            <div className="mx-auto flex h-14 items-center justify-between px-8" style={{ maxWidth: '1150px' }}>
                <Link
                    href="/"
                    className="font-serif text-xl font-bold tracking-tight text-[#0A0A0A] hover:opacity-80 transition-opacity"
                >
                    GuateLive
                </Link>
                <nav className="flex items-center gap-2">
                    <Link
                        href="/"
                        className="text-sm font-medium text-[#0A0A0A] border border-[#E5E5E5] rounded-full px-4 py-1.5 hover:bg-[#F5F5F5] transition-colors"
                    >
                        Inicio
                    </Link>
                    <Link
                        href="/edicion"
                        className="text-sm font-medium text-[#0A0A0A] border border-[#E5E5E5] rounded-full px-4 py-1.5 hover:bg-[#F5F5F5] transition-colors"
                    >
                        Ediciones
                    </Link>
                </nav>
            </div>
        </header>
    );
}
