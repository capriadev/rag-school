# Estructura del Proyecto

Layout actual del repositorio despues del bootstrap de migracion modular:

```text
rag-school/
|-- apps/
|   |-- web/                    # Runtime Next.js (chat/query)
|   |   |-- app/
|   |   |-- components/
|   |   |-- lib/
|   |   `-- public/
|   `-- train/                  # Runtime local de entrenamiento (Express + admin UI)
|       |-- api/
|       |-- admin.html
|       `-- index.ts
|-- packages/
|   |-- core/                   # servicios de dominio compartidos (bootstrap)
|   |-- data/                   # capa de datos compartida (bootstrap)
|   |-- contracts/              # contratos API/errores compartidos
|   |-- ui/                     # tokens/componentes UI compartidos (bootstrap)
|   `-- config/                 # placeholder de configuracion compartida
|-- .agent/                     # contexto operativo del agente y registro de errores
|-- docs/
|-- scripts/
|-- supabase/
|-- package.json                # raiz con npm workspaces
`-- tsconfig.base.json
```

## Separacion de runtimes

- `apps/web`: runtime deployable para usuarios.
- `apps/train`: runtime local-only para entrenamiento.
- La logica compartida se debe mover progresivamente a `packages/*` para eliminar duplicados.

## Estado actual de migracion

- Estructura fisica migrada a workspaces.
- Scripts raiz orquestan `web` y `train`.
- `.agent/` inicializado con contexto, playbook, herramientas, skills y log de errores.
- Siguiente paso: extraer logica de `apps/web/lib` y `apps/train/api` hacia `packages/core` + `packages/data`.
