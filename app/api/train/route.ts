import { NextResponse } from "next/server"
import { chunkText } from "../../../lib/server/chunking"
import { embedTexts } from "../../../lib/server/embeddings"
import { extractSourceFromFile } from "../../../lib/server/ingestion"
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
      const extractedSource = await extractSourceFromFile(file)

      if (!extractedSource.content.trim()) {
        return NextResponse.json(
          {
            success: false,
            error: `No se pudo extraer contenido util del archivo ${file.name}.`,
          },
          { status: 400 },
        )
      }

      sources.push(extractedSource)
    }

    if (!sources.length) {
      return NextResponse.json(
        {
          success: false,
          error: "Debes enviar texto o un archivo soportado.",
        },
        { status: 400 },
      )
    }

    const preparedChunks = sources.flatMap((source) =>
      chunkText(source.content).map((chunk, index) => ({
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
      sources: sources.length,
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
