# Estructura del Proyecto

Este documento describe la estructura actual del repositorio despues de mover la logica principal fuera de `n8n` y llevarla a codigo.

## Estructura Actual del Repositorio

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

## Responsabilidades del Frontend

- Recibir texto y PDFs para entrenamiento
- Enviar payloads de entrenamiento al backend
- Enviar preguntas del usuario
- Renderizar respuestas crudas orientadas a desarrollo

## Responsabilidades del Backend

- Recibir requests de entrenamiento y consulta
- Extraer texto desde archivos PDF
- Fragmentar contenido en chunks
- Generar embeddings con Gemini
- Insertar vectores en Supabase
- Consultar fragmentos relevantes desde Supabase
- Generar respuestas finales

## Almacenamiento Recomendado de Workflows Historicos

Aunque la aplicacion ya no use `n8n` en runtime, conviene commitear los workflows viejos como referencia historica.

Estructura recomendada:

```text
workflows/
|-- v1/
|   |-- workflow.json
|   `-- notes.md
`-- v2/
    |-- workflow.json
    `-- notes.md
```

## Plan de Commits Sugerido

1. Commit de documentacion y estructura actual de la app.
2. Commit de `workflows/v1` como baseline original.
3. Commit de `workflows/v2` como ultimo workflow antes de la migracion al backend.
4. Continuar mejoras de backend y UI desde esa base.
