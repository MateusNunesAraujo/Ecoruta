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
