# Bitácora — Ecoruta Conectada

Registro de avance. Cada entrada nueva va arriba (la más reciente primero).

## Formato de cada entrada
```
### AAAA-MM-DD — Título corto de la tarea
**Hecho:** qué se construyó o cambió.
**Decisiones:** decisiones técnicas tomadas y por qué.
**Pendiente:** qué quedó por hacer o qué problema apareció.
```

---

### 2026-09-30 — TRASPASO: estado para continuar en otro computador
**Estado exacto:**
- Trabajo en la rama **`feat/frontend`** (subida a GitHub con este commit).
  Sin cambios pendientes: todo está en commits y subido.
- Bloques terminados: **0, 1, 2, 3, 4 y 5** (✅ en PLAN.md). No hay ningún
  bloque a medias. Siguiente según PLAN.md: **Bloque 6 (pagos)**, esperando
  aprobación del equipo.
- ⚠️ **`main` solo tiene el Bloque 0.** Los PR de los bloques 1-5 nunca se
  fusionaron. Las ramas están encadenadas y cada una contiene a la anterior:
  `main` ← `feat/emprendimientos` (B1-2) ← `feat/reservas` (B3) ←
  `feat/agente` (B4) ← `feat/frontend` (B5). Basta **un PR de
  `feat/frontend` a `main`** para llevar todo:
  https://github.com/MateusNunesAraujo/Ecoruta/compare/main...feat/frontend?expand=1
- Verificado al cerrar: build, lint y 50 pruebas unitarias pasan
  (`npm test` en `backend/`).

**Cómo arrancar en el computador nuevo:**
1. `git clone` y `git switch feat/frontend` (o `main` si ya se fusionó).
2. Copiar `.env.example` a `.env` en la raíz y poner `DB_PASSWORD`. Si ese
   computador tiene PostgreSQL instalado en Windows, usar `DB_PORT=5433`
   (choque de puertos, ver Bloque 1).
3. `docker compose up -d` (en la raíz).
4. `cd backend` y `npm install`.
5. **Copiar los datos, que NO están en Git** (el repositorio es público y
   tienen nombres/voces de hablantes; se comparten por fuera):
   `docs/datos/Ecoruta_datos.xlsx` y los audios en `frontend/www/audio/`.
   Los audios pueden venir con los nombres originales ("Hola_Tikuna
   (mp3cut.net).m4a"): el seed los renombra solo.
6. `npm run seed` → debe terminar con 0 errores y 18 avisos (17 fichas Bora
   sin hablante, EXP-05 sin precio).
7. `npm run start:dev` y abrir http://localhost:3000 (frontend) y
   http://localhost:3000/api/experiencias (API). `LLM_PROVIDER=mock` funciona
   sin claves.

**Decisiones y problemas de esta conversación que no están en CLAUDE.md ni
PLAN.md** (el detalle está en las entradas de cada bloque, más abajo):
- Se reserva una **experiencia** (no un emprendimiento): precio, capacidad e
  intereses están en la hoja Experiencias. Los ids del catálogo y las fichas
  son los códigos del Excel (`EXP-01`, `FIC-12`); las reservas usan UUID.
- El Excel es la fuente de verdad del catálogo y las fichas: se corrigen en
  el Excel y se vuelve a ejecutar `npm run seed` (actualiza por código, no
  duplica, borra lo que ya no está salvo experiencias con reservas).
- NestJS 12 usa módulos ES: los imports internos llevan `.js`. Las
  relaciones de TypeORM usan `Relation<>` para evitar imports circulares.
- TypeORM 1.x rechaza `undefined` en un `where`: los filtros opcionales se
  agregan solo si llegan (no activar la opción global de ignorarlos).
- Agente: modelos por defecto `gemini-3.5-flash-lite` y
  `llama-3.3-70b-versatile` (consultados el 28-09); respaldo automático entre
  Gemini y Groq; máximo 4 vueltas de herramientas por mensaje. Límite de 10
  mensajes/minuto y 100/hora por IP en el chat.
- Frontend: nunca usar `innerHTML` (todo con `el()` de `js/dom.js`); rutas
  con `#`; textos en `js/i18n.js` (agregar cada clave en es, en y pt).
- Entorno Windows (útil para quien siga):
  - En PowerShell, los comandos con comillas anidadas fallan: escribir
    `docker exec ecoruta-postgres psql -U ecoruta -d ecoruta -c "…"` sin
    `sh -c '…'`.
  - Git Bash convierte argumentos que empiezan por `/` en rutas de Windows
    (ej. `#/chat`): usar `MSYS_NO_PATHCONV=1`.
  - Chrome headless no baja de 500 px de ancho: para capturas de celular hay
    que emular el dispositivo con el protocolo de DevTools. Los scripts de
    prueba y capturas de esta conversación estaban en una carpeta temporal y
    no están en el repositorio.
- Borrar tablas o datos de la base: lo hace una persona del equipo (Claude
  Code tiene bloqueado ese tipo de comandos). Si un cambio de entity no
  arranca por datos viejos, en desarrollo se puede reiniciar la base con
  `docker compose down -v` y `docker compose up -d` y volver a hacer el seed.
- `pg` muestra un `DeprecationWarning` al guardar enlaces de fichas en el
  seed (TypeORM hace consultas en paralelo en la transacción); no falla hoy.

**Siguientes pasos concretos (en orden):**
1. Abrir y fusionar el PR `feat/frontend` → `main` (enlace arriba). Luego se
   pueden borrar las ramas intermedias.
2. Probar el agente con claves reales: en `.env`, `LLM_PROVIDER=gemini`,
   `GEMINI_API_KEY` y `GROQ_API_KEY`. Confirmar que `gemini-3.5-flash-lite`
   existe y usa bien las herramientas (si no, cambiar `GEMINI_MODEL`).
   Revisar que no escriba palabras en lenguas indígenas.
3. Verificar la tasa `COP_POR_BRL = 730` en `frontend/www/js/config.js`.
4. **Bloque 6 (pagos, Wompi sandbox):** revisar primero la documentación
   actual de Wompi. Incluye: herramienta `generar_enlace_pago(reservaId)`;
   webhook que valide la firma con `WOMPI_EVENTS_SECRET` y solo confirme
   reservas que sigan en `PENDIENTE_PAGO`; decidir qué hacer si el pago
   llega después de vencer; botón de pagar en `#/reserva/<id>` (hoy muestra
   "el pago estará disponible muy pronto", texto `resv.pago`). El email del
   turista tiene `select: false`: pedirlo explícitamente en el service.
5. **Bloque 9 (despliegue y demo):** servicio con HTTPS; `trust proxy` en
   Express para que el límite de mensajes sea por turista; subir a mano el
   Excel y los audios (no están en Git) y ejecutar el seed; poner la URL en
   `API_BASE` de `config.js` si se hace la app; código QR.
6. Bloque 7 (offline mínimo) y Bloque 8 (Capacitor, opcional).

**Pendientes de datos para el equipo (en el Excel):**
- Revisar con los hablantes lo señalado en la hoja Revision (FIC-24 "mttne",
  pronunciaciones de FIC-51/52, FIC-16/17 iguales, FIC-18, FIC-01, nombre
  "Albaro Echeverri").
- Fichas Bora FIC-14 a FIC-30 sin hablante (se decidió cargarlas así).
- EXP-05 sin capacidad ni precio (no se puede reservar).
- Traducir al inglés y portugués `incluye`, `no_incluye`, `que_llevar`,
  `cancelacion` y `contexto`; agregar fotos.

### 2026-09-29 — Bloque 5: Frontend web
**Hecho:**
- Frontend en `frontend/www/` con HTML, CSS y JavaScript puros (módulos ES
  nativos, sin framework ni bundler), mobile-first. NestJS lo sirve en `/`
  con `@nestjs/serve-static`; la API sigue en `/api`.
- Pantallas (rutas con `#`): inicio con selector de idioma (`#/`), chat
  (`#/chat`), catálogo con filtro por interés (`#/experiencias`), detalle con
  disponibilidad, formulario de reserva y saludos en la lengua de la
  comunidad (`#/experiencia/EXP-01`), lenguas y fichas con audio
  (`#/lenguas`, `#/lenguas/L-TIK`), estado de la reserva con cuenta
  regresiva y cancelar (`#/reserva/<id>`), mis reservas (`#/reservas`).
- Interfaz completa en es/en/pt (121 textos, revisado que estén en los tres).
- Chat: dibuja las 5 tarjetas del agente; la tarjeta `formulario_reserva`
  envía los datos directo a `POST /api/reservas`.
- Backend: `GET /api/cultural/lenguas` (lenguas con su número de fichas
  VERIFICADA, incluida Yagua con 0).
- `js/config.js`: URL de la API (web vs app) y tasa COP/BRL.
- Probado con Chrome headless emulando un celular (390×844) por el protocolo
  de DevTools: todas las pantallas sin desborde horizontal y sin errores de
  JavaScript; flujo completo en inglés (chat → ficha tikuna → formulario en
  el chat → reserva con cuenta regresiva → cancelar), detalle en portugués
  llegando con fecha desde el chat, y vista de escritorio (1280 px).
  Se borró la reserva de prueba.

**Decisiones:**
- Todo el contenido se inserta como texto (`el()` en `js/dom.js`), nunca con
  `innerHTML`: la respuesta del LLM y los datos del Excel no pueden inyectar
  código.
- Rutas con `#`: funcionan igual en la web y en la app Android sin configurar
  el servidor.
- Precios en COP con referencia en reales (`≈ R$ 82`) por la triple frontera.
- En las fichas, el texto indígena lleva `lang` con su código ISO 639-3
  (tikuna `tca`, murui `huu`, yagua `yad`, miraña y bora `boa`) para los
  lectores de pantalla. El chat usa `aria-live`.
- Audios con ruta relativa (`audio/…`): en la app irán dentro del APK y
  sonarán sin señal.
- La conversación del chat se guarda en `sessionStorage` y solo se envía el
  texto de los últimos 10 mensajes. En `localStorage` solo se guardan el
  idioma y los ids de las reservas (no nombre ni email).
- La cuenta regresiva no recarga en bucle si el reloj del teléfono está
  adelantado respecto al servidor.
- Chrome headless no baja de 500 px de ancho: para probar a tamaño de
  celular hay que emular el dispositivo con DevTools (no basta
  `--window-size`).

**Pendiente:**
- ⚠️ Verificar la tasa `COP_POR_BRL = 730` de `js/config.js` antes de la demo
  (es aproximada, no oficial).
- Campos que el Excel solo tiene en español (`incluye`, `no_incluye`,
  `que_llevar`, `cancelacion`, `contexto`, `permiso_uso`) se muestran en
  español aunque la interfaz esté en inglés o portugués.
- Bloque 6: el botón de pagar en la pantalla de la reserva (hoy dice "el
  pago estará disponible muy pronto").
- Bloque 7: Service Worker y manifest (no se incluyeron todavía).
- Un archivo estático inexistente devuelve `index.html` (comportamiento por
  defecto de `ServeStaticModule`); revisar al hacer el Service Worker.
- Fotos: el Excel no trae fotos, las tarjetas no tienen imagen.

### 2026-09-29 — Ajustes al Bloque 4 y nuevo orden del plan
**Hecho:**
- Push de `feat/agente`.
- Herramienta `buscar_emprendimientos` renombrada a `buscar_experiencias`
  (código, pruebas y lo que recibe el LLM): devuelve experiencias.
- CLAUDE.md: `buscar_experiencias`, `consultar_disponibilidad(experienciaId,
  fecha)`, `crear_reserva` muestra un formulario y la reserva se crea al
  enviarlo; se agregaron `faq/` y `seed/` a la estructura.
- Límite de peticiones por IP en `POST /api/agente/mensaje` con
  `@nestjs/throttler`: 10 por minuto y 100 por hora. Al superarlo responde
  429 con un mensaje en el idioma del turista (es/en/pt). Solo aplica al
  agente, no al catálogo ni a las reservas.
- PLAN.md reordenado por prioridad (hackathon el 30 de septiembre):
  Bloque 5 → 6 → 9 → 7 (offline mínimo) → 8 (Capacitor, opcional).
- Probado: 12 mensajes seguidos → 10 respuestas 200 y luego 429 en
  portugués; en inglés el 429 sale en inglés; 15 consultas seguidas al
  catálogo → todas 200. 50 pruebas unitarias pasan.

**Decisiones:**
- Dos límites: por minuto (ráfagas) y por hora (abuso sostenido que agotaría
  la cuota gratuita del LLM). Guardados en memoria: sirve con una sola
  instancia del backend.
- El guard extiende `ThrottlerGuard` y detecta el idioma con la misma
  función del agente (`detectarIdioma`).
- En el plan se conservan los números de bloque (la bitácora y el código los
  citan); cambia el orden y se agrega la prioridad.

**Pendiente:**
- Bloque 9: detrás del proxy del hosting todas las peticiones llegan con la
  IP del proxy; configurar `trust proxy` en Express para que el límite se
  aplique por turista y no a todos juntos.
- Probar Gemini y Groq con claves reales (el equipo avisará).

### 2026-09-28 — Bloque 4: Agente conversacional
**Hecho:**
- Módulo `agente/` con `POST /api/agente/mensaje`
  (`{ mensaje, idioma?, historial? }` → `{ idioma, texto, tarjetas, proveedor }`).
- Interfaz `LlmProvider` (formato neutro de conversación) y tres
  implementaciones en `agente/providers/`: `GeminiProvider` (REST
  `generateContent`), `GroqProvider` (API compatible con OpenAI) y
  `MockProvider` (por palabras clave, sin red ni cuota). Se elige con
  `LLM_PROVIDER`; modelos configurables con `GEMINI_MODEL` / `GROQ_MODEL`.
- Herramientas: `buscar_emprendimientos`, `consultar_disponibilidad`,
  `armar_itinerario`, `crear_reserva`, `obtener_contenido_cultural`,
  conectadas a los services de los Bloques 1-3.
- Tarjetas para el frontend: `experiencia`, `ficha_cultural`,
  `disponibilidad`, `itinerario`, `formulario_reserva`.
- Detección de idioma (es/en/pt) por palabras típicas, sin LLM.
- Probado: 50 pruebas unitarias (idioma, datos personales, formato de Gemini
  y Groq con fetch simulado, MockProvider, y que el LLM no reciba el texto de
  las fichas). Con la API y el Mock: conversaciones en es/en/pt con cada
  herramienta, validación del cuerpo (400). Con claves inventadas contra las
  APIs reales: Gemini falla → Groq falla → 503 con mensaje amable. Sin clave,
  la app no arranca y dice qué falta.

**Decisiones:**
- Regla 2 en el código: cada herramienta devuelve `paraModelo` (lo mínimo) y
  `tarjetas` (datos completos al frontend). De una ficha, el LLM solo recibe
  su id y la lengua; nunca el texto indígena, la pronunciación ni el audio.
- Regla 3: `crear_reserva` NO crea la reserva ni pide datos: muestra una
  tarjeta `formulario_reserva` y el frontend llama a `POST /api/reservas`.
  Emails y teléfonos escritos en el chat se reemplazan por `[email]` /
  `[teléfono]` antes de enviarlos al LLM. (Cambia lo que decía CLAUDE.md:
  "crear_reserva → devuelve reserva en PENDIENTE_PAGO".)
- Regla 1: el prompt lo prohíbe y, además, el LLM nunca ve textos indígenas.
- Sin estado en el servidor: el frontend reenvía los últimos mensajes
  (máx. 10 al LLM, 20 aceptados).
- Respaldo: `gemini` → `groq` (y al revés) si hay clave del otro. Tras la
  primera respuesta se sigue con el mismo proveedor dentro del mensaje.
- Gemini 3 exige devolver la `thoughtSignature`: se guarda la respuesta
  original (`crudo`) y se reenvía igual.
- Modelos por defecto (docs consultadas el 2026-09-28):
  `gemini-3.5-flash-lite` y `llama-3.3-70b-versatile`.
- Proveedores con `fetch` directo (sin SDK): cero dependencias nuevas y se
  prueban con un fetch simulado.
- Máximo 4 vueltas herramienta ↔ LLM por mensaje.
- Términos de Gemini (nivel gratuito): Google usa los datos para mejorar sus
  productos y personas pueden leerlos → confirma las reglas 2 y 3.

**Pendiente:**
- Probar Gemini y Groq con claves reales (el formato está probado con
  respuestas simuladas; con clave inválida la API real respondió 400/401).
- `generar_enlace_pago` se agrega en el Bloque 6 (Wompi).
- Limitar peticiones por IP (ej. `@nestjs/throttler`) antes de publicar: el
  endpoint consume la cuota gratuita del LLM.
- Actualizar en CLAUDE.md la descripción de `crear_reserva` y agregar
  `consultar_disponibilidad(experienciaId, fecha)` (antes decía
  emprendimientoId).
- Los mensajes de disponibilidad (`mensaje`) están en español; el frontend
  debe traducir usando el código `motivo`.

### 2026-09-28 — Bloque 3: Reservas
**Hecho:**
- Módulo `reservas/` con entity `Reserva` (experiencia, fecha, personas,
  precio unitario y total, estado, `expiraEn`, nombre/email/teléfono del
  turista, idioma).
- Endpoints: `GET /api/reservas/disponibilidad?experiencia=&fecha=`,
  `POST /api/reservas` (crea en `PENDIENTE_PAGO`), `GET /api/reservas/:id`,
  `POST /api/reservas/:id/cancelar`.
- Tarea programada (`@nestjs/schedule`) que cada minuto pasa a `EXPIRADA` las
  `PENDIENTE_PAGO` vencidas.
- `ValidationPipe` global + DTO `CrearReservaDto` (`class-validator`).
- Seed: conserva experiencias/emprendimientos con reservas aunque ya no estén
  en el Excel (aviso), en vez de fallar.
- `.gitignore`: `docs/datos/` y `frontend/www/audio/` (se comparten fuera de
  Git porque el repositorio es público).
- Probado con la API: 20 reservas simultáneas para 10 cupos → exactamente 10
  creadas y 10 rechazadas (409), sin sobreventa. Disponibilidad (fecha pasada,
  día que no opera, EXP-05 sin precio), validación (400), cupos insuficientes
  (409), cancelar, vencimiento (el cupo se libera al instante; la tarea la
  marcó EXPIRADA en < 1 min), restricciones CHECK con inserts directos en SQL.
  21 pruebas unitarias pasan. Los datos de prueba se borraron.

**Decisiones:**
- Se reserva una **experiencia** (no un emprendimiento): es la que tiene
  capacidad y precio desde el Bloque 2.
- Sin sobreventa: dentro de una transacción se bloquea la fila de la
  experiencia (`SELECT … FOR UPDATE`, `pessimistic_write`); una reserva
  simultánea espera y luego cuenta los cupos con la anterior ya guardada.
- Restricciones CHECK en PostgreSQL: `personas >= 1`, `estado` válido y
  `totalCop = personas * precioUnitarioCop`. Índice por (experiencia, fecha).
- Cupos ocupados = CONFIRMADA + PENDIENTE_PAGO no vencidas: una pendiente
  vencida libera el cupo en el acto, sin depender de la tarea programada.
- Una fecha no es reservable si: falta capacidad o precio (`NO_RESERVABLE`),
  ya pasó (`FECHA_PASADA`), es hoy y ya pasó la hora de salida (`YA_SALIO`),
  no está en `dias_operacion` (`DIA_NO_OPERA`), está bloqueada
  (`FECHA_BLOQUEADA`) o no hay cupos (`SIN_CUPOS`). Los códigos son para que
  el frontend y el agente los traduzcan a es/en/pt.
- "Hoy" se calcula en hora de Colombia (`America/Bogota`), no la del servidor.
- 15 minutos para pagar (`MINUTOS_PARA_PAGAR` en `reserva.entity.ts`).
- Precio guardado al momento de reservar (si el Excel cambia, no afecta).
- Id de la reserva = UUID (no se pueden adivinar reservas ajenas). Email y
  teléfono no salen en las respuestas (`select: false`).
- Solo se cancela una `PENDIENTE_PAGO`. Una `CONFIRMADA` responde 409 con la
  política de cancelación: el reembolso se verá con los pagos (Bloque 6).
- Errores: formato inválido → 400; no se puede reservar → 409 con `motivo`.

**Pendiente:**
- Bloque 6: el webhook solo debe confirmar reservas que sigan en
  `PENDIENTE_PAGO`; si el pago llega después de vencer, decidir qué hacer
  (¿confirmar si aún hay cupo o reembolsar?).
- El agente (Bloque 4) enviará datos del turista a `crear_reserva`: por la
  regla 3, que esos datos no pasen por el LLM (pedirlos en un formulario).
- Cada integrante debe copiar el Excel en `docs/datos/` y los audios en
  `frontend/www/audio/` antes de `npm run seed`.
- La rama `feat/reservas` sale de `feat/emprendimientos`: fusionar primero el
  PR del Bloque 1-2.

### 2026-09-28 — Bloque 2: Contenido cultural + datos reales del Excel
**Hecho:**
- Seed nuevo (`backend/src/seed/`, `npm run seed`) que lee
  `docs/datos/Ecoruta_datos.xlsx`: hojas Lenguas, Comunidades,
  Emprendimientos, Experiencias, Fechas_bloqueadas, Fichas_culturales y
  Preguntas_frecuentes. Ignora Instrucciones, Revision, Listas y las filas
  `EJ-`. Reemplaza los datos ficticios del Bloque 1.
- Entities: `Lengua`, `FichaCultural` (módulo `cultural/`); `Comunidad`,
  `Emprendimiento` (reestructurado), `Experiencia`, `FechaBloqueada` (módulo
  `emprendimientos/`); `PreguntaFrecuente` (módulo nuevo `faq/`).
- FichaCultural ⇄ Experiencia muchos a muchos (`@ManyToMany` + `@JoinTable`,
  tabla `fichas_experiencias`); `experiencia_id` acepta varios códigos.
- Endpoints: `GET /api/cultural?lengua=&tema=`, `GET /api/cultural/:id`,
  `GET /api/faq?categoria=&idioma=`, `GET /api/experiencias?interes=`,
  `GET /api/experiencias/:id` (incluye fichas), `GET /api/emprendimientos`
  y `GET /api/emprendimientos/:id` (con comunidad y experiencias).
- 43 audios de `frontend/www/audio/` renombrados (ej.
  `Adiós-Miraña (mp3cut.net).m4a` → `adios_mirana.m4a`); en la base se guarda
  el nombre nuevo.
- Carga: 5 lenguas, 9 comunidades, 8 emprendimientos, 13 experiencias,
  0 fechas bloqueadas, 66 fichas, 17 enlaces ficha-experiencia, 12 FAQ.
  VERIFICADA: Tikuna 15, Murui 18, Miraña 16, Bora 17, Yagua 0.
  0 errores y 18 avisos (17 fichas Bora sin hablante, EXP-05 sin precio).
- Probado: seed ejecutado 3 veces sin duplicar; validación con una copia del
  Excel con errores a propósito (cada error sale con hoja y fila, sin detener
  la carga); todos los endpoints; una ficha pasada a PENDIENTE desaparece de
  `/cultural`, `/cultural/:id` y de la experiencia. 15 pruebas unitarias pasan.

**Decisiones:**
- Los códigos del Excel (`EMP-01`, `EXP-03`, `FIC-12`…) son la clave primaria:
  el seed actualiza por código (`save`), así los id no cambian entre
  ejecuciones (resuelve el pendiente del Bloque 1) y no se duplica nada. Lo que
  ya no está en el Excel se borra. Las fechas bloqueadas (sin código propio) se
  reemplazan completas.
- Precio, capacidad, intereses, duración y coordenadas pasan de Emprendimiento
  a Experiencia (así viene el Excel). El filtro `?interes=` se movió a
  `/api/experiencias`. 13 etiquetas de interés en `intereses.ts`.
- Todo en una transacción. Problemas del Excel: ERROR en dato obligatorio →
  se omite la fila; ERROR en dato opcional → se carga sin ese dato; AVISO →
  se carga incompleta. Estado de ficha dudoso → PENDIENTE.
- Emprendimientos sin `consentimiento = Si` no se cargan (Ley 1581).
- Campos vacíos permitidos: comunidad del emprendimiento (EMP-03, 04, 08),
  lengua de la comunidad (COM-07), capacidad y precio (EXP-05).
- Fichas de una experiencia = fichas VERIFICADA de tipo `saludo` o de temas de
  cortesía (hola, bienvenido, gracias, adios, con_permiso) en la lengua de la
  comunidad + las enlazadas a mano, sin repetir.
- Al turista solo se le entregan fichas VERIFICADA; `verificadoPor` no sale en
  la API (`select: false`).
- Unicode NFC solo en textos indígenas (`texto_original`, `pronunciacion`,
  `autodenominacion`). El Excel ya venía en NFC (0 cambios); PostgreSQL
  confirma que todo está normalizado.
- Audios en minúsculas y sin tildes/espacios: el servidor Linux distingue
  mayúsculas. El seed aplica la misma regla al nombre del Excel, así que no hay
  que corregir el Excel. Los renombra solo si hace falta.
- TypeORM 1.x rechaza `undefined` en un `where`: los filtros opcionales se
  agregan solo si llegan (no se activó la opción global de ignorarlos, para no
  convertir un id faltante en "traer todo").
- Relaciones con el tipo `Relation<>` para evitar errores de import circular
  en módulos ES.
- Decisión del equipo: las fichas Bora FIC-14 a FIC-30 se cargan como
  VERIFICADA aunque no tienen `comunidad_o_hablante` (el seed muestra un aviso).
- Se agregó `exceljs`. `npm audit` reporta 2 alertas moderadas por su
  dependencia `uuid`; bajo riesgo (solo lee un Excel local del equipo).

**Pendiente:**
- Revisar con los hablantes lo señalado en la hoja Revision: FIC-24 ("mttne"),
  pronunciaciones de FIC-51/52 posiblemente intercambiadas, FIC-16/17 con el
  mismo texto, FIC-18, FIC-01 ("ü"), nombre "Albaro Echeverri".
- El equipo agregó FIC-65 (adiós) y FIC-66 (vamos) en tikuna para los dos
  audios que no tenían ficha; ya no quedan audios sin usar.
- Al guardar enlaces nuevos de fichas, `pg` muestra `DeprecationWarning:
  client.query() when the client is already executing` (TypeORM guarda en
  paralelo dentro de la transacción). No falla hoy; revisar antes de `pg@9`.
- EXP-05 sin capacidad ni precio: no se podrá reservar (Bloque 3).
- Yagua sin fichas: el frontend debe mostrar "en proceso de validación". Aún no
  hay endpoint de lenguas (`GET /api/lenguas`), útil para el Bloque 5.
- Decidir si el Excel y los audios se suben al repositorio (contienen nombres
  y voces de hablantes; revisar permisos antes de publicarlos).
- Si en el Bloque 3 las reservas apuntan a experiencias, el seed no podrá
  borrar una experiencia con reservas: habrá que marcarla inactiva en vez de
  borrarla.
- Agregar `faq/` a la estructura de CLAUDE.md.
- `test/app.e2e-spec.ts` (generado por Nest) no compila con `tsc` por
  `supertest/types`; no afecta `nest build` ni `npm test`.

### 2026-09-23 — Bloque 1: Emprendimientos
**Hecho:**
- Prefijo global `/api` en `main.ts`.
- Módulo `emprendimientos/` (generado con `nest g`) con entity `Emprendimiento`,
  service y controller.
- Endpoints: `GET /api/emprendimientos` (filtro opcional `?interes=`) y
  `GET /api/emprendimientos/:id`.
- Seed con 6 emprendimientos ficticios (`esEjemplo = true`): `npm run seed`
  dentro de `backend/`.
- Probado con la API corriendo: listar, filtrar, interés inválido (400),
  id inexistente (404), id no numérico (400). El seed se ejecutó dos veces
  sin duplicar filas. Lint y pruebas pasan.
- Verificada la conexión real del Bloque 0 (quedaba pendiente).

**Decisiones:**
- Descripción en 3 columnas (`descripcionEs/En/Pt`) en vez de JSON: más simple
  de leer y consultar.
- `intereses` como `text[]` de PostgreSQL, filtrado con `ArrayContains` (`@>`).
  Lista fija en `intereses.ts` (aves, delfines, gastronomia, artesanias,
  caminata), sin tildes; el filtro acepta mayúsculas. El agente usará la misma
  lista.
- Precio en COP entero (`precioBaseCop`) y duración en minutos enteros.
- Seed idempotente: en una transacción borra solo `esEjemplo = true` y vuelve a
  insertar; nunca toca emprendimientos reales. Usa `createApplicationContext`
  para reutilizar la conexión y el `.env` de la API.
- Datos de ejemplo con comunidades inventadas ("Comunidad Ejemplo …"),
  teléfonos falsos y sin palabras en lenguas indígenas, para no atribuir a
  comunidades reales ofertas que no han confirmado.
- `EmprendimientosService` se exporta para que lo use el agente (Bloque 4).

**Pendiente:**
- El seed cambia los `id` en cada ejecución. Cuando existan reservas
  (Bloque 3) que apunten a emprendimientos, habrá que decidir si el seed
  también limpia reservas de ejemplo o si actualiza en vez de borrar.
- Falta la referencia de precio en BRL (CLAUDE.md); probablemente en el
  frontend (Bloque 5).
- Las fotos (`fotoUrl`) están vacías en los datos de ejemplo.
- Choque de puertos: si hay PostgreSQL instalado en Windows ocupando el 5432,
  la API se conecta a ese en vez del de Docker y falla la contraseña. Solución
  local: `DB_PORT=5433` en `.env` y volver a hacer `docker compose up -d`.
  Evaluar dejar 5433 como valor por defecto en `.env.example`.

### 2026-09-22 — Base del backend: PostgreSQL en Docker + NestJS con TypeORM
**Hecho:**
- `docker-compose.yml` en la raíz con PostgreSQL 16 (alpine), volumen con nombre
  `ecoruta-pgdata` para conservar datos y healthcheck con `pg_isready`.
- `.env.example` con variables del servidor, base de datos, LLM y Wompi (sin
  claves reales). Cada integrante lo copia como `.env` en la raíz.
- Proyecto NestJS generado con `@nestjs/cli` en `backend/` (sin git anidado).
- Instalados `@nestjs/typeorm`, `typeorm`, `pg` y `@nestjs/config`.
- `AppModule` configura `ConfigModule` (global) y `TypeOrmModule.forRootAsync`.
- Verificado: `npm run build`, `npm run lint` y `npm test` pasan;
  `docker compose config` es válido.
- Aún no hay módulos de dominio (emprendimientos, reservas, etc.).

**Decisiones:**
- Un solo `.env` en la raíz del monorepo, compartido por Docker Compose y NestJS
  (`envFilePath: ['../.env', '.env']`), para no duplicar credenciales.
- `autoLoadEntities: true`: cada módulo registra sus entities con
  `TypeOrmModule.forFeature()`, sin lista central.
- `synchronize` controlado por `DB_SYNCHRONIZE` (true en desarrollo). Antes de
  tener datos reales conviene pasar a migraciones.
- NestJS 12 genera el proyecto como módulos ES (`"type": "module"`): los imports
  internos llevan extensión `.js` (ej. `./app.module.js`). Usa Vitest para
  pruebas y oxlint como linter (no Jest/ESLint como en tutoriales antiguos).

**Pendiente:**
- Probar la conexión real: Docker Desktop no estaba corriendo durante la tarea.
  Pasos: `docker compose up -d` y luego `npm run start:dev` en `backend/`.
- Configurar prefijo global `/api` y CORS para Capacitor en `main.ts`.
- `npm audit` reporta 5 vulnerabilidades solo en dependencias de desarrollo
  (producción: 0). No se aplicó `audit fix --force` para no romper versiones.
- Crear los módulos de dominio.

### 2026-09-22 — Definición del proyecto
**Hecho:** se definieron stack, arquitectura y reglas del proyecto (ver CLAUDE.md).
**Decisiones:** NestJS + TypeORM + PostgreSQL (Docker); frontend HTML/CSS/JS sin
framework como PWA; LLM detrás de `LlmProvider` (Gemini principal, Groq respaldo,
Mock para desarrollo); contenido cultural curado que no pasa por el LLM.
**Pendiente:** crear repositorio, inicializar NestJS, levantar PostgreSQL.
