import cors from "cors"
import express from "express"
import multer from "multer"
import { config } from "./config.js"
import { chunkText } from "./services/chunking.js"
import { embedTexts } from "./services/gemini.js"
import { generateAnswer } from "./services/llm.js"
import { extractPdfText } from "./services/pdf.js"
import { insertDocuments, matchDocuments } from "./services/supabase.js"

const app = express()
const upload = multer({ storage: multer.memoryStorage() })

app.use(cors())
app.use(express.json({ limit: "2mb" }))

app.get("/api/health", (_req, res) => {
  res.json({ ok: true })
})

app.post("/api/train", upload.single("file"), async (req, res) => {
  try {
    const textInput = String(req.body.text || "").trim()
    const file = req.file
    const sources = []

    if (textInput) {
      sources.push({
        sourceType: "text",
        sourceName: "manual-text",
        content: textInput,
      })
    }

    if (file) {
      if (file.mimetype !== "application/pdf") {
        return res.status(400).json({
          success: false,
          error: "Solo PDF esta soportado en esta primera migracion.",
        })
      }

      const pdfText = await extractPdfText(file.buffer)

      if (!pdfText) {
        return res.status(400).json({
          success: false,
          error: "No se pudo extraer texto del PDF.",
        })
      }

      sources.push({
        sourceType: "pdf",
        sourceName: file.originalname,
        content: pdfText,
      })
    }

    if (!sources.length) {
      return res.status(400).json({
        success: false,
        error: "Debes enviar texto o un archivo PDF.",
      })
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
      return res.status(400).json({
        success: false,
        error: "No se generaron fragmentos para insertar.",
      })
    }

    const embeddings = await embedTexts(
      preparedChunks.map((item) => item.content),
      "RETRIEVAL_DOCUMENT",
    )

    const documents = preparedChunks.map((item, index) => ({
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

    res.json({
      success: true,
      inserted: result.inserted,
      chunks: documents.length,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || "Training failed",
    })
  }
})

app.post("/api/query", async (req, res) => {
  try {
    const question = String(req.body.question || "").trim()

    if (!question) {
      return res.status(400).json({
        success: false,
        error: "La pregunta es obligatoria.",
      })
    }

    const [embedding] = await embedTexts([question], "RETRIEVAL_QUERY")

    if (!embedding?.length) {
      throw new Error("No se pudo generar el embedding de la consulta.")
    }

    const matches = await matchDocuments({
      embedding,
      matchCount: config.queryMatchCount,
      filter: {},
    })

    const contexts = matches.map((match, index) => {
      const similarity =
        typeof match.similarity === "number"
          ? ` (similitud ${(match.similarity * 100).toFixed(1)}%)`
          : ""

      return `[Fragmento ${index + 1}${similarity}]\n${match.content}`
    })

    const answer = await generateAnswer({ question, contexts })

    res.json({
      success: true,
      answer,
      matches,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || "Query failed",
    })
  }
})

app.listen(config.port, () => {
  console.log(`Backend listening on http://localhost:${config.port}`)
})
