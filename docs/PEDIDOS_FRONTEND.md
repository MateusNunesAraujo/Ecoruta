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
