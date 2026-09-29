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
