import Groq from "groq-sdk"
import { config } from "../config.js"
import { generateAnswer as generateGeminiAnswer } from "./gemini.js"

const groq = config.groqApiKey ? new Groq({ apiKey: config.groqApiKey }) : null

function buildPrompt({ question, contexts }) {
  return [
    "Sos un asistente que responde solo con la informacion provista.",
    "Si no hay suficiente contexto, decilo con claridad y sin inventar.",
    "Responde en espanol.",
    "",
    "Contexto:",
    contexts.length ? contexts.join("\n\n---\n\n") : "Sin contexto disponible.",
    "",
    `Pregunta: ${question}`,
  ].join("\n")
}

export async function generateAnswer({ question, contexts }) {
  if (!groq) {
    return generateGeminiAnswer({ question, contexts })
  }

  const completion = await groq.chat.completions.create({
    model: config.groqModel,
    temperature: 0.2,
    messages: [
      {
        role: "user",
        content: buildPrompt({ question, contexts }),
      },
    ],
  })

  return completion.choices?.[0]?.message?.content || "No se pudo generar una respuesta."
}
