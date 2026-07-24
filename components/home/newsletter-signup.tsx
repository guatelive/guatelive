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
        <Button type="submit" disabled={pending} variant="secondary" className="shrink-0">
            {pending ? 'Enviando…' : 'Suscribirme'}
        </Button>
    );
}

export function NewsletterSignup() {
    const [state, formAction] = useActionState(subscribeToNewsletter, initialState);

    return (
        <section className="mx-auto mt-6 max-w-6xl px-4 pb-10 sm:px-6">
            <div className="rounded-2xl bg-foreground p-8 text-center text-background">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#E11D2E]">
                    Newsletter
                </p>
                <p className="mt-3 font-serif text-xl">
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
                            className="max-w-xs border-b-background/40 text-background placeholder:text-background/40"
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
