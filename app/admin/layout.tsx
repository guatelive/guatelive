import Link from 'next/link';
import { signOut } from '@/app/login/actions';
import { Button } from '@/components/ui/button';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-[#FAFAFA]">
            <header className="flex items-center justify-between border-b border-[#E5E5E5] bg-white px-6 py-4">
                <Link href="/admin/events" className="font-serif text-lg text-[#0A0A0A]">
                    GuateLive Admin
                </Link>
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
            <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
        </div>
    );
}
