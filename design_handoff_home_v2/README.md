# Handoff: GuateLive Home v2

## Overview
Rediseño completo de la homepage de GuateLive con dirección visual "vibrante/festiva". Sustituye el layout actual (grid uniforme de cards) por secciones con lenguajes visuales distintos entre sí: boletos, sticker wall, cupones perforados. Mantiene el logo GuateLive y la base de color rojo/negro/blanco del sitio actual, añadiendo un acento verde lima.

## About the Design Files
Los archivos de este bundle son **referencias de diseño creadas en HTML** — prototipos que muestran la apariencia y el comportamiento deseados, no código de producción para copiar directamente.

La tarea es **recrear estos diseños en el entorno existente del codebase** (React, Vue, Next, etc.) usando sus patrones y librerías establecidas. Si no existe todavía un entorno, elegir el framework más apropiado e implementar ahí.

`home-guatelive-v2-standalone.html` es un archivo autocontenido: se abre en cualquier navegador sin servidor y sirve como referencia visual ejecutable. La carpeta `source/` contiene el archivo fuente original.

## Fidelity
**High-fidelity (hifi).** Colores, tipografía, espaciado e interacciones son finales. Recrear la UI de forma fiel usando las librerías y patrones existentes del codebase.

## Screens / Views

### Home (única pantalla en este bundle)
**Purpose:** punto de entrada — el usuario descubre qué hacer en Guatemala hoy: busca, explora eventos, actividades y promos, y se suscribe al newsletter.

**Layout general:**
- Contenedor: `max-width: 1400px`, centrado (`margin: 0 auto`)
- Padding horizontal: `40px` desktop / `22px` mobile
- Breakpoint único: `860px` (por debajo = mobile)

---

#### 1. Header
- Flex row, `space-between`, `align-items: center`, padding `24px 40px`
- **Logo:** "Guate" + "Live". Bricolage Grotesque 800, `24px`, `letter-spacing: -0.01em`. "Guate" en `#111111`, "Live" en `#d81e2c`
- **Nav derecha:** flex, `gap: 12px`
  - Pill "Ediciones": borde `2px solid #111`, `border-radius: 999px`, padding `8px 18px`, `14px`/700. Incluye punto de `7px` `#c8e64e` a la izquierda
  - Pill "Promos": fondo `#111`, texto `#fff`, mismas medidas

#### 2. Hero (split diagonal)
- Grid `1.1fr 0.9fr` desktop / `1fr` mobile. `overflow: hidden`
- **Columna izquierda** (padding `20px 40px 40px 0`):
  - Eyebrow: "● TODO LO QUE PASA EN GUATE, EN UN SOLO LUGAR" — `#d81e2c`, `13px`/700, `letter-spacing: 0.06em`
  - H1: "¿Qué hacemos **hoy** en Guate?" — Bricolage Grotesque 800, `54px` desktop / `38px` mobile, `line-height: 1.0`. "hoy" en `#d81e2c`
  - Subtítulo: "Encuentra cafés, restaurantes y cosas que hacer." — `#555555`, `18px`
  - Contador: pill `#c8e64e` con "126" (800) + " planes activos en Guate" — `14px`/600
  - **Bubble search:** `max-width: 520px`, fondo `#f4f4f4`, borde `2px solid #111`, `border-radius: 999px`, padding `14px 22px`. Ícono lupa + placeholder "Busca cafés, restaurantes, eventos..." en `#777777`, `15px`
- **Columna derecha:**
  - `background: #d81e2c`, altura `420px` desktop / `260px` mobile, `overflow: hidden`
  - `clip-path: polygon(12% 0, 100% 0, 100% 100%, 0 100%)` desktop — corte diagonal en el borde izquierdo
  - `clip-path: polygon(0 8%, 100% 0, 100% 100%, 0 100%)` mobile
  - Imagen a `opacity: 0.92` dentro de un wrapper `position: absolute; inset: 0`
  - Sticker "¡ESTA SEMANA!": absoluto `top: 24px; right: 24px`, fondo `#c8e64e`, texto `#111`, Bricolage 800 `14px`, padding `10px 16px`, `border-radius: 10px`, `transform: rotate(6deg)`, `box-shadow: 0 8px 18px rgba(0,0,0,0.25)`

#### 3. Ticker marquee
- Banda `background: #111`, padding `12px 0`, `overflow: hidden`, `white-space: nowrap`
- `margin-top: 48px` desktop / `32px` mobile
- Contenido duplicado dos veces, animación `marquee 22s linear infinite` (`translateX(0)` → `translateX(-50%)`)
- Texto `14px`/700, `letter-spacing: 0.04em`. Categorías alternando `#fff` y `#c8e64e`, separadas por `•`:
  MÚSICA EN VIVO · GASTRONOMÍA · FESTIVALES · PROMOS DE HOY · VIDA NOCTURNA · ACTIVIDADES FAMILIARES · DEPORTES

#### 4. Eventos
Encabezado de sección (patrón repetido en todas): título Bricolage 800 `26px` a la izquierda, link "Ver todos →" `#d81e2c` `14px`/700 a la derecha, `margin-bottom: 22px`.

**Desktop — bento grid:**
- `grid-template-columns: 1.3fr 1fr 1fr`, dos filas, `gap: 16px`
- Card destacada ocupa `grid-column: 1 / grid-row: 1 / 3`: fondo `#141414`, `border-radius: 10px`. Imagen flexible arriba, bloque de texto abajo con padding `20px`: título Bricolage 800 `23px` `#fff`, meta `#bbb` `13px`, tags pill `#222`/`#ccc` `11px`, CTA "Ver detalles →" `#d81e2c` `13px`/700
- 4 cards secundarias (`grid-column: 2|3`, `grid-row: 1|2`): imagen `150px` + texto padding `14px`, título Bricolage 700 `15px`, meta `11px`
- Indicador de páginas debajo: dos barras `3px × 36px` — activa `#d81e2c`, inactiva `#eee`
- Controles ‹ › circulares `32px`, borde `2px solid #111`, junto al link "Ver todos"

**Mobile — carrusel de boletos:**
- Flex row, `gap: 24px`, `overflow-x: auto`, `scroll-snap-type: x mandatory`
- Card: `72vw` (max `300px`), altura `380px`, `box-sizing: border-box`, `border-radius: 12px`, `box-shadow: 0 6px 16px rgba(0,0,0,0.12)`, `scroll-snap-align: center`
- Estructura tipo boleto: imagen (56% de la altura, `flex-shrink: 0`) → **línea de perforación** (`border-top: 2px dashed #333` con dos círculos blancos de `18px` sobresaliendo a los lados, `left/right: -10px`) → bloque de texto `#141414` (`flex: 1`)
- Badge de categoría absoluto `top/left: 10px`, `11px`/700, `border-radius: 4px`

#### 5. Actividades (sticker wall)
- Flex row, `gap: 32px` desktop / `20px` mobile, `overflow-x: auto`, `align-items: flex-start`, padding vertical `16px`
- Card: ancho `250px` desktop / `220px` mobile, fondo `#fff`, `border: 1px solid #eee`, `border-radius: 4px`, `box-shadow: 0 8px 20px rgba(0,0,0,0.1)`
- **Cinta adhesiva:** div absoluto `top: -10px`, centrado con `translateX(-50%) rotate(-3deg)`, `56px × 20px`, `rgba(200,230,78,0.85)`, `box-shadow: 0 2px 4px rgba(0,0,0,0.15)`
- Imagen `150px` con padding `10px 10px 0`; texto padding `12px 14px 16px`: título Bricolage 700 `16px`, meta `#777` `12px`, precio `#d81e2c` 800 `14px`
- Placeholder de card vacía: `border: 2px dashed #d0d0d0`, altura `220px`, texto "+ Próxima actividad" `#b0b0b0` `13px` centrado

#### 6. Promos (cupones)
- Flex row, `gap: 20px`, `overflow-x: auto`, `scroll-snap-type: x mandatory`, `cursor: grab`
- Card `320px` desktop / `270px` mobile, altura `340px`, `border-radius: 12px`
- Estructura: imagen (56%) → **línea de cupón** → bloque de texto `#141414`
- Línea de cupón: dos segmentos `border-top: 2px dashed #333` con círculos blancos de `16px` (`margin: 0 -8px`) y, al centro, badge de descuento: fondo `#c8e64e`, texto `#111`, Bricolage 800 `18px`, padding `8px 14px`, `border-radius: 8px`, `transform: rotate(-4deg)`, `box-shadow: 0 4px 10px rgba(0,0,0,0.15)`
- Badge de banco (si existe): absoluto `top/right: 10px`, fondo `#fff`, `#333`, `10px`/700
- Controles ‹ › circulares `34px`, borde `2px solid #111`; scroll programático de `340px` por click

#### 7. Editorial
- Panel `background: #111`, `border-radius: 16px`, padding `44px` desktop / `28px 22px` mobile
- Grid `1fr 1fr` desktop / `1fr` mobile, `gap: 32px`, `align-items: center`
- **Izquierda:** eyebrow "EDICIÓN Nº 3" `#c8e64e` `12px`/700 `letter-spacing: 0.08em`; título "¿Qué hacemos hoy?" Bricolage 800 `34px` `#fff`; sticker "Hoy: San Martín" fondo `#fff` texto `#111` Bricolage 800 `20px` `border-radius: 6px` `rotate(-2deg)`; descripción `#bbb` `15px`; CTA pill `#d81e2c` `#fff` 700 `14px` padding `12px 22px` `border-radius: 999px`
- **Derecha:** tres imágenes en flex row, `gap: 14px`, altura `280px` desktop / `160px` mobile, `border-radius: 10px`, rotadas `-2deg`, `1.5deg`, `-1deg`

#### 8. Newsletter
- Panel `background: #111`, `border-radius: 16px`, padding `48px 32px`, centrado, `position: relative`, `overflow: hidden`
- Círculo decorativo: absoluto `top: -30px; right: 40px`, `90px`, `border-radius: 50%`, `#c8e64e` a `opacity: 0.15`
- Eyebrow "NEWSLETTER" `#c8e64e` `12px`/700; título Bricolage 800 `24px` `#fff`
- Form: flex `gap: 10px`, `max-width: 460px`. Input transparente con `border-bottom: 2px solid #444`, texto `#fff` `15px`, sin outline. Botón "SUSCRIBIRME" fondo `#c8e64e`, texto `#111`, 800 `13px`, padding `12px 22px`, `border-radius: 8px`

#### 9. Footer
- `border-top: 1px solid #eee`, padding `56px 40px`
- Grid `1.4fr 1fr` desktop / `1fr` mobile, `gap: 40px`
- **Izquierda:** logo Bricolage 800 `22px` + tagline "Todo lo que pasa en Guate, en un solo lugar." `#777` `14px`
- **Derecha:** encabezado "ZONAS" `#999` `12px`/700 `letter-spacing: 0.08em`; lista en flex column `gap: 10px`, links `#333` `14px`, `text-decoration: none`. Items: Antigua, Carretera a El Salvador, Zona 15, Zona 14, Zona 4, Cayalá

---

## Interactions & Behavior

**Tilt 3D en hover (Eventos mobile, Actividades):**
- `onMouseMove`: calcula posición relativa del cursor (`x`, `y` normalizados a `-0.5…0.5`) y aplica
  `transform: perspective(900px) rotateY(x*8deg) rotateX(-y*8deg) scale(1.03)`
- `box-shadow` cambia a `0 20px 40px rgba(0,0,0,0.25)`, `z-index: 5`
- `onMouseLeave`: resetea transform, shadow y `z-index: 1`
- Transición: `transform 0.25s ease, box-shadow 0.25s ease`

**Modal de expansión:** click en cualquier card abre un overlay `rgba(0,0,0,0.65)` centrado, panel `#141414` de `max-width: 560px`, `border-radius: 14px`. Imagen `260px` arriba, luego badge de categoría, botón de cierre ×, título Bricolage 800 `25px`, meta `#bbb` `14px`, descripción `#ccc` `14px` `line-height: 1.55`, CTA `#c8e64e` 700 `14px`. Cierra con click en el overlay o en ×; el click dentro del panel hace `stopPropagation`.

**Drag horizontal en Promos:** `onMouseDown` guarda `pageX` y `scrollLeft`; `onMouseMove` aplica `scrollLeft = inicial - delta`; `onMouseUp`/`onMouseLeave` termina el arrastre.

**Marquee:** animación CSS infinita, sin JS.

**Responsive:** listener de `resize` que conmuta el flag `isMobile` en el breakpoint de `860px`. Eventos cambia de bento grid a carrusel; el resto de secciones ajusta anchos y alturas.

**Nota:** los controles ‹ › de Eventos son visuales en el prototipo (sin handler); los de Promos sí hacen scroll.

## State Management
- `isMobile: boolean` — derivado de `window.innerWidth < 860`, actualizado en `resize`
- `expanded: { kind: 'evento'|'actividad'|'promo', item } | null` — card abierta en el modal

Los datos están hardcodeados en el prototipo (arrays `eventosBase`, `actividadesBase`, `promosBase`). En producción vendrán de la API: eventos con `badge`, `title`, `date`, `venue`, imagen; actividades con `title`, `price`, `meta`; promos con `discount`, `bank`, `title`, `summary`, `desc`.

## Design Tokens

**Colores**
| Token | Valor | Uso |
|---|---|---|
| Rojo marca | `#d81e2c` | Acentos, CTAs, "Live", highlights |
| Negro | `#111111` | Texto principal, paneles, pills |
| Negro card | `#141414` | Fondo de bloques de texto en cards |
| Blanco | `#ffffff` | Fondo de página y cards |
| Lima acento | `#c8e64e` | Stickers, badges de descuento, acentos sobre negro |
| Gris texto | `#555555` | Cuerpo de texto |
| Gris secundario | `#777777` | Texto terciario, placeholders |
| Gris meta | `#999999` | Labels de sección |
| Gris sobre negro | `#bbbbbb` | Meta en cards oscuras |
| Gris borde | `#eeeeee` | Bordes y divisores |
| Gris fondo | `#f4f4f4` | Fondo de search y chips |
| Dashed | `#333333` | Líneas de perforación |

Badges de categoría: MÚSICA `#dbe7fb`/`#1d4ed8` · DEPORTES `#e8dcc4`/`#6b4a1f` · FAMILIAR `#f4ead9`/`#7a5a2c` · GRATIS `#1f7a3d`/`#fff`

**Tipografía**
- Display: **Bricolage Grotesque** (Google Fonts, 400–800) — títulos, logo, números destacados
- UI: **Inter** (400, 500, 600, 700) — cuerpo, meta, labels
- Escala: `54px` (H1) · `38px` (H1 mobile) · `34px` (editorial) · `26px` (sección) · `24px` (newsletter/logo) · `23px` (card destacada) · `18px` (subtítulo/descuento) · `16px` (card título) · `15px` (card secundaria) · `14px` (UI/links) · `13px` (meta) · `12px` (eyebrow) · `11px` (badge/tag) · `10px` (badge pequeño)

**Espaciado:** `6 · 8 · 10 · 12 · 14 · 16 · 20 · 22 · 24 · 32 · 40 · 48 · 56` px

**Border radius:** `4px` (badges, sticker cards) · `6px` (sticker editorial) · `8px` (botón, badge descuento) · `10px` (cards bento, imágenes editorial) · `12px` (cards carrusel) · `14px` (modal) · `16px` (paneles) · `999px` (pills) · `50%` (círculos)

**Sombras:** `0 4px 10px rgba(0,0,0,0.15)` · `0 6px 16px rgba(0,0,0,0.12)` · `0 8px 18px rgba(0,0,0,0.25)` · `0 8px 20px rgba(0,0,0,0.1)` · `0 20px 40px rgba(0,0,0,0.25)` (hover)

**Rotaciones:** `-4deg` (badge descuento) · `-3deg` (cinta) · `-2deg`/`1.5deg`/`-1deg` (imágenes editorial) · `-2deg` (sticker editorial) · `6deg` (sticker hero)

**Breakpoint:** `860px`

## Assets
Todas las imágenes son **placeholders** en el prototipo — no hay imágenes reales incluidas. Cada slot indica en su texto qué foto va ahí:
- Hero: "momento festivo en Guate"
- Eventos: fotos de Miguel Mateos & Vilma Palma, Hyrox Party, Festival de Marimba (×2), Festival de la Mujer Tecniscan
- Actividades: foto de la actividad
- Promos: foto de la promoción
- Editorial: plato del día, bebida, mesa

Se necesitan las imágenes reales del CMS/API. Los íconos son emoji (🔍 📍 🕐 📞) — sustituir por el set de íconos del codebase.

Fuentes vía Google Fonts:
`https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Inter:wght@400;500;600;700&display=swap`

## Files
- `home-guatelive-v2-standalone.html` — versión autocontenida, se abre directamente en el navegador. **Empezar por aquí.**
- `source/Home Guatelive v2.dc.html` — archivo fuente original con el markup y la lógica separados
- `source/support.js`, `source/image-slot.js` — runtime del prototipo. No son parte del diseño; no portar al codebase.

## Pantallas relacionadas (no incluidas en este bundle)
El proyecto tiene otras dos pantallas en el mismo lenguaje visual v2, disponibles si se necesitan: resultados de búsqueda (grid de lugares con chips de filtro) y detalle de lugar (galería, tags, reseñas, horarios).
