'use client';

import { useState, type ChangeEvent } from 'react';
import { useFormStatus } from 'react-dom';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ChipInput } from './chip-input';
import { PlanItemsEditor, type PlanEditorItemInput, type PlanItemOption } from './plan-items-editor';
import type { DbPlan } from '@/lib/plans';

interface Props {
    mode: 'create' | 'edit';
    plan?: DbPlan;
    items?: PlanEditorItemInput[];
    options: PlanItemOption[];
    action: (formData: FormData) => void | Promise<void>;
}

const STATUS_LABELS: Record<DbPlan['status'], string> = {
    draft: 'Borrador',
    published: 'Publicado',
    archived: 'Archivado',
};

function SubmitButton({ mode }: { mode: 'create' | 'edit' }) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} className="normal-case tracking-normal">
            {pending ? 'Guardando…' : mode === 'create' ? 'Crear plan' : 'Guardar cambios'}
        </Button>
    );
}

// "2026-11-03T12:00:00" (DB) → "2026-11-03T12:00" (datetime-local). Hora de pared de
// Guatemala, sin conversión de zona — igual que event-form.tsx.
function toDatetimeLocal(value: string | null | undefined): string {
    return value ? value.slice(0, 16) : '';
}

export function PlanForm({ mode, plan, items = [], options, action }: Props) {
    const [kind, setKind] = useState<DbPlan['kind']>(plan?.kind ?? 'ocasion');
    const [themeTags, setThemeTags] = useState<string[]>(plan?.theme_tags ?? []);
    const [coverPreview, setCoverPreview] = useState<string | null>(plan?.cover_image_url ?? null);
    const [coverRemoved, setCoverRemoved] = useState(false);

    function handleCoverChange(e: ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setCoverPreview(URL.createObjectURL(file));
        setCoverRemoved(false);
    }

    return (
        <form action={action} className="flex flex-wrap items-start gap-6">
            <div className="flex min-w-0 flex-[1_1_340px] flex-col gap-4 rounded-xl border border-[#E5E5E5] bg-white p-5">
                <h2 className="text-sm font-semibold text-[#0A0A0A]">Datos del plan</h2>

                <label className="flex flex-col gap-1.5 text-sm font-medium">
                    Título *
                    <Input name="title" required defaultValue={plan?.title} placeholder="Champions a la hora del almuerzo" />
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-medium">
                    Slug
                    <Input name="slug" defaultValue={plan?.slug} placeholder="Se genera del título si lo dejás vacío" />
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-medium">
                    Subtítulo
                    <Input name="subtitle" defaultValue={plan?.subtitle ?? ''} placeholder="Cuatro partidos a las 2 PM y dos lugares donde verlos" />
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-medium">
                    Intro
                    <Textarea name="intro_text" rows={4} defaultValue={plan?.intro_text ?? ''} />
                </label>

                <div className="flex flex-col gap-1.5 text-sm font-medium">
                    Portada
                    <div className="flex items-center gap-3">
                        {coverPreview && !coverRemoved && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={coverPreview} alt="" className="h-[54px] w-24 rounded-md object-cover" />
                        )}
                        <input
                            type="file"
                            name="cover"
                            accept="image/*"
                            onChange={handleCoverChange}
                            className="text-xs text-[#666666] file:mr-2 file:cursor-pointer file:rounded file:border file:border-[#E5E5E5] file:bg-white file:px-2 file:py-1 file:text-xs file:font-medium file:text-[#0A0A0A]"
                        />
                    </div>
                    {mode === 'edit' && plan?.cover_image_url && !coverRemoved && (
                        <button type="button" onClick={() => setCoverRemoved(true)} className="self-start text-xs text-[#E11D2E] hover:underline">
                            Quitar portada
                        </button>
                    )}
                    <input type="hidden" name="remove_cover" value={coverRemoved ? '1' : ''} />
                    <span className="text-xs font-normal text-[#666666]">Sin portada se usa la foto del primer item.</span>
                </div>

                <fieldset className="flex flex-col gap-2">
                    <legend className="mb-1.5 text-sm font-medium">Tipo</legend>
                    <div className="flex gap-2">
                        {(['ocasion', 'siempre'] as const).map(k => (
                            <label
                                key={k}
                                className={`flex flex-1 cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-sm ${
                                    kind === k ? 'border-2 border-[#0A0A0A]' : 'border border-[#E5E5E5]'
                                }`}
                            >
                                <input type="radio" name="kind" value={k} checked={kind === k} onChange={() => setKind(k)} />
                                {k === 'ocasion' ? 'De ocasión' : 'Siempre'}
                            </label>
                        ))}
                    </div>
                </fieldset>

                {kind === 'ocasion' && (
                    <div className="flex flex-col gap-1.5">
                        <div className="grid grid-cols-2 gap-3">
                            <label className="flex flex-col gap-1.5 text-sm font-medium">
                                Empieza *
                                <Input type="datetime-local" name="starts_at" required defaultValue={toDatetimeLocal(plan?.starts_at)} />
                            </label>
                            <label className="flex flex-col gap-1.5 text-sm font-medium">
                                Termina *
                                <Input type="datetime-local" name="ends_at" required defaultValue={toDatetimeLocal(plan?.ends_at)} />
                            </label>
                        </div>
                        <p className="text-xs text-[#666666]">Hora de Guatemala. Deja de listarse al pasar la hora de fin.</p>
                    </div>
                )}

                <div className="flex flex-col gap-1.5 text-sm font-medium">
                    Tags
                    <ChipInput value={themeTags} onChange={setThemeTags} placeholder="Fútbol, Con amigos… (Enter para agregar)" />
                    <input type="hidden" name="theme_tags" value={JSON.stringify(themeTags)} />
                </div>

                <label className="flex flex-col gap-1.5 text-sm font-medium">
                    Estado
                    <select
                        name="status"
                        defaultValue={plan?.status ?? 'draft'}
                        className="h-10 rounded-md border border-[#E5E5E5] bg-white px-2 text-sm"
                    >
                        {(Object.keys(STATUS_LABELS) as DbPlan['status'][]).map(s => (
                            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                        ))}
                    </select>
                </label>

                <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="sponsored" defaultChecked={plan?.sponsored} />
                    Plan patrocinado
                </label>

                <div className="pt-1">
                    <SubmitButton mode={mode} />
                </div>
            </div>

            <div className="min-w-0 flex-[999_1_560px]">
                <PlanItemsEditor options={options} defaultValue={items} />
            </div>
        </form>
    );
}
