# Plan de trabajo — Ecoruta Conectada

Hackathon: 30 sep – 1 oct 2026. Las fechas son orientativas.
Claude Code: al terminar un bloque, márcalo con ✅ y registra la entrada en
`docs/BITACORA.md`. Haz un bloque a la vez y espera aprobación para el siguiente.

---

## ✅ Bloque 0 — Base del proyecto
NestJS + TypeORM conectado a PostgreSQL con Docker Compose, `.env.example`.

## Bloque 1 — Emprendimientos (23 sep)
- Entidad `Emprendimiento`: nombre, comunidad, descripción (es/en/pt),
  intereses (ej. aves, delfines, gastronomía, artesanías, caminata),
  precio base en COP, duración, capacidad por fecha, ubicación (lat/lng),
  contacto, foto.
- Endpoints: `GET /api/emprendimientos` (con filtro por interés) y
  `GET /api/emprendimientos/:id`.
- Seed con 5–6 emprendimientos DE EJEMPLO, marcados como ficticios.

## Bloque 2 — Contenido cultural (23–24 sep)
- Entidad `FichaCultural`: lengua (tikuna, murui, yagua, miraña, bora), tema,
  palabra o frase, traducción, guía de pronunciación, audio (URL opcional),
  narrativa, fuente, comunidad de origen, estado (`PENDIENTE` | `VERIFICADA`).
- Endpoints: `GET /api/cultural?lengua=&tema=` y `GET /api/cultural/:id`.
- ⚠️ NO inventar palabras en lenguas indígenas. El seed usa textos de relleno
  con estado `PENDIENTE`. El contenido real lo cargan personas del equipo
  desde fuentes verificadas (Memoria Viva, SINCHI, Laboratorio de Lenguas UNAL).

## Bloque 3 — Reservas (24–25 sep)
- Entidad `Reserva`: emprendimiento, fecha, número de personas, datos mínimos
  del turista, idioma, estado, fecha de expiración.
- Consultar disponibilidad por fecha (capacidad − cupos ocupados).
- Crear reserva en `PENDIENTE_PAGO` dentro de una transacción, sin sobreventa.
- Expirar reservas pendientes después de ~15 minutos.
- Endpoints: disponibilidad, crear, consultar por id, cancelar.

## Bloque 4 — Agente conversacional (25–26 sep)
- Interfaz `LlmProvider` + `MockProvider` primero, luego `GeminiProvider` y
  `GroqProvider`. Selección con `LLM_PROVIDER`.
- Herramientas del agente (ver CLAUDE.md) conectadas a los servicios de los
  bloques 1–3.
- `obtener_contenido_cultural` devuelve la ficha al frontend, no al modelo.
- Endpoint `POST /api/agente/mensaje` que responde texto + tarjetas
  (emprendimientos, fichas culturales, reservas).
- Detección del idioma del turista (es/en/pt).

## Bloque 5 — Frontend web (26–27 sep)
- Mobile-first, en `frontend/www/`, servido por NestJS.
- Pantallas: inicio con selector de idioma, chat, catálogo, detalle de
  emprendimiento, ficha cultural (con audio), estado de la reserva.
- Textos de la interfaz en es/en/pt.
- `js/config.js` con la URL base de la API.

## Bloque 6 — Pagos (27 sep)
- Wompi en modo sandbox: generar enlace de pago para una reserva.
- Webhook que cambia la reserva a `CONFIRMADA` al aprobarse el pago.
- Verificar la documentación actual de Wompi antes de implementar.

## Bloque 7 — Modo offline (28 sep)
- Service Worker (web), IndexedDB para catálogo y fichas culturales.
- Cola de pre-reservas que se envía al recuperar la conexión.
- Aviso y preguntas frecuentes cuando el chat no tiene señal.

## Bloque 8 — App Android con Capacitor (28–29 sep)
- Capacitor en `frontend/`, `webDir: "www"`, plataforma Android.
- Plugins `@capacitor/network` y `@capacitor/browser`. CORS en NestJS.
- Generar APK de prueba.

## Bloque 9 — Despliegue y demo (29 sep)
- Desplegar backend + base de datos en un servicio con HTTPS.
- Código QR hacia la versión web.
- Ensayo completo del guion de la demo.

---

## En paralelo (no es código)
- Lienzo Canvas del proyecto.
- Recolección y verificación del contenido cultural (Bloque 2).
- Guion del pitch y de la demo.
