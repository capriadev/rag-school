# RAG Custom - Training Backend

Sistema de entrenamiento local para RAG. **NO se deploya a Vercel** - solo funciona en desarrollo local.

## Inicio Rápido

```bash
# 1. Asegurarte de tener n8n corriendo en Docker
docker start n8n

# 2. Iniciar el backend de entrenamiento
npm run train

# 3. Abrir UI en navegador
open http://localhost:3001
```

## Estructura

```
train/
├── index.ts          # Servidor Express (puerto 3001)
├── admin.html        # UI de administración
├── api/
│   ├── upload.ts     # POST /api/upload - Subir archivos
│   └── process.ts    # POST /api/process - Enviar a n8n
└── uploads/          # Archivos subidos (auto-creado)
```

## API Endpoints

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/` | GET | UI de administración |
| `/health` | GET | Health check |
| `/api/status` | GET | Estado del sistema |
| `/api/upload` | POST | Subir archivo (multipart/form-data) |
| `/api/upload/list` | GET | Listar archivos subidos |
| `/api/process` | POST | Enviar archivo a n8n |
| `/api/process/status` | GET | Ver estado de un job |
| `/api/process/jobs` | GET | Listar todos los jobs |

## Variables de Entorno

```env
TRAIN_PORT=3001                    # Puerto del servidor
N8N_WEBHOOK_URL=http://localhost:5678/webhook/train
```

## Flujo de Uso

1. **Subir archivo**: `POST /api/upload` con `file` y `profileId`
2. **Procesar**: `POST /api/process` con `fileId` y `profileId`
3. **Ver estado**: `GET /api/process/status?jobId=xxx`

El procesamiento es asíncrono. El backend envía el archivo al webhook de n8n y espera respuesta.

## Notas

- La carpeta `train/` está excluida del build de Next.js (Vercel)
- Los archivos subidos se guardan en `train/uploads/`
- Los jobs se mantienen en memoria (se pierden al reiniciar)
