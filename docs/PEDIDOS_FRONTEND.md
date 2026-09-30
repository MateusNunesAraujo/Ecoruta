# Pedidos del diseño del frontend para Eliel

Cambios que el diseño necesita en archivos que no se tocan desde la rama
`feat/frontend-diseno` (JavaScript, `sw.js`, `manifest`, `config.js`,
backend). Cada pedido dice qué hacer, dónde y por qué.

Estado: ⏳ pendiente · ✅ hecho · ❌ cancelado

---

## ⏳ 1. Cachear la fuente en el Service Worker (Bloque 7)
- **Qué:** agregar `fuentes/NotoSans-ecoruta.woff2` a la lista de archivos
  que `sw.js` guarda en caché.
- **Por qué:** el texto en lenguas indígenas usa esa fuente. Sin la caché, en
  la versión web sin señal se vería con la fuente del sistema, y los acentos
  combinables (ṵ̈́, ü̃) pueden verse mal. En el APK no hace falta, porque el
  archivo va dentro de la app.

## ⏳ 2. Comprobar el modo oscuro en el APK (Bloque 8)
- **Qué:** al generar el APK, probarlo con el teléfono en modo oscuro. Si la
  app se ve clara, el tema de Android del proyecto de Capacitor debe ser
  "DayNight" (en `android/app/src/main/res/values/styles.xml`), para que el
  WebView informe `prefers-color-scheme: dark`.
- **Por qué:** el modo oscuro es solo CSS (`prefers-color-scheme`); en la web
  ya funciona, pero en el APK depende del tema de la app nativa.

## ⏳ 3. Pantalla de Ajustes con selector de tema (claro / oscuro / automático)
- **Qué:** una pantalla `#/ajustes`, 5.ª opción del menú, donde el turista
  elige Automático, Claro u Oscuro. La elección se guarda en el navegador.
- **Por qué:** el modo oscuro hoy solo sigue al dispositivo. Hay personas que
  lo quieren distinto (por ejemplo, oscuro de noche en el río aunque el
  teléfono esté en claro).
- **Ya está hecho en `feat/frontend-diseno`:** todo el CSS (atributo
  `data-tema` en `<html>`, menú que se adapta a 5 opciones, estilos de
  `.grupo-opciones` / `.opciones` / `.opcion`) y los textos en es/en/pt
  (`nav.ajustes`, `ajustes.*`). Solo falta el JavaScript de abajo.
- **Probado:** en una copia del frontend con este mismo código (Edge, 360 px,
  dispositivo en claro y en oscuro): cambia al tocar, se recuerda al volver a
  abrir, "Automático" vuelve a seguir al dispositivo y la barra del
  navegador toma el color correcto.
- Si el Service Worker lista los archivos a cachear, agregar `js/tema.js` y
  `js/vistas/ajustes.js`.

### 3.1 Archivo nuevo `frontend/www/js/tema.js`
```js
// Tema de colores elegido por el turista en Ajustes.
// 'auto' sigue al dispositivo; 'claro' y 'oscuro' lo fijan. El CSS lee el
// atributo data-tema de <html> (sin atributo = automático).

const CLAVE_TEMA = 'ecoruta.tema';
export const TEMAS = ['auto', 'claro', 'oscuro'];

// Color de la barra del navegador en Android (igual a --cabecera-fondo).
const COLOR_BARRA = { claro: '#1f5f3f', oscuro: '#173d2a' };

export function tema() {
  try {
    const guardado = localStorage.getItem(CLAVE_TEMA);
    return TEMAS.includes(guardado) ? guardado : 'auto';
  } catch {
    return 'auto'; // Almacenamiento bloqueado.
  }
}

export function aplicarTema(valor = tema()) {
  const raiz = document.documentElement;
  if (valor === 'auto') raiz.removeAttribute('data-tema');
  else raiz.dataset.tema = valor;
  // index.html trae un theme-color para cada modo del dispositivo; si el
  // turista fijó uno, ambos toman ese color.
  for (const meta of document.querySelectorAll('meta[name="theme-color"]')) {
    const propio = meta.media.includes('dark') ? COLOR_BARRA.oscuro : COLOR_BARRA.claro;
    meta.content = valor === 'auto' ? propio : COLOR_BARRA[valor];
  }
}

export function cambiarTema(valor) {
  if (!TEMAS.includes(valor)) return;
  try {
    localStorage.setItem(CLAVE_TEMA, valor);
  } catch {
    // Almacenamiento bloqueado: el tema dura hasta cerrar la página.
  }
  aplicarTema(valor);
}
```

### 3.2 Archivo nuevo `frontend/www/js/vistas/ajustes.js`
```js
import { el, vaciar } from '../dom.js';
import { t } from '../i18n.js';
import { cambiarTema, tema, TEMAS } from '../tema.js';

// #/ajustes -> preferencias guardadas en este navegador (por ahora, el tema).
export function vistaAjustes(contenedor) {
  const actual = tema();
  const opcion = (valor) =>
    el(
      'label',
      { class: 'opcion' },
      el('input', {
        type: 'radio',
        name: 'tema',
        value: valor,
        checked: valor === actual,
        onChange: () => cambiarTema(valor),
      }),
      el('span', {}, t(`ajustes.tema.${valor}`)),
    );
  vaciar(
    contenedor,
    el(
      'section',
      { class: 'ajustes' },
      el('h1', {}, t('ajustes.titulo')),
      el(
        'fieldset',
        { class: 'grupo-opciones' },
        el('legend', {}, t('ajustes.apariencia')),
        el('div', { class: 'opciones' }, TEMAS.map(opcion)),
      ),
      el('p', { class: 'nota' }, t('ajustes.tema.ayuda')),
    ),
  );
}
```

### 3.3 Cambios en `frontend/www/js/app.js` (6 líneas nuevas, ninguna borrada)
```diff
 import { cambiarIdioma, idioma, IDIOMAS, iniciarIdioma, t } from './i18n.js';
+import { aplicarTema } from './tema.js';
+import { vistaAjustes } from './vistas/ajustes.js';
 import { vistaChat } from './vistas/chat.js';
```
```diff
   [/^\/reservas$/, vistaMisReservas, 'inicio'],
+  [/^\/ajustes$/, vistaAjustes, 'ajustes'],
 ];
```
```diff
     enlace('#/lenguas', 'lenguas', '🗣️', t('nav.lenguas')),
+    enlace('#/ajustes', 'ajustes', '⚙️', t('nav.ajustes')),
   );
```
```diff
+aplicarTema();
 iniciarIdioma();
 dibujarMarco();
```

### 3.4 Cambio en `frontend/www/index.html` (dentro de `<head>`, antes del CSS)
Evita que al abrir la app se vea un instante el otro modo antes de que cargue
`app.js`.
```html
    <script>
      // Aplica el tema guardado en Ajustes antes de dibujar la página, para
      // que no se vea un destello del otro modo al abrirla.
      try {
        var tema = localStorage.getItem('ecoruta.tema');
        if (tema === 'claro' || tema === 'oscuro') document.documentElement.dataset.tema = tema;
      } catch (e) {}
    </script>
    <link rel="stylesheet" href="css/estilos.css" />
```

## ❌ 4. (Cancelado) Lema de la cabecera desde i18n.js
- **Cancelado el 2026-09-30:** el lema se quitó de la cabecera. No hay que
  hacer nada.
- **Qué:** hoy el lema de PC ("La IA conversa, la comunidad es dueña de su
  palabra") sale de `.marca::after` en el CSS, con una regla `:lang()` por
  idioma. Si se quiere tener todos los textos en `i18n.js`: en `app.js`,
  agregar dentro del enlace `.marca` un `el('span', { class: 'lema' }, t('app.lema'))`,
  cambiar el valor de `app.lema` en los tres idiomas por el lema nuevo, y
  avisar para cambiar `.marca::after` por `.lema` en el CSS.
- **Por qué:** así los traductores encuentran todos los textos en un solo
  archivo. Mientras tanto, la versión en CSS funciona bien.

## ⏳ 5. Palabra indígena destacada en la portada (desde la base de datos)
- **Qué:** el diseño de la portada lleva arriba del título grande una palabra
  en lengua indígena, en naranja. Por la regla 1 de CLAUDE.md no se puede
  escribir a mano en el CSS ni en el HTML: debe venir de una ficha
  `VERIFICADA` de `/api/cultural`.
- **Cómo:** en `vistas/inicio.js`, pedir una ficha verificada (por ejemplo,
  un saludo) y, si existe, agregar como primer hijo de `section.portada`:
  `el('p', { class: 'portada-palabra', lang: <código ISO de la lengua> }, ficha.textoOriginal)`,
  con un enlace a `#/lenguas/<lengua>` o su atribución (fuente y comunidad).
  Si no hay conexión o no hay fichas verificadas, no se muestra nada.
- **Pendiente de diseño:** cuando exista, se agrega el estilo de
  `.portada-palabra` (naranja `--tierra`, fuente `--fuente-lenguas`, grande).
- **Antes:** el equipo debe confirmar qué palabra es la de la imagen del
  diseño, con su fuente y comunidad, y cargarla como ficha verificada.

## ⏳ 6. Itinerario como línea de tiempo con foto, duración, precio y Reservar
- **Qué:** que la tarjeta de itinerario del chat muestre, por cada día, los
  bloques "☀️ Mañana · 06:30" y "🌇 Tarde · 14:00", y en cada bloque: foto,
  nombre, emprendimiento, duración, precio por persona y un botón
  **Reservar** que lleva a `#/experiencia/<id>` (donde está el formulario de
  disponibilidad y reserva).
- **Ya está hecho en `feat/frontend-diseno`:** todo el CSS (línea de tiempo,
  bloques, foto o relleno si no hay foto, diseño angosto/ancho con
  `@container`) y los textos `iti.manana`, `iti.tarde`, `iti.reservar` en
  es/en/pt. Con el CSS, el formato actual (solo texto) ya se ve como línea
  de tiempo; lo de abajo agrega foto, duración, precio y Reservar.
- **Probado:** en una copia del frontend con este mismo código y datos de
  ejemplo, a 360 y 900 px, claro y oscuro. Los botones Reservar miden 44 px,
  llevan `aria-label` con el nombre de la experiencia y abren
  `#/experiencia/<id>`.

### 6.1 Frontend: reemplazar `tarjetaItinerario` en `frontend/www/js/tarjetas.js`
No cambia su firma ni dónde se llama (`case 'itinerario'`). Usa `precio` y
`duracion`, que `tarjetas.js` ya importa de `i18n.js`.
```js
// Itinerario como línea de tiempo: cada día con sus bloques de mañana y
// tarde; cada bloque con foto, duración, precio y botón Reservar.
export function tarjetaItinerario(dias) {
  return el(
    'article',
    { class: 'tarjeta tarjeta-itinerario' },
    el('h3', {}, t('iti.titulo')),
    el(
      'ol',
      { class: 'iti-dias' },
      dias.map((d) =>
        el(
          'li',
          { class: 'iti-dia' },
          el('h4', { class: 'iti-dia-titulo' }, t('iti.dia', { n: d.dia })),
          el('ol', { class: 'iti-bloques' }, d.experiencias.map(bloqueItinerario)),
        ),
      ),
    ),
  );
}

function bloqueItinerario(experiencia) {
  const e = normalizarExperiencia(experiencia);
  // Igual que el backend (armar_itinerario): sale antes de las 12:00 = mañana.
  const manana = (e.horaSalida ?? '00:00') < '12:00';
  const valor = precio(e.precioCop);
  const tiempo = duracion(e.duracionMinutos);
  return el(
    'li',
    { class: `iti-bloque ${manana ? 'iti-manana' : 'iti-tarde'}` },
    el(
      'p',
      { class: 'iti-momento' },
      t(manana ? 'iti.manana' : 'iti.tarde'),
      e.horaSalida ? ` · ${e.horaSalida}` : null,
    ),
    el(
      'div',
      { class: 'iti-experiencia' },
      e.foto
        ? el('img', { class: 'iti-foto', src: e.foto, alt: '', loading: 'lazy' })
        : el('span', { class: 'iti-foto sin-foto', 'aria-hidden': 'true' }),
      el(
        'div',
        { class: 'iti-info' },
        el('a', { class: 'iti-nombre', href: `#/experiencia/${e.id}` }, e.nombre),
        el('p', { class: 'tarjeta-sub' }, e.emprendimiento, e.comunidad ? ` · ${e.comunidad}` : null),
        tiempo || valor
          ? el(
              'p',
              { class: 'iti-meta' },
              tiempo ? `⏱ ${tiempo}` : null,
              tiempo && valor ? ' · ' : null,
              valor ? el('strong', {}, valor.cop) : null,
              valor ? ` ${t('exp.porPersona')}` : null,
            )
          : null,
      ),
      el(
        'a',
        {
          class: 'boton iti-reservar',
          href: `#/experiencia/${e.id}`,
          'aria-label': `${t('iti.reservar')}: ${e.nombre}`,
        },
        t('iti.reservar'),
      ),
    ),
  );
}
```

### 6.2 Frontend: `normalizarExperiencia` (mismo archivo), agregar la foto
Para cuando la experiencia viene completa de la API (no del agente):
```diff
     longitud: e.longitud,
+    foto: e.emprendimiento?.fotos?.[0] ?? null,
   };
```

### 6.3 Backend: foto en el resumen (`backend/src/agente/tarjetas.ts`)
Hoy `ResumenExperiencia` no trae foto; las fotos están en
`Emprendimiento.fotos`. Agregar la primera:
```diff
 export interface ResumenExperiencia {
   ...
   longitud: number | null;
+  foto: string | null;
 }
```
```diff
     longitud: experiencia.longitud,
+    foto: experiencia.emprendimiento?.fotos?.[0] ?? null,
   };
```
- ⚠️ Revisar qué guarda `fotos` (viene del Excel con `fila.lista('fotos')`):
  si son nombres de archivo y no URLs, `foto` debe ser la ruta que sirve el
  frontend (por ejemplo `fotos/<archivo>`). Si no hay foto, se muestra un
  relleno de colores con una canoa.
- La foto no pasa por el LLM (`paraLlm` no la incluye), solo va a la tarjeta.
