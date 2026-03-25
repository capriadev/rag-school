# RAG School

RAG School es una aplicacion en Next.js para entrenar y consultar un vector store en Supabase.

Reemplaza el workflow anterior de n8n con codigo de aplicacion para:
- ingestion y chunking
- generacion de embeddings con Gemini
- recuperacion semantica desde Supabase pgvector
- generacion final de respuestas con Groq

## Stack Actual

- Next.js App Router
- React 18
- TypeScript
- Supabase JS
- Google GenAI SDK
- Groq SDK
- `pdf-parse`
- `xlsx`
- `jszip`

## Que Hace La App

### Flujo de consulta

- recibe una pregunta del usuario
- recupera una cantidad configurable de fragmentos desde Supabase
- elige el modelo de Groq segun la cantidad de chunks
- rota entre API keys de Groq y modelos fallback
- devuelve la respuesta final mas los matches recuperados

### Flujo de entrenamiento

- acepta texto manual
- acepta archivos para ingestion
- extrae texto o contexto semantico
- divide el contenido en chunks
- genera embeddings con Gemini
- guarda vectores en Supabase

Tipos de archivo soportados:
- texto
- PDF
- CSV
- Excel: `xls`, `xlsx`, `ods`
- PowerPoint: `pptx`
- imagen
- audio
- video

Notas:
- la extraccion de imagen/audio/video usa Gemini multimodal
- el formato binario viejo `ppt` no esta soportado
- el entrenamiento actualmente acepta un archivo por request

## Variables de Entorno

Crea `.env` a partir de `.env.example`.

Variables requeridas:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_DOCUMENTS_TABLE`
- `SUPABASE_MATCH_FUNCTION`
- `GEMINI_API_KEY`
- `GEMINI_API_KEY_2` opcional
- `GEMINI_API_KEY_3` opcional
- `GROQ_API_KEY`
- `GROQ_API_KEY_2` opcional
- `GROQ_API_KEY_3` opcional

## Desarrollo Local

Instalar dependencias:

```bash
npm install
```

Levantar la app:

```bash
npm run dev
```

Si en desarrollo empiezan a aparecer `404` en `/_next/static/...` y la UI pierde estilos, lo mas probable es que el cache local de Next haya quedado desincronizado. `npm run dev` ahora limpia `.next` y la salida vieja de `dist` antes de arrancar para reducir ese problema.

El wrapper local de desarrollo tambien habilita file watching por polling para comportarse de forma mas consistente en Windows.

Compilar produccion:

```bash
npm run build
```

Levantar produccion:

```bash
npm run start
```

La app usa un unico runtime de Next.js. Frontend y backend ya no se levantan por separado.

## Rutas API

### `POST /api/train`

Endpoint multipart para entrenamiento.

Entradas:
- `text`
- `file`

Devuelve:
- registros insertados
- cantidad de chunks generados
- cantidad de fuentes procesadas

### `GET /api/train/metrics`

Devuelve metricas del vector store:
- uso estimado de almacenamiento
- chunks totales
- fuentes unicas
- desglose por tipo de fuente

### `GET /api/train/export`

Descarga un snapshot JSON de la tabla actual del vector store.

### `POST /api/query`

Endpoint JSON de consulta.

Ejemplo de body:

```json
{
  "question": "Que dice el material sobre roles de usuario?",
  "chunkCount": 5
}
```

## Estructura Del Proyecto

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

## Base De Datos

El esquema SQL usado para pgvector esta guardado en:

- [supabase/schema.sql](/d:/1__Programacion/1-programacion/1__FrontEnd/1__Small%20projects/rag-school/supabase/schema.sql)

Define:
- extension `vector`
- tabla `documents`
- funcion de similitud `match_documents`

## Notas

- Groq se usa solo para la generacion final de respuestas.
- Gemini se usa para embeddings y extraccion multimodal.
- La pagina de entrenamiento ahora incluye metricas del vector store y herramientas de exportacion.
