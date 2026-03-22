# Estructura del Proyecto

Este documento describe la estructura actual del repositorio y la forma recomendada de guardar versiones del workflow.

## Estructura Actual del Repositorio

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

## Responsabilidades del Frontend

- Recibir texto y archivos de entrenamiento desde la UI
- Enviar payloads de entrenamiento al webhook `entrenar`
- Enviar preguntas al webhook `consultar`
- Renderizar respuestas JSON o texto en streaming

## Versionado Recomendado de Workflows

Cuando agregues exportaciones de n8n, conviene guardarlas por carpeta y no sobrescribir un único archivo.

Estructura recomendada:

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

## Contenido Sugerido Para Cada Versión

### `workflow.json`

Archivo exportado de n8n para esa versión.

### `notes.md`

Conviene dejar una nota corta con:
- propósito de la versión
- nodos principales
- modelo de almacenamiento usado
- limitaciones conocidas
- notas de migración hacia la siguiente versión

Plantilla sugerida:

```md
# Workflow vX

## Propósito

Descripción breve.

## Componentes Principales

- Webhook de entrenamiento
- Webhook de consulta
- Proveedor de embeddings
- Vector store
- LLM

## Notas

- Detalle importante de implementación
- Limitación conocida
- Motivo de migración a la siguiente versión
```

## Plan de Commits Sugerido

1. Commit de documentación del proyecto.
2. Agregar `workflows/v1`.
3. Agregar `workflows/v2`.
4. Continuar el desarrollo de mejoras desde esa base.
