# Project Structure

This document describes the current repository layout after moving the core logic out of `n8n` and into application code.

## Current Repository Layout

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

## Frontend Responsibilities

- Collect text and PDF files for training
- Submit training payloads to the backend
- Submit user questions
- Render development-oriented raw responses

## Backend Responsibilities

- Receive training and query requests
- Extract text from PDF files
- Split content into chunks
- Generate embeddings with Gemini
- Insert vectors into Supabase
- Query relevant chunks from Supabase
- Generate final answers

## Recommended Historical Workflow Storage

Even though the app is no longer using `n8n` at runtime, the old workflows should still be committed as historical references.

Recommended layout:

```text
workflows/
|-- v1/
|   |-- workflow.json
|   `-- notes.md
`-- v2/
    |-- workflow.json
    `-- notes.md
```

## Suggested Commit Plan

1. Commit documentation and current app structure.
2. Commit `workflows/v1` as the original workflow baseline.
3. Commit `workflows/v2` as the latest workflow before backend migration.
4. Continue backend and UI improvements from there.
