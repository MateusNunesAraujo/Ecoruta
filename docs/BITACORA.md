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
