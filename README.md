# RAG School (Monorepo Bootstrap)

RAG School is now organized as an npm workspaces monorepo with separated runtimes:

- `apps/web`: Next.js app for chat/query.
- `apps/train`: local training backend (Express + admin UI).
- `packages/*`: shared modules (currently bootstrap stage).

## Commands

From repository root:

```bash
npm install
npm run dev        # web runtime
npm run train      # local training runtime
npm run build      # build web runtime
npm run start      # start web runtime
```

Workspace explicit commands:

```bash
npm run dev -w @rag/web
npm run dev -w @rag/train
```

## Environment

Root `.env` is the source of truth. Shared config loads local workspace `.env` first and falls back to monorepo root `.env`.

Required variables (same as before):

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY` (+ optional sequential keys)
- `GROQ_API_KEY` (+ optional sequential keys)

## Notes

- Training remains local-only.
- Web and train are physically separated.
- Shared package extraction is in progress; see `docs/architecture-cleanup-plan.md`.
