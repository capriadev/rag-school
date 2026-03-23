import * as pdfParseModule from "pdf-parse"

const pdfParse = pdfParseModule.default || pdfParseModule

export async function extractPdfText(buffer) {
  const result = await pdfParse(buffer)
  return (result.text || "").trim()
}
