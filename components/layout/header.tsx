import Link from 'next/link';

export function Header() {
    return (
        <header className="border-b border-[#E5E5E5] sticky top-0 bg-white z-50">
            <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-[#0A0A0A] flex items-center justify-center">
                        <span className="text-white font-serif font-bold">G</span>
                    </div>
                    <span className="font-serif font-bold text-xl hidden sm:inline">
                        GuateLive
                    </span>
                </Link>

                {/* Nav */}
                <nav className="flex items-center gap-6">
                    <Link href="/promos" className="text-sm hover:text-[#E11D2E] transition">
                        Promociones
                    </Link>
                    <input
                        type="text"
                        placeholder="Buscar..."
                        className="hidden md:block px-3 py-2 border border-[#E5E5E5] rounded-lg text-sm focus:outline-none focus:border-[#E11D2E]"
                    />
                    <button className="btn-primary px-4 py-2 text-sm rounded">
                        Newsletter
                    </button>
                </nav>
            </div>
        </header>
    );
}