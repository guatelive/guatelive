import Link from 'next/link';
import type { Metadata } from 'next';
import { signOut } from '@/app/login/actions';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-[#FAFAFA]">
            <header className="flex items-center justify-between border-b border-[#E5E5E5] bg-white px-6 py-4">
                <div className="flex items-center gap-6">
                    <Link href="/admin/events" className="font-serif text-lg text-[#0A0A0A]">
                        GuateLive Admin
                    </Link>
                    <nav className="flex items-center gap-4">
                        <Link href="/admin/events" className="text-sm text-[#666666] hover:text-[#0A0A0A]">
                            Eventos
                        </Link>
                        <Link href="/admin/ediciones" className="text-sm text-[#666666] hover:text-[#0A0A0A]">
                            Ediciones
                        </Link>
                        <Link href="/admin/places" className="text-sm text-[#666666] hover:text-[#0A0A0A]">
                            Lugares
                        </Link>
                    </nav>
                </div>
                <div className="flex items-center gap-4">
                    <Link href="/" className="text-sm text-[#666666] hover:text-[#0A0A0A]">
                        Ver sitio
                    </Link>
                    <form action={signOut}>
                        <Button type="submit" variant="outline" size="sm" className="normal-case tracking-normal">
                            Salir
                        </Button>
                    </form>
                </div>
            </header>
            <main className="w-full px-8 py-8">{children}</main>
        </div>
    );
}
