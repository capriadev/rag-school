# RAG School

RAG School is a Next.js application for training and querying a Supabase-based vector store.

It replaces the previous n8n workflow with application code for:
- ingestion and chunking
- embedding generation with Gemini
- semantic retrieval from Supabase pgvector
- final answer generation with Groq

## Current Stack

- Next.js App Router
- React 18
- TypeScript
- Supabase JS
- Google GenAI SDK
- Groq SDK
- `pdf-parse`
- `xlsx`
- `jszip`

## What The App Does

### Query flow

- accepts a user question
- retrieves configurable chunk counts from Supabase
- chooses the Groq model according to chunk count
- rotates across Groq API keys and model fallbacks
- returns the final answer plus retrieved matches

### Training flow

- accepts manual text
- accepts files for ingestion
- extracts text or semantic context
- chunks content
- creates Gemini embeddings
- stores vectors in Supabase

Supported file types:
- text
- PDF
- CSV
- Excel: `xls`, `xlsx`, `ods`
- PowerPoint: `pptx`
- image
- audio
- video

Notes:
- image/audio/video extraction uses Gemini multimodal processing
- `ppt` legacy binary format is not supported
- training currently accepts one uploaded file per request

## Environment Variables

Create `.env` from `.env.example`.

Required variables:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_DOCUMENTS_TABLE`
- `SUPABASE_MATCH_FUNCTION`
- `GEMINI_API_KEY`
- `GEMINI_API_KEY_2` optional
- `GEMINI_API_KEY_3` optional
- `GROQ_API_KEY`
- `GROQ_API_KEY_2` optional
- `GROQ_API_KEY_3` optional

## Local Development

Install dependencies:

```bash
npm install
```

Run the app:

```bash
npm run dev
```

If development ever starts returning `404` for `/_next/static/...` files and the UI loses styles, the local Next cache is likely desynchronized. `npm run dev` now clears `.next` and old `dist` output before starting to reduce that issue.

Build production:

```bash
npm run build
```

Run production:

```bash
npm run start
```

The app uses a single Next.js runtime. Frontend and backend are no longer started separately.

## API Routes

### `POST /api/train`

Multipart training endpoint.

Inputs:
- `text`
- `file`

Returns:
- inserted records
- generated chunk count
- processed source count

### `GET /api/train/metrics`

Returns vector store metrics:
- estimated storage usage
- total chunks
- unique sources
- source type breakdown

### `GET /api/train/export`

Downloads a JSON snapshot of the current vector store table.

### `POST /api/query`

JSON query endpoint.

Example body:

```json
{
  "question": "What does the material say about user roles?",
  "chunkCount": 5
}
```

## Project Structure

```text
rag-school/
|-- app/
|   |-- api/
|   |   |-- health/
|   |   |-- query/
|   |   `-- train/
|   |       |-- export/
|   |       `-- metrics/
|   |-- train/
|   |-- globals.css
|   |-- layout.tsx
|   `-- page.tsx
|-- components/
|   `-- rag-shell.tsx
|-- lib/
|   |-- server/
|   |   |-- chunking.ts
|   |   |-- config.ts
|   |   |-- embeddings.ts
|   |   |-- ingestion.ts
|   |   |-- llm.ts
|   |   |-- multimodal.ts
|   |   |-- office.ts
|   |   |-- pdf.ts
|   |   `-- supabase.ts
|   `-- shared/
|       |-- llm.ts
|       `-- types.ts
|-- supabase/
|   `-- schema.sql
|-- .env.example
|-- package.json
|-- README.md
`-- README.es.md
```

## Database

The SQL schema used for pgvector setup is stored at:

- [supabase/schema.sql](/d:/1__Programacion/1-programacion/1__FrontEnd/1__Small%20projects/rag-school/supabase/schema.sql)

It defines:
- `vector` extension
- `documents` table
- `match_documents` similarity function

## Notes

- Groq is only used for final answer generation.
- Gemini is used for embeddings and multimodal extraction.
- The training page now includes vector store metrics and export tools.
