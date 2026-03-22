# RAG School

RAG School is now a full application repository with:
- a React + Vite client
- a Node.js backend that replaces the previous `n8n` workflow logic

The current goal is to keep the same functional flow in code:
- train the knowledge base with plain text
- train the knowledge base with PDF files
- store embeddings in Supabase with `pgvector`
- retrieve relevant chunks for a question
- generate the final answer with Groq

## Current Architecture

### Frontend

The frontend is a lightweight client used to:
- submit text and PDF files for training
- send user questions
- display raw JSON responses during development

### Backend

The backend now owns the logic that previously lived in `n8n`:
- request validation
- PDF text extraction
- chunking
- embedding generation
- Supabase inserts
- semantic retrieval
- final response generation

## Tech Stack

- React `18.2.0`
- Vite `^8.0.1`
- Express `^5.2.1`
- Supabase JS `^2.100.0`
- Google GenAI SDK `^1.46.0`
- Groq SDK `^1.1.1`
- Multer for file uploads
- pdf-parse for PDF ingestion

## Environment Variables

Create a local `.env` based on `.env.example`.

Main variables:
- `PORT`
- `VITE_API_BASE_URL`
- `GEMINI_API_KEY`
- `GEMINI_EMBEDDING_MODEL`
- `GEMINI_EMBEDDING_DIMENSION`
- `GEMINI_LLM_MODEL`
- `GROQ_API_KEY`
- `GROQ_MODEL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_DOCUMENTS_TABLE`
- `SUPABASE_MATCH_FUNCTION`

## Local Development

Install dependencies:

```bash
npm install
```

Run the frontend:

```bash
npm run dev
```

Run the backend:

```bash
npm run server
```

For backend development with file watching:

```bash
npm run dev:server
```

Build the frontend:

```bash
npm run build
```

## API Endpoints

### `POST /api/train`

Training endpoint for:
- plain text via `text`
- PDF via `file`

Request format:
- `multipart/form-data`

Returns:
- insertion status
- number of generated chunks
- number of inserted records

### `POST /api/query`

Query endpoint for semantic retrieval plus answer generation.

Request body:

```json
{
  "question": "What does the document say about user roles?"
}
```

Returns:
- generated answer
- retrieved matches

## Project Structure

```text
rag-school/
|-- docs/
|   |-- PROJECT_STRUCTURE.md
|   `-- PROJECT_STRUCTURE.es.md
|-- server/
|   |-- config.js
|   |-- index.js
|   `-- services/
|       |-- chunking.js
|       |-- gemini.js
|       |-- pdf.js
|       `-- supabase.js
|-- src/
|   |-- App.jsx
|   |-- main.jsx
|   `-- styles.css
|-- .env.example
|-- index.html
|-- package.json
|-- package-lock.json
|-- README.md
`-- README.es.md
```

## Notes

- This is the first backend migration away from `n8n`.
- The current backend version supports PDF ingestion only for binary files.
- Historical workflow exports should still be committed separately under versioned folders such as `workflows/v1` and `workflows/v2`.
- Groq is the primary answer model and Gemini remains in use for embeddings.
