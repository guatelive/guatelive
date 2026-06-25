import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { signIn } from './actions';

export const metadata = {
    title: 'Login — GuateLive Admin',
};

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string; redirect?: string }>;
}) {
    const { error, redirect } = await searchParams;

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA] px-4">
            <form
                action={signIn}
                className="w-full max-w-sm rounded-2xl border border-[#E5E5E5] bg-white p-8"
            >
                <h1 className="font-serif text-2xl text-[#0A0A0A] mb-6">GuateLive Admin</h1>

                {redirect && <input type="hidden" name="redirect" value={redirect} />}

                {error && (
                    <p className="mb-4 text-sm text-[#E11D2E]">{error}</p>
                )}

                <label htmlFor="email" className="mb-1 block text-sm text-[#666666]">
                    Email
                </label>
                <Input id="email" type="email" name="email" required className="mb-4" />

                <label htmlFor="password" className="mb-1 block text-sm text-[#666666]">
                    Contraseña
                </label>
                <Input id="password" type="password" name="password" required className="mb-6" />

                <Button type="submit" className="w-full normal-case tracking-normal">
                    Entrar
                </Button>
            </form>
        </div>
    );
}
