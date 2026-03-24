import { NextResponse } from "next/server"
import { config } from "../../../lib/server/config"
import { chunkText } from "../../../lib/server/chunking"
import { embedTexts } from "../../../lib/server/gemini"
import { extractPdfText } from "../../../lib/server/pdf"
import { insertDocuments } from "../../../lib/server/supabase"
import type { InsertDocument, SourceInput } from "../../../lib/shared/types"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const textInput = String(formData.get("text") || "").trim()
    const file = formData.get("file")
    const sources: SourceInput[] = []

    if (textInput) {
      sources.push({
        sourceType: "text",
        sourceName: "manual-text",
        content: textInput,
      })
    }

    if (file instanceof File) {
      if (file.type !== "application/pdf") {
        return NextResponse.json(
          {
            success: false,
            error: "Solo PDF esta soportado en esta primera migracion.",
          },
          { status: 400 },
        )
      }

      const buffer = Buffer.from(await file.arrayBuffer())
      const pdfText = await extractPdfText(buffer)

      if (!pdfText) {
        return NextResponse.json(
          {
            success: false,
            error: "No se pudo extraer texto del PDF.",
          },
          { status: 400 },
        )
      }

      sources.push({
        sourceType: "pdf",
        sourceName: file.name,
        content: pdfText,
      })
    }

    if (!sources.length) {
      return NextResponse.json(
        {
          success: false,
          error: "Debes enviar texto o un archivo PDF.",
        },
        { status: 400 },
      )
    }

    const preparedChunks = sources.flatMap((source) =>
      chunkText(source.content, {
        chunkSize: config.chunkSize,
        chunkOverlap: config.chunkOverlap,
      }).map((chunk, index) => ({
        content: chunk,
        metadata: {
          sourceType: source.sourceType,
          sourceName: source.sourceName,
          chunkIndex: index,
        },
      })),
    )

    if (!preparedChunks.length) {
      return NextResponse.json(
        {
          success: false,
          error: "No se generaron fragmentos para insertar.",
        },
        { status: 400 },
      )
    }

    const embeddings = await embedTexts(
      preparedChunks.map((item) => item.content),
      "RETRIEVAL_DOCUMENT",
    )

    const documents: InsertDocument[] = preparedChunks.map((item, index) => ({
      ...item,
      embedding: embeddings[index],
    }))

    const invalidDocument = documents.find(
      (item) => !Array.isArray(item.embedding) || item.embedding.length === 0,
    )

    if (invalidDocument) {
      throw new Error("Gemini devolvio un embedding vacio para uno de los fragmentos.")
    }

    const result = await insertDocuments(documents)

    return NextResponse.json({
      success: true,
      inserted: result.inserted,
      chunks: documents.length,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Training failed"

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 },
    )
  }
}
