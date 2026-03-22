# RAG School

Cliente frontend para un sistema RAG orientado a documentos y casos de uso educativos.

Este repositorio contiene actualmente el cliente en React + Vite usado para:
- enviar contenido de entrenamiento a un workflow de `n8n`
- subir archivos PDF para ingestion
- consultar la base de conocimiento mediante otro webhook de `n8n`
- inspeccionar la respuesta cruda devuelta por la capa de orquestacion

La capa backend/orquestacion vive fuera de este repositorio y se basa en:
- `n8n` para orquestacion de workflows
- `Supabase` + `pgvector` para almacenamiento vectorial
- `Gemini Embeddings` para generacion de embeddings
- un nodo LLM para generar la respuesta final

## Alcance Actual

Este repo contiene solo la capa cliente. No incluye:
- los workflows exportados de n8n
- migraciones SQL o archivos de esquema de Supabase
- variables de entorno de servicios externos

Esos artefactos deberian agregarse en los proximos commits como archivos versionados del workflow.

## Funcionalidades

- Entrenamiento manual por texto plano
- Entrenamiento manual por carga de archivos
- Envio de preguntas al backend RAG
- Manejo basico de respuestas JSON y streaming
- Feedback simple de estado para entrenamiento y consulta

## Stack Tecnologico

- React `18.2.0`
- React DOM `18.2.0`
- Vite `^8.0.1`

## Desarrollo Local

Requisitos:
- Node.js 18+ recomendado
- npm
- una instancia de n8n corriendo en `http://localhost:5678`

Instalar dependencias:

```bash
npm install
```

Iniciar servidor de desarrollo:

```bash
npm run dev
```

Compilar para produccion:

```bash
npm run build
```

Previsualizar el build:

```bash
npm run preview
```

## Endpoints Esperados del Backend

El cliente actual llama directamente a estos endpoints:

- `POST http://localhost:5678/webhook/entrenar`
- `POST http://localhost:5678/webhook/consultar`

Request de entrenamiento:
- envia `multipart/form-data`
- campo `text` para entrenamiento en texto plano
- campo `file` para contenido binario subido

Request de consulta:
- envia `application/json`
- estructura del body:

```json
{
  "question": "Que dice el documento sobre roles de usuario?"
}
```

## Flujo del Frontend

### Entrenamiento

1. El usuario escribe texto y/o selecciona un archivo.
2. El cliente construye un payload `FormData`.
3. El payload se envia a `/webhook/entrenar`.
4. La UI muestra `processing`, `success` o `error`.

### Consulta

1. El usuario envia una pregunta.
2. El cliente manda JSON a `/webhook/consultar`.
3. Si la respuesta llega en streaming, los chunks se agregan en vivo.
4. Si la respuesta llega como JSON, se renderiza formateada.

## Estructura del Proyecto

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

## Resumen de Archivos

- `src/App.jsx`: UI principal, handlers de formularios, integracion con webhooks y render de respuestas.
- `src/main.jsx`: punto de entrada de React.
- `src/styles.css`: estilos base del cliente.
- `docs/PROJECT_STRUCTURE.md`: guia de estructura y versionado en ingles.
- `docs/PROJECT_STRUCTURE.es.md`: guia de estructura y versionado en espanol.

## Proximos Agregados Recomendados al Repo

Para preservar bien la historia de workflows, conviene agregar una estructura versionada como:

```text
workflows/
|-- v1/
|   |-- workflow.json
|   `-- notes.md
`-- v2/
    |-- workflow.json
    `-- notes.md
```

Secuencia sugerida de commits:

1. Commit de documentacion y estructura actual del cliente.
2. Agregar `workflows/v1` con la exportacion original del workflow.
3. Commit de `workflows/v2` con el workflow actual basado en Supabase.
4. Continuar mejoras incrementales desde esa base.

## Notas

- El cliente usa URLs locales hardcodeadas para los webhooks.
- La UI actual es minima y esta orientada a validacion/debug del workflow.
- Si cambian los endpoints del workflow, hay que actualizar `src/App.jsx`.
