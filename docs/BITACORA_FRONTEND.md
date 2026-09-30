# Bitácora del diseño del frontend — Ecoruta Conectada

Registro de las mejoras visuales hechas en la rama `feat/frontend-diseno`
(creada desde `feat/pagos`, la rama de Eliel). Cada entrada nueva va arriba.
Los cambios que necesitan tocar JavaScript o archivos de Eliel se piden en
`docs/PEDIDOS_FRONTEND.md`.

## Formato de cada entrada
```
### AAAA-MM-DD — Título corto
**Hecho:** qué se cambió.
**Decisiones:** por qué se hizo así.
**Pendiente:** qué quedó por hacer.
```

---

### 2026-09-30 — Dictado por voz en el chat (CSS y textos listos, JS pedido)
**Hecho:**
- `css/estilos.css`: `.boton-dictar` (círculo de 52 px entre la caja y
  "Enviar"; rojo y con halo que pulsa mientras escucha; quieto con "reducir
  movimiento") y `.dictado-estado` ("Escuchando…" o el aviso de error).
- `js/i18n.js`: `chat.dictar`, `chat.escuchando`, `chat.dictadoAviso`,
  `chat.dictadoPermiso`, `chat.dictadoError` en es/en/pt.
- Pedido 7: `js/dictado.js` (nuevo) y 6 líneas en `vistas/chat.js`.
- Probado en una copia con reconocimiento simulado (7 casos: aparece,
  escucha, termina, se apaga al enviar y al salir, sin permiso, sin
  soporte) y capturas a 360 px en claro y oscuro.

**Decisiones:**
- El texto dictado no se envía solo: el turista lo revisa (el dictado se
  equivoca con palabras indígenas).
- Nota de privacidad bajo el chat: en Chrome la voz va a Google.
- Sin botón en Firefox ni en la app de Capacitor.

**Pendiente:**
- Pedido 7 (Eliel) y prueba con voz real en Android + Chrome por HTTPS.

### 2026-09-30 — Itinerario como línea de tiempo (CSS listo, JS pedido)
**Hecho:**
- `css/estilos.css`: la tarjeta de itinerario es una línea de tiempo (un
  punto por día sobre una línea vertical). Bloques `.iti-bloque` con
  "☀️ Mañana / 🌇 Tarde · hora", foto (o relleno con canoa si no hay),
  nombre, emprendimiento, duración, precio en negrita y botón Reservar.
- Diseño según el ancho de la tarjeta (`container-type` + `@container`):
  angosta = foto arriba y Reservar a todo el ancho; ancha (460 px o más) =
  foto | texto | Reservar en una fila. En el chat, el itinerario ocupa las
  dos columnas.
- El formato actual (solo texto) también se ve como línea de tiempo con el
  CSS nuevo, antes de que Eliel cambie el JS.
- `js/i18n.js`: `iti.manana`, `iti.tarde`, `iti.reservar` en es/en/pt.
- Pedido 6: nuevo `tarjetaItinerario` (tarjetas.js) y la foto en el
  resumen del backend, con el código probado.
- Probado en una copia con datos de ejemplo: 360 y 900 px, claro y oscuro;
  botones de 44 px con `aria-label`, que abren `#/experiencia/<id>`.

**Decisiones:**
- "Mañana/Tarde" se calcula en el frontend con la misma regla que el
  backend (`horaSalida` antes de las 12:00), sin cambiar la API.
- Reservar lleva a la página de la experiencia, que ya tiene disponibilidad
  y formulario; así no se duplica la lógica de reservas.
- `@container` en vez de `@media`: en el chat la tarjeta va dentro de una
  burbuja más angosta que la pantalla.

**Pendiente:**
- Pedido 6 (Eliel). Confirmar el formato de `fotos` en los datos.

### 2026-09-30 — Sin lema en la cabecera
**Hecho (a pedido de Félix, solo `css/estilos.css`):**
- Se quitó el lema de debajo de "Ecoruta Conectada" en la cabecera de todas
  las pantallas (reglas `.marca::after` y `body:has(.portada)`). El lema
  sigue en la portada, en negrita, sobre el texto de bienvenida.
- En PC, la marca conserva su tamaño de 1.35rem; la cabecera sigue en 60 px.
- Pedido 4 cancelado (ya no hay lema en la cabecera).
- Probado en #/chat y #/lenguas a 1280 px.

### 2026-09-30 — Portada quieta otra vez + "Hablar con el asistente" con borde de colores
**Hecho (a pedido de Félix):**
- Se quitaron todas las animaciones de la portada: colores del título,
  filtro `#agua`, figura flotante y entrada escalonada.
  `css/estilos.css` e `index.html` volvieron a como estaban en el commit
  07e3025 (portada estática); las dos entradas de abajo quedan como
  historial.
- El botón "Hablar con el asistente" de la portada tiene el mismo estilo
  que "Enviar" del chat: píldora oscura, borde de colores y resplandor en
  movimiento. Se reutilizan las mismas reglas con el selector
  `.accesos a[href='#/chat']` (sin tocar `inicio.js`).
- `.accesos { isolation: isolate; }` para que el resplandor quede detrás del
  botón y no detrás del fondo de la página.
- Misma forma de píldora (`border-radius: 999px`) que los otros dos botones
  de la portada; el botón Enviar del chat conserva sus esquinas de 16 px.
- Mismo alto visual que los otros dos: los tres ya medían 52 px, pero el
  borde de 4 px y el anillo interno de 5 px achicaban la parte oscura. En la
  portada el borde de colores pasa a 2 px (como los otros) y el anillo a 3 px.
- Probado: capturas en PC (claro) y celular (oscuro); al tocar el botón se
  abre `#/chat`; mide 52 px.

**Decisiones:**
- Se identifica el botón por su `href`: `inicio.js` le pone las mismas
  clases que a los otros botones. Si Eliel cambia esa ruta, hay que
  actualizar el selector.

### 2026-09-30 — Portada: colores que fluyen en el título (sin deformar letras)
**Hecho (a pedido de Félix):**
- El filtro `#agua` ya no se aplica al título: las letras quedan quietas y
  nítidas. La figura sigue ondulando en PC.
- El título usa `--titulo-colores`: degradado verde → turquesa → azul →
  violeta → magenta → naranja → verde, al doble de ancho y repetido, que
  avanza un ciclo cada 12 s (`portada-colores`), sin saltos. Reemplaza al
  brillo blanco y a `--portada-final`.
- Tonos oscuros en modo claro (4:1 a 6:1 con el fondo) y claros en modo
  oscuro (más de 7:1).
- Con "reducir movimiento", los colores quedan quietos.

### 2026-09-30 — Portada: animaciones de "agua"
**Hecho:**
- `index.html`: filtro SVG `#agua` oculto al final de `<body>`. Hace un
  ruido de ondas anchas, lo difumina, desplaza las letras con él y vuelve a
  suavizar los bordes. Se anima con `<animate>` de SVG (el patrón cambia
  cada 12 s y la intensidad sube y baja cada 6 s), sin JavaScript.
- `css/estilos.css`:
  - entrada escalonada: título, bienvenida, lema, figura y botones suben y
    aparecen uno tras otro (0 a 0.85 s);
  - brillo que cruza el título cada 7 s (capa de degradado blanco
    recortada al texto);
  - la figura flota (sube 8 px y gira 2°, cada 6 s);
  - en PC (768 px o más), el filtro `#agua` ondula el título y la figura.
- Con "reducir movimiento" se apagan todas las animaciones y el filtro.
- Probado con capturas en distintos momentos, en claro y oscuro, a 500 y
  1280 px, y con "reducir movimiento".

**Decisiones:**
- unseen.co usa WebGL y JavaScript; aquí se imita con CSS y SVG para no
  tocar el JavaScript de Eliel. Las ondas no siguen al cursor, porque eso
  necesita JavaScript.
- La ondulación va solo en PC: en celulares económicos un filtro SVG
  animado puede ir lento. En el celular quedan la entrada, el brillo y la
  flotación, que son livianos (opacity y transform).
- La figura entra con `portada-emerger` (sin `filter`), porque una animación
  que termina en `filter: blur(0)` y se queda fija anula el filtro `#agua`.
- Primero el filtro dejaba los bordes dentados: se difuminó el ruido
  (`stdDeviation` 8) y se añadió un desenfoque de 0.6 px al final.

**Pendiente:**
- Probar la fluidez en un celular y un PC reales (en headless no se puede
  medir).

### 2026-09-30 — Portada nueva: título grande, lema y figura
**Hecho (solo `css/estilos.css`):**
- `.portada::before`: "Ecoruta / Conectada" grande con degradado de verde a
  oscuro (en modo oscuro, de verde a claro). Es decorativo: lleva texto
  alternativo vacío porque la marca ya está en la cabecera.
- `.portada-texto::before`: lema en negrita "La IA conversa. La comunidad es
  dueña de su palabra", en es/en/pt con `:lang()`.
- `.portada::after`: figura de dos semicírculos partidos en verde y oscuro,
  dibujada con 4 degradados radiales (sin imágenes). Radio 64 px en el
  celular y 100 px en PC.
- Celular: todo alineado a la izquierda; la figura va entre el texto y los
  botones (`order`). PC: dos columnas, con el texto a la izquierda y la
  figura y los botones a la derecha (`grid-template-areas`).
- En la portada se oculta el lema de la cabecera (`body:has(.portada)`),
  para no repetirlo.
- Nuevas variables `--portada-verde`, `--portada-final`, `--figura-verde` y
  `--figura-oscuro` en claro y en los dos bloques oscuros.
- Probado con capturas a 360 y 1100 px, en claro y oscuro.

**Decisiones:**
- La palabra en lengua indígena del diseño NO se puso: por la regla 1 de
  CLAUDE.md debe salir de una ficha verificada (pedido 5).
- Verde del título #178a52 (4:1 con el fondo, suficiente para texto grande)
  en vez del #20b26b del diseño (2.5:1). La figura sí usa #20b26b, porque es
  solo decoración.

**Pendiente:**
- Pedido 5 (palabra indígena desde la base de datos) y su estilo.

### 2026-09-30 — PC: marca más grande y lema en la cabecera
**Hecho (solo `css/estilos.css`, desde 768 px):**
- "Ecoruta Conectada" pasa de 1.05rem a 1.35rem.
- Lema debajo, en cursiva, con `.marca::after`: "La IA conversa, la
  comunidad es dueña de su palabra" (es), "AI converses, the community owns
  its word" (en), "A IA conversa, a comunidade é dona da sua palavra" (pt).
  Cambia con el idioma gracias a `:lang()` sobre `<html lang>`.
- En el celular no cambia nada (no hay espacio junto al selector de idioma).
- Probado a 1024 px en los tres idiomas: la cabecera sigue midiendo 60 px
  y el menú queda justo debajo.

**Decisiones:**
- El texto va en el CSS y no en `i18n.js`, porque el enlace de la marca lo
  crea `app.js` (de Eliel). Pedido 4 opcional para pasarlo a `i18n.js`.
- Traducciones en/pt propuestas por Claude; el lema en español es de Félix.

**Pendiente:**
- Que alguien del equipo revise las traducciones en inglés y portugués.

### 2026-09-30 — Botón "Enviar" del chat con borde de colores y resplandor
**Hecho (solo `css/estilos.css`):**
- `.chat-formulario .boton`: píldora oscura (#3b3b3b con anillo interno
  #262626), borde de 4 px con degradado pastel (verde, ámbar, rosado,
  violeta, azul) y resplandor difuminado detrás (`::before`). El degradado se
  mueve lento; brilla más al pasar el mouse, tocarlo o con foco; se atenúa
  mientras el asistente responde (`:disabled`). 52 px de alto.
- Sin animación si el dispositivo pide "reducir movimiento".
- Corregido un fallo que ya existía: a la derecha del botón asomaban las
  sugerencias del chat al desplazarse. El fondo del formulario ahora llega al
  borde de la pantalla (`margin-inline: -1rem; padding-inline: 1rem`).
- Probado: capturas a 360 y 1024 px en claro y oscuro; en una copia del
  frontend, al tocar el botón el mensaje se envía y el campo se vacía.

**Decisiones:**
- Se estiliza con `.chat-formulario .boton`, sin tocar `chat.js`, y solo
  afecta a este botón.
- El botón no lleva `z-index` ni `isolation`: si los tuviera, el resplandor
  se dibujaría encima de su fondo en vez de detrás.
- Mismo aspecto en modo claro y oscuro (texto blanco sobre gris oscuro).

**Pendiente:**
- Nada.

### 2026-09-30 — Ajustes: elegir modo claro, oscuro o automático (preparado)
**Hecho:**
- `css/estilos.css`: el modo oscuro también se activa con
  `<html data-tema="oscuro">`, y `data-tema="claro"` fuerza el claro aunque el
  dispositivo esté en oscuro. Sin atributo, sigue al dispositivo (como antes).
- Menú inferior con `grid-auto-flow: column`: se adapta a 4 o 5 opciones.
  Etiquetas centradas por si alguna ocupa dos líneas.
- Estilos de la pantalla de Ajustes: `.grupo-opciones`, `.opciones` y
  `.opcion` (radio invisible encima de una píldora de 44 px).
- `js/i18n.js`: 7 claves nuevas en es/en/pt (`nav.ajustes`, `ajustes.*`).
  Ninguna clave movida ni borrada; los tres idiomas tienen las mismas claves.
- El JavaScript de la pantalla (ruta, `tema.js`, `vistas/ajustes.js` y un
  script en `index.html`) quedó como pedido 3 en `PEDIDOS_FRONTEND.md`, con
  el código completo.

**Decisiones:**
- El JavaScript es de Eliel: se pide en vez de hacerlo aquí (decisión de
  Félix). Antes se probó en una copia del frontend fuera del repositorio,
  con el dispositivo en claro y en oscuro.
- La pestaña se llama "Ajustes" / "Settings" y no "Configuración", porque a
  360 px cada opción del menú mide unos 72 px.
- Las variables oscuras están dos veces en el CSS (una para
  `prefers-color-scheme` y otra para `data-tema`), porque CSS no permite
  unir un `@media` con un selector. Hay un aviso para mantenerlas iguales.

**Pendiente:**
- Pedido 3 a Eliel. Hasta entonces la app funciona igual que antes (modo
  automático) y el menú sigue con 4 opciones.

### 2026-09-30 — Modo oscuro automático
**Hecho:**
- `css/estilos.css`: bloque `@media (prefers-color-scheme: dark)` que solo
  cambia las variables de `:root`. Se activa si el dispositivo está en modo
  oscuro; no hay botón para cambiarlo.
- `color-scheme: light dark` para que el navegador adapte el selector de
  idioma, los campos de fecha y las barras de desplazamiento.
- Los 11 colores escritos a mano pasaron a variables nuevas
  (`--sobre-verde`, `--verde-hover`, `--cabecera-fondo`,
  `--cabecera-control`, `--sobre-tierra`, `--texto-ambar`, `--borde-ambar`,
  `--rojo-claro`, `--neutro-fondo`, `--neutro-texto`). En modo claro
  conservan el mismo valor: el modo claro no cambia.
- `index.html`: segunda etiqueta `theme-color` (#173d2a) para la barra del
  navegador en modo oscuro. El JavaScript no la usa.
- Probado con capturas en modo claro y oscuro de la app real (360 y 1024 px)
  y de una página de muestra con tarjetas, chips, chat, formulario y estados.

**Decisiones:**
- En oscuro, el verde pasa a ser un acento claro (#7ccf9f) con texto oscuro
  encima, porque un verde oscuro sobre fondo negro no se lee. La cabecera
  queda en un verde profundo (#173d2a) para no deslumbrar.
- Contraste revisado con un script: textos entre 7:1 y 15:1, bordes de
  campos 4.4:1 o más.

**Pendiente:**
- Verificar en el APK (Bloque 8) que el WebView de Android siga el modo
  oscuro del teléfono (pedido 2 en `PEDIDOS_FRONTEND.md`).

### 2026-09-30 — Botones de 44 px, bordes visibles y foco en la cabecera
**Hecho (solo `css/estilos.css`):**
- A 44 px de alto: selector de idioma, enlace "Ecoruta Conectada" de la
  cabecera, chips (filtros y sugerencias del chat) y botón de audio.
- Nueva variable `--borde-control` (#808d86) para el borde de campos y chips:
  pasa de 2.5:1 y 1.4:1 a 3.5:1 con blanco (mínimo WCAG 3:1).
- El contorno de foco en la cabecera ahora es blanco (el café sobre verde
  daba 1.0:1 y no se veía).
- En pantallas de 768 px o más, la navegación queda en `top: 60px`, el nuevo
  alto de la cabecera.
- Contraste de todos los textos revisado: entre 6.6:1 y 10:1, no hubo que
  cambiar ninguno.
- Probado a 360 px y 1024 px con capturas: sin desbordes.

**Decisiones:**
- Edge en modo headless no permite ventanas tan angostas: para probar 360 px
  se carga la app dentro de un iframe de 360 px.

**Pendiente:**
- Chips, botón de audio y formulario de reserva no se vieron con datos
  reales (hace falta el backend). Revisarlos cuando haya datos.

### 2026-09-30 — Fuente Noto Sans para el texto en lenguas indígenas
**Hecho:**
- Nueva fuente `frontend/www/fuentes/NotoSans-ecoruta.woff2` (111 KB) con su
  licencia `OFL-NotoSans.txt`.
- En `css/estilos.css`: `@font-face` "Noto Sans Ecoruta", variable
  `--fuente-lenguas` y regla para `.ficha-texto` (palabra o frase y
  autodenominación de la lengua) y `.ficha-pronunciacion i` (guía de
  pronunciación). El resto de la interfaz sigue con la fuente del sistema.
- Probado con Edge: ɨ, ʉ, ü̃ y ṵ̈́ se dibujan con los acentos bien ubicados.
- Sin cambios en JavaScript.

**Decisiones:**
- La fuente va dentro del proyecto y no desde Google Fonts: debe funcionar
  sin señal (modo offline y APK) y no enviar datos del turista a Google.
- Recorte propio con `fonttools` (latín, latín extendido, IPA, acentos
  combinables; ancho normal; grosores 400-700) a partir de la fuente oficial
  de github.com/google/fonts. Los paquetes de Google Fonts dejan por fuera
  los acentos combinables, como la tilde debajo (U+0330).

**Pendiente:**
- Cuando exista `sw.js` (Bloque 7, Eliel), la fuente debe entrar en la
  lista de archivos cacheados. Queda anotado en `PEDIDOS_FRONTEND.md`.
