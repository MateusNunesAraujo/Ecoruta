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

### 2026-09-22 — Definición del proyecto
**Hecho:** se definieron stack, arquitectura y reglas del proyecto (ver CLAUDE.md).
**Decisiones:** NestJS + TypeORM + PostgreSQL (Docker); frontend HTML/CSS/JS sin
framework como PWA; LLM detrás de `LlmProvider` (Gemini principal, Groq respaldo,
Mock para desarrollo); contenido cultural curado que no pasa por el LLM.
**Pendiente:** crear repositorio, inicializar NestJS, levantar PostgreSQL.
