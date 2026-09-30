# Pedidos del diseño del frontend para Eliel

Cambios que el diseño necesita en archivos que no se tocan desde la rama
`feat/frontend-diseno` (JavaScript, `sw.js`, `manifest`, `config.js`,
backend). Cada pedido dice qué hacer, dónde y por qué.

Estado: ⏳ pendiente · ✅ hecho

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
