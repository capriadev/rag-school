import JSZip from "jszip"
import * as XLSX from "xlsx"

function decodeXmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#10;/g, "\n")
}

export function extractCsvText(buffer: Buffer): string {
  return buffer.toString("utf8").trim()
}

export function extractSpreadsheetText(buffer: Buffer): string {
  const workbook = XLSX.read(buffer, { type: "buffer" })

  const sections = workbook.SheetNames.map((sheetName) => {
    const sheet = workbook.Sheets[sheetName]
    const csv = XLSX.utils.sheet_to_csv(sheet, { blankrows: false }).trim()

    if (!csv) {
      return ""
    }

    return [`[Hoja: ${sheetName}]`, csv].join("\n")
  }).filter(Boolean)

  return sections.join("\n\n").trim()
}

export async function extractPresentationText(buffer: Buffer): Promise<string> {
  const archive = await JSZip.loadAsync(buffer)
  const slidePaths = Object.keys(archive.files)
    .filter((filePath) => /^ppt\/slides\/slide\d+\.xml$/.test(filePath))
    .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }))

  const slides = await Promise.all(
    slidePaths.map(async (slidePath, index) => {
      const slideXml = await archive.file(slidePath)?.async("string")

      if (!slideXml) {
        return ""
      }

      const texts = Array.from(slideXml.matchAll(/<a:t[^>]*>(.*?)<\/a:t>/g))
        .map((match) => decodeXmlEntities(match[1] || "").trim())
        .filter(Boolean)

      if (!texts.length) {
        return ""
      }

      return [`[Slide ${index + 1}]`, texts.join("\n")].join("\n")
    }),
  )

  return slides.filter(Boolean).join("\n\n").trim()
}
