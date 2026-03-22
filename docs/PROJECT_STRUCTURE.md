# Project Structure

This document describes the current repository layout and the recommended way to store workflow versions.

## Current Repository Layout

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

## Frontend Responsibilities

- Collect training text and files from the user
- Send training payloads to the `entrenar` webhook
- Send questions to the `consultar` webhook
- Render raw JSON or streamed text responses

## Recommended Workflow Versioning

When adding n8n exports, keep them versioned by folder instead of overwriting a single file.

Recommended layout:

```text
workflows/
|-- v1/
|   |-- workflow.json
|   `-- notes.md
|-- v2/
|   |-- workflow.json
|   `-- notes.md
`-- current/
    `-- README.md
```

## Suggested Contents For Each Workflow Version

### `workflow.json`

The exported n8n workflow file for that version.

### `notes.md`

Keep a short note with:
- purpose of the version
- major nodes used
- storage model used
- known limitations
- migration notes to the next version

Suggested template:

```md
# Workflow vX

## Purpose

Short description.

## Main Components

- Training webhook
- Query webhook
- Embeddings provider
- Vector store
- LLM

## Notes

- Important implementation detail
- Known limitation
- Migration reason to next version
```

## Suggested Commit Plan

1. Commit project documentation.
2. Add `workflows/v1`.
3. Add `workflows/v2`.
4. Continue feature work from there.
