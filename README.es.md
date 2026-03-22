# RAG School

RAG School ahora es un repositorio de aplicacion completo con:
- un cliente en React + Vite
- un backend en Node.js que reemplaza la logica anterior de `n8n`

La meta actual es conservar el mismo flujo funcional en codigo:
- entrenar la base de conocimiento con texto plano
- entrenar la base de conocimiento con archivos PDF
- guardar embeddings en Supabase con `pgvector`
- recuperar fragmentos relevantes para una pregunta
- generar la respuesta final con Groq

## Arquitectura Actual

### Frontend

El frontend es un cliente liviano que se usa para:
- enviar texto y PDFs para entrenamiento
- enviar preguntas del usuario
- mostrar respuestas JSON crudas durante desarrollo

### Backend

El backend ahora se encarga de la logica que antes vivia en `n8n`:
- validacion de requests
- extraccion de texto desde PDF
- chunking
- generacion de embeddings
- inserciones en Supabase
- recuperacion semantica
- generacion de respuesta final

## Stack Tecnologico

- React `18.2.0`
- Vite `^8.0.1`
- Express `^5.2.1`
- Supabase JS `^2.100.0`
- Google GenAI SDK `^1.46.0`
- Groq SDK `^1.1.1`
- Multer para upload de archivos
- pdf-parse para ingestion de PDF

## Variables de Entorno

Crea un `.env` local a partir de `.env.example`.

Variables principales:
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

## Desarrollo Local

Instalar dependencias:

```bash
npm install
```

Levantar el frontend:

```bash
npm run dev
```

Levantar el backend:

```bash
npm run server
```

Para desarrollo del backend con watch:

```bash
npm run dev:server
```

Compilar el frontend:

```bash
npm run build
```

## Endpoints de API

### `POST /api/train`

Endpoint de entrenamiento para:
- texto plano via `text`
- PDF via `file`

Formato del request:
- `multipart/form-data`

Devuelve:
- estado de insercion
- cantidad de chunks generados
- cantidad de registros insertados

### `POST /api/query`

Endpoint de consulta para recuperacion semantica mas generacion de respuesta.

Body del request:

```json
{
  "question": "Que dice el documento sobre roles de usuario?"
}
```

Devuelve:
- respuesta generada
- matches recuperados

## Estructura del Proyecto

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

## Notas

- Esta es la primera migracion de backend fuera de `n8n`.
- Esta version inicial del backend soporta solo PDF para archivos binarios.
- Las exportaciones historicas de workflows conviene seguir guardandolas aparte en carpetas versionadas como `workflows/v1` y `workflows/v2`.
- Groq queda como modelo principal de respuesta y Gemini sigue usandose para embeddings.
