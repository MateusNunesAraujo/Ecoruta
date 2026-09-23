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
