import path from "node:path"
import { extractSpreadsheetText, extractCsvText, extractPresentationText } from "./office"
// import { extractPdfText } from "./pdf"
import { extractMultimodalText } from "./multimodal"
import type { SourceInput } from "../shared/types"

const SPREADSHEET_MIME_TYPES = new Set([
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.oasis.opendocument.spreadsheet",
])

function getExtension(fileName: string): string {
  return path.extname(fileName || "").toLowerCase()
}

export async function extractSourceFromFile(file: File): Promise<SourceInput> {
  const buffer = Buffer.from(await file.arrayBuffer())
  const extension = getExtension(file.name)

  if (file.type === "application/pdf" || extension === ".pdf") {
    throw new Error("PDFs deben procesarse via workflow n8n. Usa el boton 'Workflow n8n'.")
  }

  if (file.type === "text/csv" || extension === ".csv") {
    return {
      sourceType: "csv",
      sourceName: file.name,
      content: extractCsvText(buffer),
    }
  }

  if (
    SPREADSHEET_MIME_TYPES.has(file.type) ||
    extension === ".xlsx" ||
    extension === ".xls" ||
    extension === ".ods"
  ) {
    return {
      sourceType: "spreadsheet",
      sourceName: file.name,
      content: extractSpreadsheetText(buffer),
    }
  }

  if (
    file.type === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
    extension === ".pptx"
  ) {
    return {
      sourceType: "presentation",
      sourceName: file.name,
      content: await extractPresentationText(buffer),
    }
  }

  if (file.type.startsWith("image/")) {
    return {
      sourceType: "image",
      sourceName: file.name,
      content: await extractMultimodalText({
        buffer,
        fileName: file.name,
        mimeType: file.type,
        sourceType: "image",
      }),
    }
  }

  if (file.type.startsWith("audio/")) {
    return {
      sourceType: "audio",
      sourceName: file.name,
      content: await extractMultimodalText({
        buffer,
        fileName: file.name,
        mimeType: file.type,
        sourceType: "audio",
      }),
    }
  }

  if (file.type.startsWith("video/")) {
    return {
      sourceType: "video",
      sourceName: file.name,
      content: await extractMultimodalText({
        buffer,
        fileName: file.name,
        mimeType: file.type,
        sourceType: "video",
      }),
    }
  }

  throw new Error(`Tipo de archivo no soportado: ${file.type || extension || file.name}`)
}
