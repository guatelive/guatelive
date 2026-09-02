'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { subscribeToNewsletter, type NewsletterState } from '@/app/actions/newsletter';

const initialState: NewsletterState = { status: 'idle' };

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button
            type="submit"
            disabled={pending}
            className="shrink-0 rounded-lg bg-[#C8E64E] px-6 py-3 text-[13px] font-extrabold tracking-[0.04em] text-[#111111] hover:bg-[#bdd944]"
        >
            {pending ? 'ENVIANDO…' : 'SUSCRIBIRME'}
        </Button>
    );
}

export function NewsletterSignup() {
    const [state, formAction] = useActionState(subscribeToNewsletter, initialState);

    return (
        <section className="mx-auto mt-6 max-w-[1400px] px-6 pb-10 md:px-10">
            <div className="relative overflow-hidden rounded-2xl bg-[#111111] p-8 text-center text-background md:p-12">
                <div
                    className="pointer-events-none absolute -top-8 right-10 h-[90px] w-[90px] rounded-full bg-[#C8E64E]"
                    style={{ opacity: 0.15 }}
                />
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#C8E64E]">
                    Newsletter
                </p>
                <p className="mt-3 font-display text-xl font-extrabold">
                    Cada jueves, una edición. Sin spam, sin patrocinios disfrazados.
                </p>

                {state.status === 'success' ? (
                    <p className="mt-5 text-sm opacity-80">Listo — ya estás suscrito.</p>
                ) : (
                    <form
                        action={formAction}
                        className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
                    >
                        {/* Honeypot: campo invisible para humanos, los bots lo completan */}
                        <input
                            type="text"
                            name="company"
                            tabIndex={-1}
                            autoComplete="off"
                            aria-hidden="true"
                            className="hidden"
                        />
                        <Input
                            type="email"
                            name="email"
                            required
                            placeholder="tu@email.com"
                            className="max-w-xs border-0 border-b-2 border-[#444444] bg-transparent text-background placeholder:text-background/40 focus-visible:ring-0"
                        />
                        <SubmitButton />
                    </form>
                )}

                {state.status === 'error' && (
                    <p className="mt-3 text-sm text-[#E11D2E]">{state.message}</p>
                )}
            </div>
        </section>
    );
}
