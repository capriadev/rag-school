/**
 * Context Manager - Advanced context compaction system
 * Supports multiple models with configurable limits
 */

// Message role types
export type MessageRole = "user" | "assistant" | "system"

// Conversation message
export interface ContextMessage {
  role: MessageRole
  content: string
}

// Prompt classification types
export type PromptType = "short" | "medium" | "long"

// EMA ratio tracking statistics
export interface ContextStats {
  // EMA ratio: output/input ratio
  emaRatio: number
  // Alpha value for EMA calculation (0.2-0.3 recommended)
  alpha: number
  // Clamped ratio range
  ratioMin: number
  ratioMax: number
  // History for debugging
  lastInputs: number[]
  lastOutputs: number[]
  // Last update timestamp
  lastUpdate: number
}

// Compaction result
export interface CompactionResult {
  success: boolean
  originalTokens: number
  compactedTokens: number
  reductionPercent: number
  compactedMessages: ContextMessage[]
  error?: string
}

// Overflow prediction result
export interface OverflowPrediction {
  willOverflow: boolean
  currentTokens: number
  predictedTokens: number
  availableSpace: number
  margin: number
  recommendation: "execute" | "compact"
}

// Model configuration
export interface ModelContextConfig {
  // Model identifier
  modelId: string
  // Maximum context window (e.g., 128000 for Gemma 3 27b)
  maxContextWindow: number
  // Effective limit (e.g., 64000 for safety)
  effectiveLimit: number
  // Compaction trigger threshold (e.g., 50000-60000)
  compactionThreshold: number
  // Minimum tokens to keep after compaction
  minTokensAfterCompaction: number
  // System prompt for compaction
  compactionSystemPrompt: string
  // Margin calculation factor
  marginFactor: number
  // Minimum margin tokens
  minMargin: number
}

// Prompt classification configuration
export interface PromptClassifierConfig {
  // Keywords that indicate long prompts
  longKeywords: string[]
  // Keywords that indicate medium prompts
  mediumKeywords: string[]
  // Character thresholds for classification
  shortThreshold: number
  mediumThreshold: number
  // Boost multiplier for long prompts
  longBoost: number
  // Medium boost
  mediumBoost: number
}

// Dynamic caps by prompt type
export interface DynamicCaps {
  short: { min: number; max: number }
  medium: { min: number; max: number }
  long: { min: number; max: number }
}

// Context manager options
export interface ContextManagerOptions {
  // Model configuration
  modelConfig: ModelContextConfig
  // Prompt classifier config
  classifierConfig: PromptClassifierConfig
  // Dynamic output caps
  dynamicCaps: DynamicCaps
  // EMA alpha value
  emaAlpha: number
  // Ratio clamp bounds
  ratioBounds: { min: number; max: number }
  // Near-limit penalty factor
  nearLimitPenalty: number
  // Near-limit threshold (0.8 = 80%)
  nearLimitThreshold: number
  // Feedback adjustment factors
  feedbackFactors: {
    overshoot: number
    undershoot: number
    resetThreshold: number
  }
}

// Default configurations
export const DEFAULT_GEMMA_CONFIG: ModelContextConfig = {
  modelId: "gemma-3-27b-it",
  maxContextWindow: 128000,
  effectiveLimit: 64000,
  compactionThreshold: 55000,
  minTokensAfterCompaction: 8000,
  marginFactor: 0.5,
  minMargin: 2000,
  compactionSystemPrompt: `Eres un sistema de compresión de contexto. Tu tarea es analizar el historial de conversación y crear un resumen compacto que:

1. MANTENGA información crítica:
   - Objetivos del usuario
   - Datos técnicos relevantes
   - Decisiones tomadas
   - Contexto importante
   - Pendientes o tareas abiertas

2. ELIMINE:
   - Repeticiones
   - Información irrelevante
   - Detalles temporales
   - Frases de cortesía
   - Confirmaciones innecesarias

3. PRESERVE la coherencia:
   - Secuencia lógica de la conversación
   - Código o ejemplos importantes
   - Preguntas pendientes

Reglas:
- Sé ultra conciso
- Usa formato estructurado: puntos clave
- Máximo 8000 tokens de salida
- Prioriza datos sobre conversación`,
}

export const DEFAULT_CLASSIFIER_CONFIG: PromptClassifierConfig = {
  longKeywords: [
    "detall",
    "paso a paso",
    "explica",
    "analiza",
    "código",
    "implementa",
    "diseña",
    "completo",
    "exhaustivo",
    "profundo",
  ],
  mediumKeywords: [
    "ejemplo",
    "muestra",
    "cómo",
    "por qué",
    "cuándo",
    "dónde",
    "qué es",
    "diferencia",
  ],
  shortThreshold: 100,
  mediumThreshold: 500,
  longBoost: 1.8,
  mediumBoost: 1.2,
}

export const DEFAULT_DYNAMIC_CAPS: DynamicCaps = {
  short: { min: 200, max: 1000 },
  medium: { min: 500, max: 2000 },
  long: { min: 1000, max: 4000 },
}

export const DEFAULT_CONTEXT_MANAGER_OPTIONS: ContextManagerOptions = {
  modelConfig: DEFAULT_GEMMA_CONFIG,
  classifierConfig: DEFAULT_CLASSIFIER_CONFIG,
  dynamicCaps: DEFAULT_DYNAMIC_CAPS,
  emaAlpha: 0.25,
  ratioBounds: { min: 0.05, max: 0.5 },
  nearLimitPenalty: 1.4,
  nearLimitThreshold: 0.8,
  feedbackFactors: {
    overshoot: 1.2,
    undershoot: 0.9,
    resetThreshold: 2.0,
  },
}
