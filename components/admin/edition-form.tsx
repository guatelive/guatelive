'use client';

import { useState, useRef, type ChangeEvent } from 'react';
import { useFormStatus } from 'react-dom';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ChipInput } from './chip-input';
import { SummaryItemsEditor, type SummaryItem } from './summary-items-editor';
import { EditionItemsEditor, type EditionItem } from './edition-items-editor';
import { ImageCropper } from './image-cropper';
import { EditionPreview } from './edition-preview';

export type EditionWithItems = {
    slug?: string;
    number: number;
    title: string;
    subtitle?: string | null;
    intro_text?: string | null;
    cover_image_url?: string | null;
    strip_photos?: string[];
    summary_items: SummaryItem[];
    food_rating?: number | null;
    food_verdict?: string | null;
    place_rating?: number | null;
    place_verdict?: string | null;
    closing_text?: string | null;
    theme_tags: string[];
    meta_title?: string | null;
    meta_description?: string | null;
    status: 'draft' | 'published';
    items: EditionItem[];
};

interface Props {
    mode: 'create' | 'edit';
    edition?: EditionWithItems;
    nextNumber?: number;
    action: (formData: FormData) => void | Promise<void>;
}

function SubmitButton({ mode }: { mode: 'create' | 'edit' }) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} className="normal-case tracking-normal">
            {pending ? 'Guardando…' : mode === 'create' ? 'Crear edición' : 'Guardar cambios'}
        </Button>
    );
}

export function EditionForm({ mode, edition, nextNumber, action }: Props) {
    // --- estado para el preview ---
    const [number, setNumber] = useState(edition?.number ?? nextNumber ?? 1);
    const [title, setTitle] = useState(edition?.title ?? '');
    const [subtitle, setSubtitle] = useState(edition?.subtitle ?? '');
    const [introText, setIntroText] = useState(edition?.intro_text ?? '');
    const [foodRating, setFoodRating] = useState(String(edition?.food_rating ?? ''));
    const [foodVerdict, setFoodVerdict] = useState(edition?.food_verdict ?? '');
    const [placeRating, setPlaceRating] = useState(String(edition?.place_rating ?? ''));
    const [placeVerdict, setPlaceVerdict] = useState(edition?.place_verdict ?? '');
    const [closingText, setClosingText] = useState(edition?.closing_text ?? '');
    const [items, setItems] = useState<EditionItem[]>(edition?.items ?? []);
    const [summaryItems, setSummaryItems] = useState<SummaryItem[]>(edition?.summary_items ?? []);
    const [themeTags, setThemeTags] = useState<string[]>(edition?.theme_tags ?? []);

    // --- foto de portada ---
    const [coverPreview, setCoverPreview] = useState<string | null>(edition?.cover_image_url ?? null);
    const [coverCropFile, setCoverCropFile] = useState<File | null>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);

    function handleCoverChange(e: ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) setCoverCropFile(file);
    }

    function handleCoverCrop(blob: Blob, previewUrl: string) {
        setCoverPreview(previewUrl);
        const croppedFile = new File([blob], coverCropFile?.name ?? 'cover.jpg', { type: 'image/jpeg' });
        const dt = new DataTransfer();
        dt.items.add(croppedFile);
        if (coverInputRef.current) coverInputRef.current.files = dt.files;
        setCoverCropFile(null);
    }

    // --- fotos del strip editorial (hasta 3) ---
    const [stripPhotos, setStripPhotos] = useState<(string | null)[]>([
        edition?.strip_photos?.[0] ?? null,
        edition?.strip_photos?.[1] ?? null,
        edition?.strip_photos?.[2] ?? null,
    ]);
    const [stripCropTarget, setStripCropTarget] = useState<{ index: number; file: File } | null>(null);
    const stripInputRefs = useRef<(HTMLInputElement | null)[]>([]);

    function handleStripImageChange(i: number, e: ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) setStripCropTarget({ index: i, file });
    }

    function handleStripCrop(blob: Blob, previewUrl: string) {
        if (!stripCropTarget) return;
        const i = stripCropTarget.index;
        const croppedFile = new File([blob], stripCropTarget.file.name, { type: 'image/jpeg' });
        const dt = new DataTransfer();
        dt.items.add(croppedFile);
        if (stripInputRefs.current[i]) stripInputRefs.current[i]!.files = dt.files;
        setStripPhotos(prev => prev.map((p, idx) => (idx === i ? previewUrl : p)));
        setStripCropTarget(null);
    }

    function clearStripPhoto(i: number) {
        setStripPhotos(prev => prev.map((p, idx) => (idx === i ? null : p)));
        if (stripInputRefs.current[i]) stripInputRefs.current[i]!.value = '';
    }

    // --- toggle preview ---
    const [showPreview, setShowPreview] = useState(false);
    const [previewMode, setPreviewMode] = useState<'mobile' | 'desktop'>('mobile');

    return (
        <>
            {/* Cropper de strip (modal) */}
            {stripCropTarget && (
                <ImageCropper
                    file={stripCropTarget.file}
                    aspect={2 / 3}
                    onCrop={handleStripCrop}
                    onCancel={() => {
                        const i = stripCropTarget.index;
                        if (stripInputRefs.current[i]) stripInputRefs.current[i]!.value = '';
                        setStripCropTarget(null);
                    }}
                />
            )}

            {/* Cropper de portada (modal) */}
            {coverCropFile && (
                <ImageCropper
                    file={coverCropFile}
                    aspect={undefined}
                    onCrop={handleCoverCrop}
                    onCancel={() => {
                        setCoverCropFile(null);
                        if (coverInputRef.current) coverInputRef.current.value = '';
                    }}
                />
            )}

            {/* Barra superior: toggle preview */}
            <div className="mb-6 flex items-center justify-end">
                <button
                    type="button"
                    onClick={() => setShowPreview(v => !v)}
                    className="rounded-full border border-[#E5E5E5] px-4 py-1.5 text-sm text-[#666666] hover:bg-[#FAFAFA] transition-colors"
                >
                    {showPreview ? '← Ocultar preview' : 'Ver preview →'}
                </button>
            </div>

            <div className="flex gap-8 items-start">
                {/* ─── Formulario ─── */}
                <form action={action} className={`space-y-8 shrink-0 ${showPreview && previewMode === 'desktop' ? 'w-[520px]' : 'w-full lg:max-w-2xl'}`}>
                    <section className="space-y-4">
                        <h2 className="font-serif text-lg text-[#0A0A0A]">Datos generales</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="mb-1 block text-sm text-[#666666]">Número de edición</label>
                                <Input
                                    type="number" name="number" min="1"
                                    value={number}
                                    onChange={e => setNumber(Number(e.target.value))}
                                    required
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm text-[#666666]">Slug (opcional)</label>
                                <Input name="slug" defaultValue={edition?.slug} />
                            </div>
                        </div>
                        <div>
                            <label className="mb-1 block text-sm text-[#666666]">Título</label>
                            <Input name="title" value={title} onChange={e => setTitle(e.target.value)} required />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm text-[#666666]">Subtítulo</label>
                            <Input name="subtitle" value={subtitle} onChange={e => setSubtitle(e.target.value)} />
                        </div>
                    </section>

                    <section className="space-y-3 border-t border-[#E5E5E5] pt-6">
                        <h2 className="font-serif text-lg text-[#0A0A0A]">Foto de portada</h2>
                        {coverPreview && (
                            <div className="relative h-40 w-64 overflow-hidden rounded-md">
                                <Image src={coverPreview} alt="" fill className="object-cover" />
                            </div>
                        )}
                        <input
                            ref={coverInputRef}
                            type="file"
                            name="cover_image"
                            accept="image/*"
                            onChange={handleCoverChange}
                            className="text-sm"
                        />
                        <p className="text-xs text-[#666666]">Se abrirá un recortador para ajustar el encuadre.</p>
                    </section>

                    <section className="space-y-3 border-t border-[#E5E5E5] pt-6">
                        <h2 className="font-serif text-lg text-[#0A0A0A]">Fotos del strip editorial</h2>
                        <p className="text-xs text-[#666666]">
                            Aparecen como polaroids en el home. Hasta 3, en formato retrato (2:3). Si no subís fotos acá, el home usa las fotos de los items.
                        </p>
                        <div className="grid grid-cols-3 gap-3">
                            {([0, 1, 2] as const).map(i => (
                                <div key={i} className="space-y-2">
                                    <div className="relative h-[130px] w-full overflow-hidden rounded-lg border border-[#E5E5E5] bg-[#FAFAFA]">
                                        {stripPhotos[i] ? (
                                            <>
                                                <Image src={stripPhotos[i]!} alt="" fill className="object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => clearStripPhoto(i)}
                                                    className="absolute right-1 top-1 rounded-full bg-black/60 px-1.5 py-0.5 text-xs text-white hover:bg-black/80"
                                                >
                                                    ×
                                                </button>
                                            </>
                                        ) : (
                                            <div className="flex h-full items-center justify-center text-xs text-[#999]">
                                                Foto {i + 1}
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        ref={el => { stripInputRefs.current[i] = el; }}
                                        type="file"
                                        name={`strip_photo_${i}`}
                                        accept="image/*"
                                        onChange={e => handleStripImageChange(i, e)}
                                        className="w-full text-xs"
                                    />
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="space-y-2 border-t border-[#E5E5E5] pt-6">
                        <h2 className="font-serif text-lg text-[#0A0A0A]">Intro</h2>
                        <Textarea
                            name="intro_text"
                            value={introText}
                            onChange={e => setIntroText(e.target.value)}
                            rows={6}
                        />
                    </section>

                    <section className="space-y-3 border-t border-[#E5E5E5] pt-6">
                        <h2 className="font-serif text-lg text-[#0A0A0A]">Lugares / platos mencionados</h2>
                        <EditionItemsEditor
                            defaultValue={edition?.items ?? []}
                            onItemsChange={setItems}
                        />
                    </section>

                    <section className="space-y-3 border-t border-[#E5E5E5] pt-6">
                        <h2 className="font-serif text-lg text-[#0A0A0A]">La cuenta</h2>
                        <SummaryItemsEditor
                            name="summary_items"
                            defaultValue={edition?.summary_items ?? []}
                            onSummaryChange={setSummaryItems}
                        />
                    </section>

                    <section className="grid grid-cols-2 gap-6 border-t border-[#E5E5E5] pt-6">
                        <div className="space-y-2">
                            <h2 className="font-serif text-lg text-[#0A0A0A]">La comida</h2>
                            <label className="mb-1 block text-sm text-[#666666]">Rating (0-5)</label>
                            <Input
                                type="number" name="food_rating" min="0" max="5" step="0.5"
                                value={foodRating}
                                onChange={e => setFoodRating(e.target.value)}
                            />
                            <label className="mb-1 block text-sm text-[#666666]">Veredicto</label>
                            <Textarea
                                name="food_verdict"
                                value={foodVerdict}
                                onChange={e => setFoodVerdict(e.target.value)}
                                rows={5}
                            />
                        </div>
                        <div className="space-y-2">
                            <h2 className="font-serif text-lg text-[#0A0A0A]">El lugar</h2>
                            <label className="mb-1 block text-sm text-[#666666]">Rating (0-5)</label>
                            <Input
                                type="number" name="place_rating" min="0" max="5" step="0.5"
                                value={placeRating}
                                onChange={e => setPlaceRating(e.target.value)}
                            />
                            <label className="mb-1 block text-sm text-[#666666]">Veredicto</label>
                            <Textarea
                                name="place_verdict"
                                value={placeVerdict}
                                onChange={e => setPlaceVerdict(e.target.value)}
                                rows={5}
                            />
                        </div>
                    </section>

                    <section className="space-y-2 border-t border-[#E5E5E5] pt-6">
                        <h2 className="font-serif text-lg text-[#0A0A0A]">Cierre</h2>
                        <Textarea
                            name="closing_text"
                            value={closingText}
                            onChange={e => setClosingText(e.target.value)}
                            rows={5}
                        />
                    </section>

                    <section className="space-y-2 border-t border-[#E5E5E5] pt-6">
                        <h2 className="font-serif text-lg text-[#0A0A0A]">Tags</h2>
                        <input type="hidden" name="theme_tags" value={themeTags.join(',')} />
                        <ChipInput value={themeTags} onChange={setThemeTags} placeholder="Ej. zona 15, terraza, date night…" />
                    </section>

                    <section className="space-y-3 border-t border-[#E5E5E5] pt-6">
                        <h2 className="font-serif text-lg text-[#0A0A0A]">SEO (opcional)</h2>
                        <div>
                            <label className="mb-1 block text-sm text-[#666666]">Meta título</label>
                            <Input name="meta_title" defaultValue={edition?.meta_title ?? ''} />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm text-[#666666]">Meta descripción</label>
                            <Input name="meta_description" defaultValue={edition?.meta_description ?? ''} />
                        </div>
                    </section>

                    <section className="flex items-center justify-between border-t border-[#E5E5E5] pt-6">
                        <div>
                            <label className="mb-1 block text-sm text-[#666666]">Estado</label>
                            <select
                                name="status"
                                defaultValue={edition?.status ?? 'draft'}
                                className="h-10 rounded-md border border-[#E5E5E5] px-3 text-sm"
                            >
                                <option value="draft">Borrador</option>
                                <option value="published">Publicado</option>
                            </select>
                        </div>
                        <SubmitButton mode={mode} />
                    </section>
                </form>

                {/* ─── Preview ─── */}
                {showPreview && (
                    <div className={`rounded-xl border border-[#E5E5E5] bg-white shadow-sm overflow-y-auto ${
                        previewMode === 'mobile'
                            ? 'w-[460px] shrink-0 sticky top-6 max-h-[calc(100vh-3rem)]'
                            : 'flex-1 min-w-0 sticky top-6 max-h-[calc(100vh-3rem)]'
                    }`}>
                        <div className="border-b border-[#E5E5E5] px-5 py-3 flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-[#666666]">Preview</span>
                            <div className="flex items-center gap-1 rounded-full border border-[#E5E5E5] p-0.5">
                                <button
                                    type="button"
                                    onClick={() => setPreviewMode('mobile')}
                                    className={`rounded-full px-3 py-1 text-xs transition-colors ${
                                        previewMode === 'mobile'
                                            ? 'bg-[#0A0A0A] text-white'
                                            : 'text-[#666666] hover:text-[#0A0A0A]'
                                    }`}
                                >
                                    Mobile
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPreviewMode('desktop')}
                                    className={`rounded-full px-3 py-1 text-xs transition-colors ${
                                        previewMode === 'desktop'
                                            ? 'bg-[#0A0A0A] text-white'
                                            : 'text-[#666666] hover:text-[#0A0A0A]'
                                    }`}
                                >
                                    Desktop
                                </button>
                            </div>
                        </div>
                        <EditionPreview
                            number={number}
                            title={title}
                            subtitle={subtitle}
                            intro_text={introText}
                            cover_preview={coverPreview}
                            items={items}
                            summary_items={summaryItems}
                            food_rating={foodRating}
                            food_verdict={foodVerdict}
                            place_rating={placeRating}
                            place_verdict={placeVerdict}
                            closing_text={closingText}
                            mode={previewMode}
                        />
                    </div>
                )}
            </div>
        </>
    );
}
