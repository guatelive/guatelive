'use client';

import { useState } from 'react';

type BadgeStyle = { bg: string; text: string };

const STYLES: Record<string, BadgeStyle> = {
    tipo:     { bg: '#1A1A1A', text: '#FFFFFF' },
    ocasion:  { bg: '#E11D2E', text: '#FFFFFF' },
    ambiente: { bg: '#FBEFD8', text: '#8A5A00' },
    servicio: { bg: '#EFF4E8', text: '#4A6B22' },
    especial: { bg: '#E6F1FB', text: '#185FA5' },
    resto:    { bg: '#F1EFE8', text: '#5F5E5A' },
};

const TIPO = new Set([
    'restaurante', 'cafe', 'bar', 'food-truck', 'panaderia-cafeteria', 'reposteria',
    'vinoteca', 'mexicana', 'guatemalteca', 'fusion-latina', 'fusion-asiatica',
    'japonesa', 'coreana', 'peruana', 'europea', 'americana', 'carnes', 'mariscos',
    'comfort-food', 'tacos-y-mexicana', 'cafe-especialidad', 'cocteleria-de-autor',
    'mediterranea', 'bar-de-cafe',
]);
const OCASION = new Set([
    'date-night', 'cena-romantica', 'celebracion', 'primera-cita', 'con-amigos',
    'familia', 'domingo-en-familia', 'turismo', 'reunion-de-negocios', 'after-office',
    'plan-rapido', 'antojo-nocturno', 'grupos-grandes', 'ninos', 'noche',
    'desayuno', 'brunch', 'almuerzo', 'para-trabajar',
]);
const AMBIENTE = new Set([
    'animado', 'tranquilo', 'acogedor', 'elegante', 'romantico', 'bohemio', 'casual',
    'instagrameable', 'decoracion-unica', 'al-aire-libre', 'rooftop', 'vista-ciudad',
    'vistas-panoramicas', 'espacio-intimo', 'segundo-nivel', 'escondido',
    'volumen-conversacional', 'musica-en-vivo', 'terraza', 'experiencia-cultural',
    'laptop-friendly',
]);
const SERVICIO = new Set([
    'acepta-reservas', 'delivery', 'para-llevar', 'consumo-en-local',
    'acceso-silla-de-ruedas', 'pet-friendly', 'wifi', 'servicio-rapido',
    'reserva-obligatoria', 'reserva-con-anticipacion', 'abierto-temprano',
    'desayuno-todo-el-dia', 'bar-completo', 'vinos-importados',
]);
const ESPECIAL = new Set([
    'experiencia-unica', 'joya-escondida', 'en-antigua', 'en-centro-historico',
    'en-cayala', 'en-muxbal', 'proyecto-local', 'chef-reconocido', 'menu-degustacion',
    'sin-gluten', 'vegetariano', 'vegano', 'ingredientes-locales',
    'ingredientes-de-temporada', 'tuesta-su-propio-cafe', 'cafe-de-origen-guatemalteco',
    'experiencia-de-mesa', 'barra-del-chef', 'cocina-abierta', 'buenos-postres',
    'maridaje-vinos', 'espacio-cultural', 'galeria-permanente', 'galeria-temporal',
    'programacion-cultural', 'piscina', 'lugar-historico', 'menu-en-ingles',
    'acuario', 'amenidad-unica', 'experiencia-gastro', 'venta-cafe-en-grano',
]);

const ORDER = ['tipo', 'ocasion', 'ambiente', 'servicio', 'especial', 'resto'];

function classify(tag: string): string {
    if (TIPO.has(tag))     return 'tipo';
    if (OCASION.has(tag))  return 'ocasion';
    if (AMBIENTE.has(tag)) return 'ambiente';
    if (SERVICIO.has(tag)) return 'servicio';
    if (ESPECIAL.has(tag)) return 'especial';
    return 'resto';
}

function sortByCategory(tags: string[]): string[] {
    return [...tags].sort(
        (a, b) => ORDER.indexOf(classify(a)) - ORDER.indexOf(classify(b))
    );
}

export function TagsBadges({ tags }: { tags: string[] }) {
    const [showAll, setShowAll] = useState(false);
    const sorted  = sortByCategory(tags);
    const visible = showAll ? sorted : sorted.slice(0, 12);
    const extra   = tags.length - 12;

    return (
        <div className="mb-8">
            <div className="flex flex-wrap gap-2">
                {visible.map((tag) => {
                    const { bg, text } = STYLES[classify(tag)];
                    return (
                        <span
                            key={tag}
                            style={{ backgroundColor: bg, color: text }}
                            className="px-3 py-1 rounded-full text-xs font-medium leading-snug"
                        >
                            {tag.replace(/-/g, ' ')}
                        </span>
                    );
                })}
            </div>

            {extra > 0 && (
                <button
                    onClick={() => setShowAll((s) => !s)}
                    className="mt-3 text-xs text-[#666666] hover:text-[#0A0A0A] underline underline-offset-2 transition-colors"
                >
                    {showAll ? 'Ver menos' : `Ver todos los tags (+${extra})`}
                </button>
            )}
        </div>
    );
}
