// Convierte el texto plano de promo.terms (líneas separadas por \n, bullets ya
// marcados con "• " por scripts/bank-sources/bac.ts) en bloques con forma —
// encabezados, listas, párrafos — para que el modal de detalle no sea un solo
// bloque de texto plano. Heurística simple: una línea corta que termina en
// ":" es un encabezado de sección (ej. "Horario:", "Condiciones y
// restricciones:"); líneas consecutivas con "• " se agrupan en una lista;
// el resto son párrafos sueltos (cada uno ya era un <p>/<li> propio en el
// HTML original de BAC).

export type TermsBlock =
    | { type: 'heading'; text: string }
    | { type: 'bullets'; items: string[] }
    | { type: 'paragraph'; text: string };

const MAX_HEADING_LENGTH = 45;

export function parseTermsBlocks(terms: string): TermsBlock[] {
    const lines = terms.split('\n').map((l) => l.trim()).filter(Boolean);
    const blocks: TermsBlock[] = [];
    let bulletBuffer: string[] = [];

    function flushBullets() {
        if (bulletBuffer.length > 0) {
            blocks.push({ type: 'bullets', items: bulletBuffer });
            bulletBuffer = [];
        }
    }

    for (const line of lines) {
        if (line.startsWith('• ')) {
            bulletBuffer.push(line.slice(2).trim());
            continue;
        }
        flushBullets();
        const isHeading = line.endsWith(':') && line.length <= MAX_HEADING_LENGTH;
        blocks.push(isHeading ? { type: 'heading', text: line.slice(0, -1) } : { type: 'paragraph', text: line });
    }
    flushBullets();

    return blocks;
}
