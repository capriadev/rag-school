# RAG School (Bootstrap Monorepo)

RAG School ahora esta organizado como monorepo con npm workspaces y runtimes separados:

- `apps/web`: app Next.js para chat/query.
- `apps/train`: backend local de entrenamiento (Express + admin UI).
- `packages/*`: modulos compartidos (en etapa bootstrap).

## Comandos

Desde la raiz:

```bash
npm install
npm run dev        # runtime web
npm run train      # runtime local de entrenamiento
npm run build      # build del runtime web
npm run start      # iniciar runtime web
```

Comandos por workspace:

```bash
npm run dev -w @rag/web
npm run dev -w @rag/train
```

## Entorno

El `.env` raiz sigue siendo la fuente principal. La config compartida intenta cargar primero `.env` del workspace y luego hace fallback al `.env` de la raiz.

Variables requeridas (igual que antes):

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY` (+ opcionales secuenciales)
- `GROQ_API_KEY` (+ opcionales secuenciales)

## Notas

- Entrenamiento sigue siendo local-only.
- Web y train ya estan separados fisicamente.
- La extraccion de paquetes compartidos sigue en progreso; ver `docs/architecture-cleanup-plan.md`.
