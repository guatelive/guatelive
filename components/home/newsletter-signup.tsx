'use client';

import { useActionState, useState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { saveNewsletterInterests, subscribeToNewsletter, type NewsletterState } from '@/app/actions/newsletter';
import { NEWSLETTER_INTERESTS, NEWSLETTER_INTEREST_GROUPS } from '@/lib/newsletter-interests';

const initialState: NewsletterState = { status: 'idle' };
const LABELS = Object.fromEntries(NEWSLETTER_INTERESTS.map(i => [i.value, i.label]));

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button
            type="submit"
            disabled={pending}
            className="shrink-0 rounded-lg bg-[#E11D2E] px-6 py-3 text-[13px] font-extrabold tracking-[0.04em] text-white hover:bg-[#C41626]"
        >
            {pending ? 'ENVIANDO…' : 'SUSCRIBIRME'}
        </Button>
    );
}

// Paso 2: aparece recién después de suscribirse. El email ya quedó guardado; esto
// es opcional y se puede saltar ("Ahora no").
function InterestsStep({ email }: { email: string }) {
    const [selected, setSelected] = useState<string[]>([]);
    const [done, setDone] = useState<'saved' | 'skipped' | null>(null);
    const [pending, startTransition] = useTransition();

    if (done === 'saved') return <p className="mt-5 text-sm opacity-80">¡Gracias! Ya sabemos qué te gusta.</p>;
    if (done === 'skipped') return <p className="mt-5 text-sm opacity-80">Listo — ya estás suscrito.</p>;

    function toggle(value: string) {
        setSelected(prev => (prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]));
    }

    return (
        <div className="mt-5">
            <p className="text-sm font-semibold">¡Listo, ya estás suscrito! 🎉</p>
            <p className="mt-3 font-display text-lg font-extrabold">¿Qué planes son lo tuyo?</p>
            <p className="mt-1 text-sm opacity-80">Elegí tus favoritos.</p>
            <div className="mx-auto mt-5 max-w-2xl space-y-4">
                {NEWSLETTER_INTEREST_GROUPS.map(group => (
                    <div key={group.label}>
                        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] opacity-60">{group.label}</p>
                        <div className="flex flex-wrap justify-center gap-2">
                            {group.values.map(value => {
                                const active = selected.includes(value);
                                return (
                                    <button
                                        key={value}
                                        type="button"
                                        aria-pressed={active}
                                        onClick={() => toggle(value)}
                                        className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${active
                                            ? 'bg-[#E11D2E] text-white'
                                            : 'bg-white/10 text-background hover:bg-white/20'
                                            }`}
                                    >
                                        {LABELS[value]}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-6 flex items-center justify-center gap-4">
                <Button
                    type="button"
                    disabled={selected.length === 0 || pending}
                    onClick={() => startTransition(async () => {
                        await saveNewsletterInterests(email, selected);
                        setDone('saved');
                    })}
                    className="rounded-lg bg-[#E11D2E] px-6 py-3 text-[13px] font-extrabold tracking-[0.04em] text-white hover:bg-[#C41626] disabled:opacity-40"
                >
                    {pending ? 'GUARDANDO…' : 'GUARDAR'}
                </Button>
                <button type="button" onClick={() => setDone('skipped')} className="text-sm underline underline-offset-2 opacity-70 hover:opacity-100">
                    Ahora no
                </button>
            </div>
        </div>
    );
}

export function NewsletterSignup() {
    const [state, formAction] = useActionState(subscribeToNewsletter, initialState);

    return (
        <section id="newsletter" className="mx-auto mt-6 max-w-[1400px] scroll-mt-24 px-6 pb-10 md:px-10">
            <div className="relative overflow-hidden rounded-2xl bg-[#111111] p-8 text-center text-background md:p-12">
                <div
                    className="pointer-events-none absolute -top-8 right-10 h-[90px] w-[90px] rounded-full bg-[#E11D2E]"
                    style={{ opacity: 0.15 }}
                />
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#E11D2E]">
                    Newsletter
                </p>
                <p className="mt-3 font-display text-xl font-extrabold">
                    Cada jueves, una edición. Sin spam, sin patrocinios disfrazados.
                </p>

                {state.status === 'success' && state.email ? (
                    <InterestsStep email={state.email} />
                ) : state.status === 'success' ? (
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
