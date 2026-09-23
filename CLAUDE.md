# Ecoruta Conectada — Contexto del proyecto

## Qué es
Prototipo para el Hackathon Amazonas CoL 5.0 (30 sep – 1 oct 2026), reto
"Ecoruta Conectada: Soberanía Lingüística Digital". Equipo de 4 estudiantes de la
Universidad Nacional de Colombia, sede Amazonía (Leticia).

Agente de IA conversacional que conecta turistas extranjeros directamente con
emprendimientos de etnoturismo y ecoturismo de las reservas indígenas de Leticia,
eliminando intermediarios. El proyecto se presenta con Lienzo Canvas.

Un solo código de frontend genera dos productos:
- **Versión web** (turistas): se abre escaneando un código QR, sin instalar nada.
- **App Android con Capacitor** (principalmente emprendedores): abre sin señal y
  sincroniza cuando vuelve la conexión.

## Prioridades del prototipo (en orden)
1. Chat multilingüe (español, inglés, portugués) conectado al catálogo real.
2. Agendamiento: itinerarios según intereses + reservas con control de cupos.
3. Módulo cultural: fichas curadas en Tikuna, Huitoto/Murui, Yagua, Miraña y Bora.
4. Pago en sandbox (Wompi; verificar su documentación de pruebas actual).
5. Modo offline del catálogo y del glosario cultural.
6. Empaquetar como app Android con Capacitor (al final; iOS fuera de alcance).

## Stack
- Backend: NestJS (TypeScript) + TypeORM.
- Base de datos: PostgreSQL, levantada con Docker Compose.
- Frontend: HTML, CSS y JavaScript puros, SIN frameworks ni bundler.
  Diseño mobile-first y responsive.
- Móvil: Capacitor (solo Android), instalado dentro de `frontend/`.
- LLM: detrás de la interfaz `LlmProvider`. Implementaciones: `GeminiProvider`
  (principal, nivel gratuito), `GroqProvider` (respaldo), `MockProvider`
  (desarrollo sin consumir cuota). Se elige con `LLM_PROVIDER` en `.env`.

## Estructura del repositorio
`Ecoruta/` es la raíz del monorepo (no es el backend).
```
Ecoruta/
├── backend/                  NestJS: API REST + base de datos
│   └── src/
│       ├── emprendimientos/  catálogo, intereses, ubicación
│       ├── reservas/         disponibilidad, cupos, estados de reserva
│       ├── pagos/            Wompi sandbox + webhook de confirmación
│       ├── cultural/         fichas: palabra, pronunciación, audio, narrativa, fuente
│       └── agente/           orquestación del chat y herramientas (tools)
│           └── providers/    llm-provider.interface.ts, gemini, groq, mock
├── frontend/
│   ├── www/                  ÚNICA carpeta de código web que se edita
│   │   ├── index.html
│   │   ├── css/
│   │   ├── js/
│   │   │   └── config.js     URL base de la API (web vs app)
│   │   ├── sw.js             Service Worker (solo versión web)
│   │   └── manifest.webmanifest
│   ├── android/              GENERADO por Capacitor: no editar a mano
│   ├── capacitor.config.json (webDir: "www")
│   └── package.json          dependencias de Capacitor
├── docs/
│   └── BITACORA.md           registro de avance (ver reglas abajo)
├── docker-compose.yml
├── .env.example              variables sin claves reales
├── .gitignore
└── CLAUDE.md
```

## Cómo se conectan frontend y backend
- El frontend NO se renderiza en el servidor (a diferencia de plantillas de
  Django). Son archivos estáticos que piden datos al backend en JSON con `fetch`.
- Web: NestJS sirve `frontend/www` con `ServeStaticModule`; la API vive bajo el
  prefijo `/api`.
- App: el frontend corre en el teléfono y llama a la URL completa del backend
  desplegado. Por eso: la URL base se define en `js/config.js` y NestJS debe
  tener **CORS habilitado** para los orígenes de Capacitor.
- Después de cambiar `www/`, ejecutar `npx cap sync` (dentro de `frontend/`)
  para actualizar la app Android.

## Reglas de arquitectura (NO romper)
1. **El LLM nunca genera texto en lenguas indígenas.** Los modelos no conocen
   estas lenguas de forma confiable. Todo contenido en Tikuna, Murui, Yagua,
   Miraña o Bora sale de la tabla de fichas culturales curadas, con su fuente
   y comunidad de origen.
2. **El contenido cultural no pasa por el LLM.** La herramienta
   `obtener_contenido_cultural` envía la ficha directamente al frontend como
   tarjeta; al modelo solo se le devuelve una referencia mínima (ej. "se mostró
   la ficha #12"). Esto protege la soberanía de los datos de las comunidades,
   ya que el nivel gratuito de Gemini usa los datos para entrenar.
3. **Datos mínimos al LLM:** no enviar datos personales del turista que el
   modelo no necesite para responder.
4. **Reservas seguras:** usar transacciones y restricciones en PostgreSQL para
   evitar sobreventa de cupos. Estados: `PENDIENTE_PAGO` (cupo apartado ~15 min)
   → `CONFIRMADA` (webhook de pago aprobado) | `CANCELADA` / `EXPIRADA`.
5. **Nunca subir claves.** Todo secreto va en `.env`, que está en `.gitignore`.
6. **Un solo código web.** Nada de duplicar pantallas para la app: lo específico
   de móvil se detecta en tiempo de ejecución (`Capacitor.isNativePlatform()`).

## Herramientas del agente
- `buscar_emprendimientos(intereses, fecha?)`
- `consultar_disponibilidad(emprendimientoId, fecha)`
- `armar_itinerario(intereses, dias)`
- `crear_reserva(...)` → devuelve reserva en `PENDIENTE_PAGO`
- `generar_enlace_pago(reservaId)`
- `obtener_contenido_cultural(lengua?, tema)`

## Modo offline
- **Web:** Service Worker cachea los archivos de la app.
- **App:** los archivos van dentro del APK, así que siempre abre sin señal; el
  plugin `@capacitor/network` detecta cambios de conexión.
- **Ambos:** IndexedDB guarda catálogo de emprendimientos y fichas culturales
  (con audios livianos).
- Cola de pre-reservas: se guardan localmente sin conexión y se envían al
  recuperar la señal. Se muestran como "pendiente de confirmar".
- Sin conexión, el chat muestra un aviso y preguntas frecuentes guardadas.

## Plugins de Capacitor previstos
- `@capacitor/network`: estado de la conexión.
- `@capacitor/browser`: abrir la página de pago de Wompi fuera del WebView.

## Contexto regional a tener en cuenta
- Triple frontera (Leticia–Tabatinga–Santa Rosa): muchos turistas hablan
  portugués; mostrar precios en COP con referencia en BRL.
- Conectividad intermitente, también para los emprendedores en comunidades
  sobre el río: el panel del emprendedor debe ser liviano.
- En la región predomina Android.
- Nequi es el medio de pago más usado localmente.

## Forma de trabajar
- El equipo está aprendiendo NestJS: antes de escribir código, explica en
  español y de forma sencilla qué vas a hacer y por qué. Prefiere cambios
  pequeños y revisables.
- Código, nombres de variables y comentarios en español cuando sea natural;
  términos técnicos estándar en inglés (controller, service, entity).
- Un integrante por rama; cambios a `main` mediante pull request.
- Commits pequeños con mensajes descriptivos en español.
- **Al terminar cada tarea, agrega una entrada en `docs/BITACORA.md`** con: qué
  se hizo, decisiones técnicas tomadas y pendientes. La planificación se hace
  en otra conversación que lee esa bitácora.