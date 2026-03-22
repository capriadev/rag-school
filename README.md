# RAG School

Frontend client for a document-based RAG system oriented to educational use cases.

This repository currently contains the React + Vite client used to:
- send training content to an `n8n` workflow
- upload PDF files for ingestion
- query the knowledge base through a second `n8n` webhook
- inspect the raw response returned by the orchestration layer

The backend/orchestration layer lives outside this repository and is based on:
- `n8n` for workflow orchestration
- `Supabase` + `pgvector` for vector storage
- `Gemini Embeddings` for embedding generation
- an LLM node for final answer generation

## Current Scope

This repo is the client layer only. It does not contain:
- the exported n8n workflows
- SQL migrations or Supabase schema files
- environment variables for external services

Those artifacts should be added in the next commits as versioned workflow files.

## Features

- Manual training by plain text input
- Manual training by file upload
- Question submission to the RAG backend
- Basic handling for JSON and streaming responses
- Simple status feedback for training and querying

## Tech Stack

- React `18.2.0`
- React DOM `18.2.0`
- Vite `^8.0.1`

## Local Development

Requirements:
- Node.js 18+ recommended
- npm
- a running n8n instance reachable at `http://localhost:5678`

Install dependencies:

```bash
npm install
```

Start development server:

```bash
npm run dev
```

Build production bundle:

```bash
npm run build
```

Preview the build:

```bash
npm run preview
```

## Expected Backend Endpoints

The current client calls these endpoints directly:

- `POST http://localhost:5678/webhook/entrenar`
- `POST http://localhost:5678/webhook/consultar`

Training request:
- Sends `multipart/form-data`
- Field `text` for plain text training
- Field `file` for uploaded binary content

Consult request:
- Sends `application/json`
- Body shape:

```json
{
  "question": "What does the document say about user roles?"
}
```

## Frontend Flow

### Training

1. User writes text and/or selects a file.
2. The client builds a `FormData` payload.
3. The payload is sent to `/webhook/entrenar`.
4. The UI shows `processing`, `success`, or `error`.

### Querying

1. User submits a question.
2. The client sends JSON to `/webhook/consultar`.
3. If the response is streamed, chunks are appended live.
4. If the response is JSON, the payload is rendered as formatted output.

## Project Structure

```text
rag-school/
|-- src/
|   |-- App.jsx
|   |-- main.jsx
|   `-- styles.css
|-- docs/
|   |-- PROJECT_STRUCTURE.md
|   `-- PROJECT_STRUCTURE.es.md
|-- index.html
|-- package.json
|-- package-lock.json
|-- README.md
`-- README.es.md
```

## File Overview

- `src/App.jsx`: main UI, form handlers, webhook integration, response rendering.
- `src/main.jsx`: React entry point.
- `src/styles.css`: base visual styling for the client.
- `docs/PROJECT_STRUCTURE.md`: structure and versioning guidance in English.
- `docs/PROJECT_STRUCTURE.es.md`: structure and versioning guidance in Spanish.

## Recommended Next Repository Additions

To preserve workflow history cleanly, add a versioned folder structure like:

```text
workflows/
|-- v1/
|   |-- workflow.json
|   `-- notes.md
`-- v2/
    |-- workflow.json
    `-- notes.md
```

Suggested commit sequence:

1. Commit documentation and current client structure.
2. Add `workflows/v1` with the original workflow export.
3. Commit `workflows/v2` with the current Supabase-based workflow.
4. Continue with incremental improvements from that baseline.

## Notes

- The client currently uses hardcoded local webhook URLs.
- The current UI is intentionally minimal and oriented to workflow validation/debugging.
- If workflow endpoints change, `src/App.jsx` must be updated accordingly.
