# Project Structure

Current repo layout after modular migration bootstrap:

```text
rag-school/
|-- apps/
|   |-- web/                    # Next.js runtime (chat/query)
|   |   |-- app/
|   |   |-- components/
|   |   |-- lib/
|   |   `-- public/
|   `-- train/                  # Local training runtime (Express + admin UI)
|       |-- api/
|       |-- admin.html
|       `-- index.ts
|-- packages/
|   |-- core/                   # shared domain services (bootstrap)
|   |-- data/                   # shared data layer (bootstrap)
|   |-- contracts/              # shared API contracts/error envelope
|   |-- ui/                     # shared design tokens/components (bootstrap)
|   `-- config/                 # shared config package placeholder
|-- .agent/                     # agent operational context and logs
|-- docs/
|-- scripts/
|-- supabase/
|-- package.json                # npm workspaces root
`-- tsconfig.base.json
```

## Runtime Split

- `apps/web`: deployable web runtime.
- `apps/train`: local-only training runtime.
- Shared logic should progressively move to `packages/*` to remove duplication.

## Current Migration Status

- Physical structure migrated to monorepo workspaces.
- Root scripts orchestrate web/train through workspace commands.
- `.agent/` initialized with context, playbook, tools, skills catalog, and error log.
- Next steps: continue extracting domain logic from `apps/web/lib` and `apps/train/api` into `packages/core` + `packages/data`.
