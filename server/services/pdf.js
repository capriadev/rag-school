import pdfParse from "pdf-parse"

export async function extractPdfText(buffer) {
  const result = await pdfParse(buffer)
  return (result.text || "").trim()
}
