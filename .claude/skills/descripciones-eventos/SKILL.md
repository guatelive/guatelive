---
description: Redacta description para eventos de `events` scrapeados sin description, con grounding estricto en campos estructurados propios (nunca contenido copiado de la fuente) — usar en el loop de scripts/query-missing-event-descriptions.ts + scripts/apply-event-descriptions.ts
---

# Generar descripciones editoriales de eventos: $ARGUMENTS

Contexto completo en `docs/decisions.md` ADR-020/021 y `docs/historial-sesiones.md`
(sesión donde se armó este skill y el scraper que lo alimenta). Por qué existe: el
scraper de eventos (`scripts/scrape-events.ts`, fuente `eticket.gt`) deja
`description`/`image_url` en `null` a propósito — nunca copia texto ni imagen de la
fuente original (riesgo de copyright/contenido duplicado, y en contra de la voz
editorial propia de GuateLive). Este skill llena esa `description` con una oración
propia, corta, basada solo en lo que ya verificamos nosotros mismos.

## Regla de oro: grounding estricto (más simple que en lugares, pero igual de firme)

`eticket.gt` no expone ningún texto de "sobre el evento" en su página de detalle —
a diferencia de `places` (que tiene `reviews_snapshot`), acá **no hay una fuente rica
de la que sacar color**. La única fuente válida es la fila del evento en sí:
`title`, `category`, `zone`, `venue_name`, `date_start`, `date_end`, `price`,
`is_free`. Nunca:

- Conocimiento general del modelo sobre el artista/evento (su fama, discografía,
  anécdotas, "es uno de los artistas más importantes de...") — si no está en la fila,
  no se escribe, sin importar qué tan conocido sea.
- Inventar ambiente/tono no verificable ("una noche mágica", "el evento del año") —
  son afirmaciones que no salen de ningún dato real.
- Repetir zona/venue palabra por palabra si la página ya los muestra aparte (ver
  `app/evento/[slug]/page.tsx` — sí se pueden mencionar de forma natural en la
  oración, pero no es información nueva).

Si la fila no tiene casi nada más allá del título y la fecha (categoría `'Otros'`,
sin `venue_name` explícito porque solo hay `zone`), está bien que la descripción sea
mínima — una oración corta y verdadera es mejor que una larga con relleno.

## Voz editorial

Mismo tono que el resto del sitio (ver `.claude/skills/descripciones-lugares/
SKILL.md` para la referencia completa) — español informal guatemalteco, sin sonar a
"IA genérica". Para eventos, en la práctica es casi siempre una sola oración:

- Arranca con el título/artista, seguido de fecha y lugar en lenguaje natural (no
  "Fecha: 8 de agosto" tipo ficha técnica)
- Si `is_free` es true, mencionalo — es un dato que la gente busca
- Si `price` tiene valor, se puede mencionar el precio o dejarlo fuera (la página ya
  lo muestra en su propio campo) — priorizar que la oración no se sienta forzada
- Máximo ~150 caracteres, igual que lugares

Ejemplos (formato, no copiar literal):
- "EMINENCE se presenta el 8 de agosto en el Centro Cultural Miguel Ángel Asturias,
  Zona 1."
- "Carrera familiar a beneficio del Hogar Casa Bernabé, 4 de octubre en Cayalá —
  entrada gratuita."
- "Festival gastronómico en Zona 5, con boletos disponibles en eticket.gt."
  (cuando no hay `venue_name`, solo `zone` — está bien ser genérico en vez de
  inventar el lugar exacto)

## Proceso por lote

1. `npx tsx scripts/query-missing-event-descriptions.ts --limit 20` (o el
   subconjunto que pida Fredy) — trae id/título/categoría/zona/venue/fecha/precio de
   eventos `pending` sin `description`, ordenados por fecha.
2. Redactar cada `description` aplicando las reglas de arriba. Si un evento no tiene
   ni título útil ni venue (rarísimo, pero posible), se omite del lote — no se fuerza
   una oración vacía de contenido.
3. Mostrar el lote en una tabla en el chat para que Fredy la revise — no hace falta
   agente de verificación independiente acá (a diferencia de lugares/ADR-016): toda
   la fuente de verdad es la misma fila de `events`, no hay reviews de terceros que
   pudieran malinterpretarse, así que el riesgo de un dato mal verificado es mucho
   más bajo.
4. Escribir el batch a `scripts/data/event-descriptions-batch-NN.json` y correr
   `apply-event-descriptions.ts --file ... --dry` primero, después sin `--dry`.
5. Repetir desde el paso 1 hasta que `query-missing-event-descriptions.ts` devuelva 0
   pendientes.
