/**
 * Context Manager - Advanced context compaction system
 * Supports multiple models with configurable limits
 */

import { GoogleGenAI } from "@google/genai"
import { config } from "./config"

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

// ============================================================
// TOKEN ESTIMATION UTILITIES
// ============================================================

/**
 * Estimate token count from text
 * Uses character-based estimation: ~4 characters per token
 */
export function estimateTokens(text: string): number {
  if (!text || text.length === 0) return 0
  return Math.ceil(text.length / 4)
}

/**
 * Calculate total tokens for a message array
 */
export function calculateContextTokens(messages: ContextMessage[]): number {
  return messages.reduce((acc, msg) => acc + estimateTokens(msg.content), 0)
}

// ============================================================
// PROMPT CLASSIFIER
// ============================================================

/**
 * Classify prompt type based on keywords and length
 */
export function classifyPrompt(
  input: string,
  config: PromptClassifierConfig
): { type: PromptType; boost: number } {
  const lowerInput = input.toLowerCase()
  const length = input.length

  // Check for long keywords
  const hasLongKeyword = config.longKeywords.some((kw) => lowerInput.includes(kw.toLowerCase()))
  if (hasLongKeyword || length > config.mediumThreshold) {
    return { type: "long", boost: config.longBoost }
  }

  // Check for medium keywords
  const hasMediumKeyword = config.mediumKeywords.some((kw) => lowerInput.includes(kw.toLowerCase()))
  if (hasMediumKeyword || length > config.shortThreshold) {
    return { type: "medium", boost: config.mediumBoost }
  }

  return { type: "short", boost: 1.0 }
}

// ============================================================
// EMA RATIO CALCULATOR
// ============================================================

/**
 * Initialize context stats with default values
 */
export function initContextStats(alpha: number, bounds: { min: number; max: number }): ContextStats {
  return {
    emaRatio: 0.2, // Start with conservative estimate
    alpha,
    ratioMin: bounds.min,
    ratioMax: bounds.max,
    lastInputs: [],
    lastOutputs: [],
    lastUpdate: Date.now(),
  }
}

/**
 * Clamp value between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * Update EMA ratio with new input/output pair
 * Formula: r_t = α * (output/input)_t + (1-α) * r_(t-1)
 */
export function updateEmaRatio(
  stats: ContextStats,
  inputTokens: number,
  outputTokens: number
): ContextStats {
  if (inputTokens === 0) return stats

  // Calculate instant ratio
  const instantRatio = outputTokens / inputTokens

  // Apply clamp to instant ratio
  const clampedInstant = clamp(instantRatio, stats.ratioMin, stats.ratioMax)

  // EMA update
  const newRatio = stats.alpha * clampedInstant + (1 - stats.alpha) * stats.emaRatio

  // Clamp final ratio
  const clampedRatio = clamp(newRatio, stats.ratioMin, stats.ratioMax)

  return {
    ...stats,
    emaRatio: clampedRatio,
    lastInputs: [...stats.lastInputs.slice(-4), inputTokens],
    lastOutputs: [...stats.lastOutputs.slice(-4), outputTokens],
    lastUpdate: Date.now(),
  }
}

/**
 * Apply feedback correction after actual output is known
 */
export function applyFeedbackCorrection(
  stats: ContextStats,
  expectedOutput: number,
  actualOutput: number,
  factors: { overshoot: number; undershoot: number; resetThreshold: number }
): ContextStats {
  if (expectedOutput === 0) return stats

  const error = actualOutput / expectedOutput

  let correctedRatio = stats.emaRatio

  if (error > factors.resetThreshold) {
    // Large overshoot - blend with new ratio
    const newRatio = actualOutput / (stats.lastInputs[stats.lastInputs.length - 1] || 1)
    correctedRatio = stats.emaRatio * 0.5 + clamp(newRatio, stats.ratioMin, stats.ratioMax) * 0.5
  } else if (error > 1.5) {
    // Moderate overshoot
    correctedRatio = stats.emaRatio * factors.overshoot
  } else if (error < 0.5) {
    // Undershoot
    correctedRatio = stats.emaRatio * factors.undershoot
  }

  return {
    ...stats,
    emaRatio: clamp(correctedRatio, stats.ratioMin, stats.ratioMax),
  }
}

// ============================================================
// OVERFLOW PREDICTION ENGINE
// ============================================================

/**
 * Predict if next request will cause overflow
 */
export function predictOverflow(
  contextTokens: number,
  inputTokens: number,
  stats: ContextStats,
  caps: DynamicCaps,
  config: {
    effectiveLimit: number
    marginFactor: number
    minMargin: number
    nearLimitPenalty: number
    nearLimitThreshold: number
  },
  promptClassification: { type: PromptType; boost: number }
): OverflowPrediction {
  // Base expected output
  let expectedOutput = inputTokens * stats.emaRatio * promptClassification.boost

  // Apply dynamic cap based on prompt type
  const cap = caps[promptClassification.type]
  expectedOutput = clamp(expectedOutput, cap.min, cap.max)

  // Hard override for large inputs
  if (inputTokens > 1000) {
    expectedOutput = Math.max(expectedOutput, 2000)
  }

  // Near-limit penalty
  const utilization = contextTokens / config.effectiveLimit
  if (utilization > config.nearLimitThreshold) {
    expectedOutput *= config.nearLimitPenalty
  }

  // Calculate margin
  const margin = Math.max(config.minMargin, expectedOutput * config.marginFactor)

  // Total predicted tokens
  const predictedTokens = contextTokens + inputTokens + expectedOutput + margin

  // Decision
  const willOverflow = predictedTokens >= config.effectiveLimit

  return {
    willOverflow,
    currentTokens: contextTokens,
    predictedTokens,
    availableSpace: config.effectiveLimit - contextTokens,
    margin,
    recommendation: willOverflow ? "compact" : "execute",
  }
}

// ============================================================
// CONTEXT COMPACTION SERVICE
// ============================================================

/**
 * Compact context using LLM
 */
export async function compactContext(
  messages: ContextMessage[],
  modelId: string,
  systemPrompt: string,
  maxTokens: number
): Promise<CompactionResult> {
  const originalTokens = calculateContextTokens(messages)

  try {
    // Get Gemini API key
    const apiKey = config.geminiApiKeys[0]
    if (!apiKey) {
      throw new Error("No Gemini API key available")
    }

    const client = new GoogleGenAI({ apiKey })

    // Build compaction prompt
    const contextText = messages
      .map((m) => `${m.role === "user" ? "Usuario" : "Asistente"}: ${m.content}`)
      .join("\n\n")

    const response = await client.models.generateContent({
      model: modelId,
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${systemPrompt}\n\n=== CONTEXTO A COMPACTAR ===\n${contextText}\n\n=== RESPUESTA COMPACTA ===`,
            },
          ],
        },
      ],
    })

    const compactedContent = response.text || ""

    if (!compactedContent) {
      throw new Error("Empty compaction response")
    }

    const compactedTokens = estimateTokens(compactedContent)
    const reductionPercent = ((originalTokens - compactedTokens) / originalTokens) * 100

    // Create compacted message array with system summary
    const compactedMessages: ContextMessage[] = [
      {
        role: "system",
        content: `=== RESUMEN DE CONVERSACIÓN ===\n${compactedContent}`,
      },
    ]

    return {
      success: true,
      originalTokens,
      compactedTokens,
      reductionPercent,
      compactedMessages,
    }
  } catch (error) {
    return {
      success: false,
      originalTokens,
      compactedTokens: originalTokens,
      reductionPercent: 0,
      compactedMessages: messages,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// ============================================================
// CONTEXT MANAGER CLASS
// ============================================================

export class ContextManager {
  private options: ContextManagerOptions
  private stats: ContextStats
  private messages: ContextMessage[]

  constructor(options: Partial<ContextManagerOptions> = {}) {
    this.options = { ...DEFAULT_CONTEXT_MANAGER_OPTIONS, ...options }
    this.stats = initContextStats(this.options.emaAlpha, this.options.ratioBounds)
    this.messages = []
  }

  /**
   * Add message to context
   */
  addMessage(role: MessageRole, content: string): void {
    this.messages.push({ role, content })
  }

  /**
   * Get current context messages
   */
  getMessages(): ContextMessage[] {
    return [...this.messages]
  }

  /**
   * Get current context token count
   */
  getContextTokens(): number {
    return calculateContextTokens(this.messages)
  }

  /**
   * Get EMA stats (for debugging/monitoring)
   */
  getStats(): ContextStats {
    return { ...this.stats }
  }

  /**
   * Check if compaction is needed and execute if necessary
   * Returns true if compaction was performed
   */
  async checkAndCompact(nextInput: string): Promise<boolean> {
    const contextTokens = this.getContextTokens()
    const inputTokens = estimateTokens(nextInput)

    // Classify prompt
    const classification = classifyPrompt(nextInput, this.options.classifierConfig)

    // Predict overflow
    const prediction = predictOverflow(
      contextTokens,
      inputTokens,
      this.stats,
      this.options.dynamicCaps,
      {
        effectiveLimit: this.options.modelConfig.effectiveLimit,
        marginFactor: this.options.modelConfig.marginFactor,
        minMargin: this.options.modelConfig.minMargin,
        nearLimitPenalty: this.options.nearLimitPenalty,
        nearLimitThreshold: this.options.nearLimitThreshold,
      },
      classification
    )

    // Compact if needed
    if (prediction.recommendation === "compact") {
      const result = await compactContext(
        this.messages,
        this.options.modelConfig.modelId,
        this.options.modelConfig.compactionSystemPrompt,
        this.options.modelConfig.minTokensAfterCompaction
      )

      if (result.success) {
        this.messages = result.compactedMessages
        return true
      }
    }

    return false
  }

  /**
   * Update EMA ratio after response
   */
  recordInteraction(input: string, output: string): void {
    const inputTokens = estimateTokens(input)
    const outputTokens = estimateTokens(output)

    this.stats = updateEmaRatio(this.stats, inputTokens, outputTokens)
  }

  /**
   * Apply feedback correction after knowing actual output
   */
  applyFeedback(expectedOutput: number, actualOutput: number): void {
    this.stats = applyFeedbackCorrection(
      this.stats,
      expectedOutput,
      actualOutput,
      this.options.feedbackFactors
    )
  }

  /**
   * Force compaction regardless of prediction
   */
  async forceCompact(): Promise<CompactionResult> {
    const result = await compactContext(
      this.messages,
      this.options.modelConfig.modelId,
      this.options.modelConfig.compactionSystemPrompt,
      this.options.modelConfig.minTokensAfterCompaction
    )

    if (result.success) {
      this.messages = result.compactedMessages
    }

    return result
  }

  /**
   * Clear all context
   */
  clear(): void {
    this.messages = []
    this.stats = initContextStats(this.options.emaAlpha, this.options.ratioBounds)
  }
}

// ============================================================
// MODEL-SPECIFIC CONFIGURATIONS
// ============================================================

export const RAG_MODEL_CONFIGS: Record<string, ModelContextConfig> = {
  // Groq models
  "llama-3.1-8b": {
    modelId: "llama-3.1-8b",
    maxContextWindow: 128000,
    effectiveLimit: 32000,
    compactionThreshold: 28000,
    minTokensAfterCompaction: 4000,
    marginFactor: 0.5,
    minMargin: 1500,
    compactionSystemPrompt: DEFAULT_GEMMA_CONFIG.compactionSystemPrompt,
  },
  "llama-3.1-70b": {
    modelId: "llama-3.1-70b",
    maxContextWindow: 128000,
    effectiveLimit: 64000,
    compactionThreshold: 55000,
    minTokensAfterCompaction: 8000,
    marginFactor: 0.5,
    minMargin: 2000,
    compactionSystemPrompt: DEFAULT_GEMMA_CONFIG.compactionSystemPrompt,
  },
  "mixtral-8x7b": {
    modelId: "mixtral-8x7b",
    maxContextWindow: 32768,
    effectiveLimit: 16000,
    compactionThreshold: 14000,
    minTokensAfterCompaction: 3000,
    marginFactor: 0.5,
    minMargin: 1000,
    compactionSystemPrompt: DEFAULT_GEMMA_CONFIG.compactionSystemPrompt,
  },
}

/**
 * Create context manager for specific model
 */
export function createContextManager(modelId: string): ContextManager {
  const modelConfig = RAG_MODEL_CONFIGS[modelId] || DEFAULT_GEMMA_CONFIG

  return new ContextManager({
    modelConfig,
  })
}
