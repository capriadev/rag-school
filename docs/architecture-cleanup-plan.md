# RAG Customs - Plan de Limpieza y Reorganizacion

## Diagnostico actual

- Hay mezcla de responsabilidades entre `app/api` (query/chat), `train/` (admin local), y modulos de acceso a datos.
- La UI principal (`components/chat-interface.tsx`) concentra demasiada logica y markup duplicado.
- Existen fuentes de verdad duplicadas para perfiles y acceso a Supabase, lo que provoca drift.
- La documentacion en `.kiro/` y los `README` tienen partes desactualizadas respecto al estado real.

## Objetivo de arquitectura

- `app/` solo expone runtime web (chat/query + lectura de perfiles activos).
- `train/` solo expone runtime admin local (CRUD perfiles + ingestion/process).
- `lib/server/` encapsula dominio y acceso a datos compartido.
- `components/` se divide en componentes UI chicos (presentational) y hooks de comportamiento.
- `docs/` mantiene decisiones, migraciones y convenciones vivas.

## Fronteras de sistema

- Web runtime (`app/api/*`):
  - `chat`, `query`, `profiles`, `health`, `keepalive`
  - Sin operaciones de entrenamiento pesado ni CRUD de admin.
- Train runtime (`train/*`):
  - `upload`, `process`, `profiles`
  - Solo local; nunca deploy en Vercel.
- Dominio compartido (`lib/server/*`):
  - `profiles.ts`: reglas y operaciones de perfiles
  - `supabase.ts`: cliente + operaciones de vector store
  - `chat.ts`, `llm.ts`, `embeddings.ts`, etc.

## Fases de migracion

1. Fase 1 - Unificacion de dominio (completada)
- Mover y unificar operaciones de perfiles en `lib/server/profiles.ts`.
- Hacer que `app/api/profiles` y `train/api/db.ts` consuman ese modulo.
- Mantener compatibilidad de APIs actuales.

2. Fase 2 - Modularizacion UI (en curso)
- Extraer de `chat-interface.tsx`:
  - `ChatHeader`
  - `ChatComposer`
  - `ProfileSelect`
  - `ChunkSelect`
  - `TokenUsageBar`
  - `MessageList`
- Crear hooks:
  - `useProfiles`
  - `useChatSession`
  - `useAutoResizeTextarea`

3. Fase 3 - Servicios por caso de uso
- Crear servicios de aplicacion:
  - `lib/server/services/query-service.ts`
  - `lib/server/services/train-service.ts`
  - `lib/server/services/chat-service.ts`
- Las rutas API solo validan request/response y delegan.

4. Fase 4 - Normalizacion de contratos
- Definir DTOs por endpoint en `lib/shared/contracts/*`.
- Estandarizar errores (`code`, `message`, `details`).
- Agregar validacion de payload (zod o validadores internos).

5. Fase 5 - Hardening
- Tests unitarios para servicios compartidos.
- Tests de integracion para `app/api` y `train/api`.
- Limpieza de codigo muerto y archivos no usados.
- Actualizacion de `.kiro` + README en base a arquitectura final.

## Primeras reglas de codificacion (aplicar desde ahora)

- Nada de logica de negocio dentro de componentes visuales.
- Nada de acceso directo a Supabase desde rutas si ya existe modulo de dominio.
- Cualquier logica duplicada en `app` y `train` debe vivir en `lib/server/`.
- Cada ruta API debe ser corta: parsea, valida, delega, responde.

## Entregables tecnicos por sprint de limpieza

- Sprint A:
  - Unificacion de perfiles (hecho)
  - Documento de arquitectura base (hecho)
  - Bootstrap monorepo (`apps/*` + `packages/*`) (hecho)
  - Inicializacion `.agent/` (hecho)
- Sprint B:
  - Primer corte de `chat-interface.tsx` en subcomponentes
  - Hook `useProfiles`
- Sprint C:
  - Servicios `query-service` y `train-service`
  - Contratos tipados compartidos
- Sprint D:
  - Test suite minima + limpieza final de deprecados
