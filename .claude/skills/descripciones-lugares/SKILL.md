---
description: Redacta description + tags editoriales para lugares de `places` sin description, con grounding estricto (nunca inventa hechos no verificados) — usar en el loop de scripts/query-missing-descriptions.ts + scripts/apply-place-descriptions.ts
---

# Generar descripciones editoriales de lugares: $ARGUMENTS

Contexto completo en `docs/decisions.md` ADR-014 y en `docs/historial-sesiones.md`
(sesión donde se armó este skill). Por qué existe: una descripción con un dato
inventado es peor que no tener descripción — es un texto público que se lee como
reseña de alguien que "conoce" el lugar. Fredy no puede revisar 371 descripciones a
mano, así que la única forma de que esto escale es que el riesgo de inventar algo sea
casi cero por diseño, no por revisión manual exhaustiva.

## Regla de oro: grounding estricto

Cada afirmación en la `description` tiene que salir de dato ya verificado en la fila
del lugar — nunca del conocimiento general del modelo sobre un lugar/marca específico
(fama, anécdotas, "es conocido por...", que un bar es "icónico", etc.). Un dato así,
sin fuente en la fila, no se escribe — ni siquiera marcado con ⚠️ para revisión,
porque no escala (Fredy no puede verificar 371 a mano). Si no hay dato verificable
suficiente para un lugar, se deja sin `description` (queda el fallback de
`fallbackReview` que ya muestra la página — ver `app/lugar/[slug]/page.tsx:348-369`).

Dos fuentes válidas, con criterios distintos:

**1. Campos estructurados de la fila** (`name`, `address`, `zone`, `primary_category`,
`rating`, `tags` existentes) — siempre seguros de usar. Igual, **nunca repetir
zona/dirección en el texto**: la página ya la muestra arriba de "Sobre el lugar"
(badge de ubicación + rating), repetirla desperdicia los ~150 caracteres.

**2. `reviews_snapshot`** (reseñas reales de Google, ya en la fila — típicamente 5 por
lugar) — la fuente principal para el color específico que hace que una descripción no
sea genérica. Regla para usarla, decidida en sesión 2026-07-17:

- **Separar hecho de opinión.** Un hecho concreto y verificable (un plato del menú,
  una característica física — "tiene área de pérgola", "sirve costilla sin hueso") se
  puede tomar de **una sola mención**, sin importar el rating de esa review — es un
  dato objetivo, no depende de que varias personas coincidan. Una opinión subjetiva
  ("es el mejor", "excelente", "acogedor") solo se incluye si **se repite en 2+
  reviews** y esas reviews son de **4-5★** — una sola persona feliz no es señal
  suficiente, y una opinión de una review de 1-3★ es más ruido que dato.
- **Quejas puntuales se excluyen siempre**, sin importar si son la única mención de
  ese tema o no (factura faltante, un plato que llegó frío una vez, servicio lento un
  día) — son sobre una mala experiencia puntual, no un rasgo estable del lugar.
- **Si dos reviews se contradicen** en el mismo punto (una dice "servicio rápido",
  otra "servicio no siempre amable"), no se incluye ninguna de las dos — no hay
  consenso, no se inventa uno.
- El `rating` general del lugar (`place.rating`, no el de la review individual) calibra
  el tono: 4.5+ permite un tono más entusiasta, más bajo pide un tono más neutro.
- Recencia (`relative_time_description` si está disponible) como desempate cuando dos
  datos compiten y uno es claramente viejo — no es un filtro duro.

Mismo criterio de "hecho puede venir de una mención" aplica a tags nuevos: un tag
nuevo solo si sale de un hecho explícito (en `name`, `address`, o una review) — nunca
relleno para llegar a una cuota. Está bien no agregar tags nuevos si el lugar ya
quedó bien tageado en un batch anterior.

## Voz editorial

Referencia: las únicas 2 descripciones escritas a mano que existen hoy
(`scripts/seed-editorial-places.ts:25,69` — Fridas y Graciela). Las otras 5
descripciones ya en la DB son pass-through de Google (`editorial_summary.overview`)
y **no** son la referencia de tono — genéricas, sin voz.

- 1-2 oraciones, máximo 150 caracteres
- Español informal guatemalteco, voz editorial (no "IA genérica")
- Detalle concreto, nunca solo adjetivos ("tranquilo y acogedor" sin nada más es
  débil — mejor "tranquilo, bueno para trabajar" si el tag `para-trabajar` ya existe)
- Cierra con un dato o veredicto práctico cuando el dato lo permite (rating, precio,
  qué tipo de plan es bueno ahí)

## Vocabulario de tags

No uses una lista fija — el vocabulario real ya en uso está repartido en:
- `lib/place-tags.ts` (`PLACE_TAG_GROUPS`) — lista base, desactualizada pero válida
- `scripts/data/tags-batch3.json`, `scripts/data/tags-batch-final.json`,
  `scripts/run-editorial-tags-batch1.ts` — vocabulario libre real ya aplicado en
  producción (~108 tags: `date-night`, `en-antigua`, `cafe-especialidad`,
  `instagrameable`, `volumen-conversacional`, `joya-escondida`, etc.)

Antes de redactar un lote, si hace falta un tag que no está claro si ya se usó, `grep`
esos archivos en vez de inventar una variante nueva del mismo concepto (ej. no crear
`cocina-abierta-al-publico` si ya existe `cocina-abierta`).

## Proceso por lote

1. `npx tsx scripts/query-missing-descriptions.ts --limit 15` (o el subconjunto que
   pida Fredy) — trae id/nombre/zona/categoría/rating/tags/`reviews_snapshot`
   actuales.
2. Redactar cada `description` + tags nuevos aplicando las reglas de arriba (hecho vs.
   opinión sobre `reviews_snapshot`, nunca repetir zona/dirección). Si un lugar no
   tiene reviews suficientes para sacar nada concreto, se omite del lote — no se
   fuerza una descripción sin dato real detrás.
3. Mostrar el lote en una tabla en el chat. Ya no hace falta marcar con ⚠️ caso por
   caso (la regla de grounding ya filtra lo no verificable antes de escribirlo) —
   Fredy revisa el lote completo con su propio conocimiento de los lugares, como en
   la prueba de sesión 2026-07-17 (San Martín, La Estancia, Donde Joselito, Patsy,
   Saúl).
4. **Verificación independiente (obligatoria para lugares nuevos que Fredy no conoce
   de memoria — típicamente después de correr el importer de Google Places, ver
   ADR-014 y `project_roadmap_paused_items`):** escribir el batch a
   `scripts/data/descriptions-batch-NN.json` y despachar el agente
   `verificador-grounding` (`.claude/agents/verificador-grounding.md`) con la ruta del
   archivo. Este agente es una instancia nueva sin el sesgo de haber redactado el
   texto — vuelve a consultar `reviews_snapshot` por su cuenta vía
   `query-reviews-by-id.ts` y da un veredicto OK / REVISAR / RECHAZAR por lugar (ver
   el archivo del agente para el detalle del criterio, es el mismo hecho-vs-opinión de
   arriba). Cualquier id en RECHAZAR se reescribe o se saca del batch antes de aplicar.
   Para el lote actual de 371 lugares (todos zonas/lugares que Fredy conoce), la
   revisión humana directa en el paso 3 ya cumplió este rol y no hizo falta el agente
   — pero para volumen nuevo (importer pausado hoy por costo) este paso pasa a ser el
   control principal, porque Fredy no puede auditar de memoria un lugar que nunca
   visitó.
5. Con luz verde (de Fredy, o del agente si no hay RECHAZAR), correr
   `apply-place-descriptions.ts --file ... --dry` primero, después sin `--dry`.
6. Repetir desde el paso 1 hasta que `query-missing-descriptions.ts` devuelva 0
   pendientes.
