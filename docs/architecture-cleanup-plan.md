# RAG Customs - Plan de Limpieza y Reorganizacion

## Diagnostico actual

- Hay mezcla de responsabilidades entre `app/api` (query/chat), `train/` (admin local), y modulos de acceso a datos.
- La UI principal (`components/chat-interface.tsx`) concentra demasiada logica y markup duplicado.
- Existen fuentes de verdad duplicadas para perfiles y acceso a Supabase, lo que provoca drift.
- Habia documentacion legada en `.kiro/` y `README` desalineada con la arquitectura actual.

## Objetivo de arquitectura

- `apps/web/` solo expone runtime web (chat/query + lectura de perfiles activos).
- `apps/train/` solo expone runtime admin local (CRUD perfiles + ingestion/process).
- `packages/*` concentra dominio, datos y contratos compartidos.
- `apps/web/components/` se divide en UI presentacional + hooks/client services.
- `docs/` mantiene decisiones, migraciones y convenciones vivas.

## Fronteras de sistema

- Web runtime (`apps/web/app/api/*`):
  - `chat`, `query`, `profiles`, `health`
  - Sin operaciones de entrenamiento pesado ni CRUD de admin.
- Train runtime (`apps/train/*`):
  - `upload`, `process`, `profiles`
  - Solo local; nunca deploy en Vercel.
- Dominio compartido (`packages/core`, `packages/data`, `packages/contracts`):
  - `profiles-service`: reglas y operaciones de perfiles
  - `supabase-client`: cliente centralizado
  - `contracts`: DTOs y tipos compartidos

## Fases de migracion

1. Fase 1 - Unificacion de dominio (completada)
- Mover y unificar operaciones de perfiles en `packages/core`.
- Hacer que `apps/web/app/api/profiles` y `apps/train/api/db.ts` consuman ese modulo.
- Mantener compatibilidad de APIs actuales.

2. Fase 2 - Modularizacion UI (en curso)
- Extraer de `chat-interface.tsx` componentes y hooks:
  - `ChatComposer`, `ChatSidebar`, `AuthModal`, `ChatMessageList`
  - `useProfiles`, `useChatSession`, `chat-api`

3. Fase 3 - Servicios por caso de uso (en curso)
- Separar handlers y servicios en train:
  - `apps/train/api/process-handlers.ts`
  - `apps/train/services/process-service.ts`
- Las rutas API solo enrutan y delegan.

4. Fase 4 - Normalizacion de contratos (en curso)
- Definir DTOs por endpoint en `packages/contracts`.
- Estandarizar errores (`code`, `message`, `details`).
- Agregar validacion de payload (zod o validadores internos).

5. Fase 5 - Hardening (pendiente)
- Tests unitarios para servicios compartidos.
- Tests de integracion para `app/api` y `train/api`.
- Limpieza de codigo muerto y archivos no usados.
- Actualizacion de `.agent/` + README en base a arquitectura final.

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
