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
