---
description: Cura una burbuja/ocasión de la búsqueda del home (Con mi perro, Plan familiar, Cita romántica, Salir de fiesta…) con evidencia verificada — usar al curar una burbuja nueva o existente, y después de cada corrida del importer de Google Places para taggear los lugares nuevos
---

# Curar burbuja: $ARGUMENTS

Método armado en las sesiones 2026-10-22/23 (perro, fiesta, drinks/café, familiar,
cenar, cita romántica) y aprobado por Fredy como el estándar. Principio en
`docs/decisions.md` ADR-027: un tag de ocasión significa **"verificado por GuateLive"**.
Mostrar algo equivocado le quita más confianza a la app que mostrar poco.

La burbuja es un mapeo en `components/home/bubble-search.tsx`:
- `TAG_MAP[burbuja]`: tags que dan el **resultado principal** (solo verificados).
- `RELATED_TAG_MAP[burbuja]`: tags para **"También te podría interesar"** (plausible, sin confirmar).
- `RELATED_EXCLUDED_TAGS`: un lugar con estos tags nunca es sugerencia.

## 1. Definir la burbuja con Fredy (antes de tocar datos)

Preguntar qué significa el plan, con ejemplos de lugares que él conoce. Decisiones que ya
salieron así:
- **Amplia vs. curada:** si el plan tiene una versión genérica y una exigente, se separa en
  dos burbujas ("Tomar algo" → Drinks + Un café; "Cenar" → Cenar + Cita romántica).
- **Exclusiones duras:** Plan familiar nunca es bar ni discoteca; Cita romántica no es café
  ni comida casual; Salir de fiesta = discotecas y bares de shots, no restaurantes con música.
- Una burbuja que devuelve casi todos los lugares no sirve (Tomar algo llegó a 317 de 372).
  La especificidad es lo que suma.

## 2. Auditar el vocabulario de tags primero

Antes de armar el mapeo, listar **todos** los tags existentes en `places` y buscar
sinónimos. Error real: Plan familiar mapeaba `familia`/`ninos` pero no `apto-para-ninos`,
y La Finka (CAES) quedaba afuera. Otros sinónimos encontrados: `vinoteca` (Drinks),
`panaderia-cafeteria` (Café). Revisar también qué significa cada tag de verdad:
`bar-completo` es el `serves_beer` de Google (lo tiene casi todo restaurante), no "es un bar".

## 3. Usar el dato de Google si existe (no hace falta curar)

Si Google ya responde la pregunta, se usa directo (son hechos, tipo 1 de ADR-027):
- Cenar = `google_attributes.serves_dinner = true` → tag `cena` (291 lugares sin curar nada).
- `primary_category` (Café, Bar) para detectar lugares sin tag (ej. 6 cafés sin `cafe`).
- La API nueva de Google (allowsDogs, goodForChildren, servesCocktails, liveMusic) daría más
  datos así, pero Fredy decidió no usarla todavía (costo y complejidad). No proponerla de
  nuevo sin que él lo pida.

## 4. Filtro duro + extracción de evidencia

1. Aplicar las exclusiones del paso 1 (ej. sin bares/discotecas para Familiar).
2. De `reviews_snapshot` y `description`, sacar las **oraciones completas** que mencionan el
   plan (regex amplio: niños/hijos/juegos/menú infantil; cita/pareja/aniversario/romántico;
   perro/mascota/pet). Guardar a un archivo y **leer cada una en contexto**.
3. Ojo con las menciones negativas: "no es apropiado ir con niños", "dice familiar, no lo
   es", "no dejaron entrar al perro". Buscar la palabra no alcanza.

## 5. Clasificar en tres niveles

| Nivel | Criterio | Destino |
|---|---|---|
| ✅ Verificado | instalación específica (área de juegos, menú/sillas para niños, área pet friendly) o reseña que lo recomienda **explícitamente** para el plan; o 2+ fuentes web independientes; o Fredy lo confirma | tag del plan → resultado principal |
| 🟡 Plausible | mención genérica ("para ir con amigos o familia", "ambiente familiar", "ocasión especial") o tags del lote viejo sin respaldo | sugerencia (vía `RELATED_TAG_MAP`) o queda para Fredy |
| ❌ Descartado | evidencia en contra, o la mención no tiene que ver (quejas de servicio con "mi esposa") | nada |

Presentar a Fredy una tabla **por nivel, con la evidencia citada** (lugar, zona, frase
corta). Nunca escribir en la DB antes de que la apruebe.

## 6. Investigación web para los 🟡 / ⚠️

- Buscar **cada lugar por separado**, no solo listas generales.
- **Fuentes independientes:** varios resultados que repiten la misma lista (ej. Degusta)
  cuentan como **una** fuente.
- Lo mejor es la fuente primaria: menú oficial (Pappy's tiene sección kids en
  bbqguate.com), página del lugar, guías locales con fecha.
- **Desconfiar de los resúmenes del buscador:** un resultado dijo que Tony Roma's tenía
  "Jr. plates" en Guatemala; era de sus locales en otros países y el menú real no tenía.
  Confirmar abriendo la fuente.
- Fuentes viejas o de turismo pueden listar lugares cerrados: marcar "por confirmar".
- Lo que se encuentre que **no está en la DB** va a Notion (Roadmap & Tasks, Backlog,
  Producto) con fuentes, no se pierde.

## 7. Evidencia de Fredy

- Lo que Fredy conoce de primera mano cuenta como verificado (ADR-027). Igual con lo que
  cuente alguien de su confianza con experiencia propia (ej. Marianela, pet friendly).
- Un dato de **cadena** aplica a todas sus sucursales publicadas (Patsy y San Martín tienen
  menú infantil → todas son familiares).
- Si Fredy confirma algo que la web no respalda, gana Fredy.

## 8. Aplicar

- **Respaldo antes de escribir:** `supabase/backups/{fecha}-{tema}.json` con `id`, `name` y
  `tags_antes` (o los ids, si es un tag nuevo masivo). Se commitea con la rama.
- Buscar cada lugar por `name` exacto y abortar si no hay exactamente 1 match.
- No borrar lugares: los que no son restaurantes/cafés/bares se **despublican**
  (`is_published = false`) con respaldo.
- Actualizar `TAG_MAP` / `RELATED_TAG_MAP` en `bubble-search.tsx` con un comentario del
  criterio y la fecha. `npx tsc --noEmit -p .` antes de commitear.
- Verificar contra la DB: total del plan y conteo por zona.

## 9. Cerrar

- Cobertura por zona contra la meta de Fredy: **5 lugares por plan en cada zona**,
  priorizando las 8 zonas núcleo (Antigua, Z10, Z14, Z15, Z4, Cayalá, Z1, CAES).
- Revisar que **ningún lugar publicado quede fuera de todas las burbujas** (limbo).
- Zonas: Cayalá es zona propia y Zona 16 la incluye (`lib/zone-hierarchy.ts`); Dinamia y
  Lirios de Cayalá son Zona 16.
- Anotar en `docs/historial-sesiones.md` y, si cambió el criterio, en ADR-027.

## Después de correr el importer de Google Places

Los lugares nuevos llegan solo con tags de Google (cocina, servicios, `bar-completo`).
Para cada lote:
1. Paso 3: tags derivados de datos de Google (`cena`, `cafe` por `primary_category`).
2. Pasos 4–8 para cada burbuja curada, solo sobre los lugares nuevos.
3. Revisar el limbo: un lugar nuevo sin ninguna burbuja es una falla.
4. Despublicar lo que no sea restaurante/café/bar (centros comerciales, residenciales,
   lugares de eventos entraron así en el import anterior).

## Estado de las burbujas (2026-10-23)

| Burbuja | Principal | Sugerencia |
|---|---|---|
| Desayuno | desayuno (serves_breakfast de Google) | — |
| Brunch | brunch (curado; el brunch de Google se quitó) + tag `mimosas` informativo | — |
| Almuerzo | almuerzo, restaurante | — |
| Cenar | cena (serves_dinner) | restaurantes sin el dato |
| Drinks | bar, coctelería, cerveza artesanal, vinoteca | — |
| Un café | cafe, cafe-especialidad, bar-de-cafe, panaderia-cafeteria | — |
| Trabajar | para-trabajar, laptop-friendly | cafés |
| Con mi perro | pet-friendly | — |
| Plan familiar | familia, ninos, apto-para-ninos, domingo-en-familia | restaurantes sin bar |
| Salir de fiesta | salir-de-fiesta, night_club | — |
| Cita romántica | cita-romantica (47: 20 con evidencia explícita + 27 probables aprobados por Fredy) | — |
