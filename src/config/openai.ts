import OpenAI from 'openai'
import { ENV } from '@/config/env'

// OpenAI Client Setup
export const openai = new OpenAI({
  apiKey: ENV.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Only for client-side usage
})

// Per-model default parameters (tuned for concise, JSON-stable code reviews)
const OPENAI_MODEL_DEFAULTS: Record<string, { temperature: number; max_tokens: number }> = {
  'gpt-5-mini': { temperature: 0.1, max_tokens: 3000 },
  'gpt-5-nano': { temperature: 0.1, max_tokens: 2000 },
  'gpt-4.1-mini': { temperature: 0.2, max_tokens: 2000 },
  'gpt-4.1-nano': { temperature: 0.2, max_tokens: 1500 },
  'gpt-4o-mini': { temperature: 0.2, max_tokens: 2000 },
  'o1-mini': { temperature: 0.1, max_tokens: 2500 },
  'o4-mini': { temperature: 0.1, max_tokens: 2500 },
}

const resolveModelDefaults = (modelId: string) => { 
  const fallback = { temperature: 0.1, max_tokens: 2000 }
  return OPENAI_MODEL_DEFAULTS[modelId] || fallback
}

// OpenAI Request Configuration (env overrides per-model defaults)
export const OPENAI_CONFIG = {
  model: ENV.OPENAI_MODEL,
  temperature: ENV.OPENAI_TEMPERATURE ?? resolveModelDefaults(ENV.OPENAI_MODEL).temperature,
  max_tokens: ENV.OPENAI_MAX_TOKENS ?? resolveModelDefaults(ENV.OPENAI_MODEL).max_tokens,
  top_p: 1,
  frequency_penalty: 0,
  presence_penalty: 0,
  response_format: { type: "json_object" } // Force JSON response
}

// Available Models (restricted to requested set)
export const OPENAI_MODELS = {
  'gpt-5-mini': {
    name: 'GPT-5 Mini',
    description: 'Default for reviews. Latest GPT-5 model tuned for JSON-stable code review',
    cost: 'Medium-High',
    speed: 'Fast',
    recommended: true
  },
  'gpt-5-nano': {
    name: 'GPT-5 Nano',
    description: 'Fastest GPT-5 model, good for quick reviews',
    cost: 'Medium',
    speed: 'Very Fast',
    recommended: false
  },
  'gpt-4.1-mini': {
    name: 'GPT-4.1 Mini',
    description: 'Balanced GPT-4.1 model for code review',
    cost: 'Medium',
    speed: 'Fast',
    recommended: false
  },
  'gpt-4.1-nano': {
    name: 'GPT-4.1 Nano',
    description: 'Fast GPT-4.1 model for quick analysis',
    cost: 'Low-Medium',
    speed: 'Very Fast',
    recommended: false
  },
  'gpt-4o-mini': {
    name: 'GPT-4 Omni Mini',
    description: 'Reliable GPT-4 model for code review',
    cost: 'Medium',
    speed: 'Fast',
    recommended: false
  },
  'o1-mini': {
    name: 'O1 Mini',
    description: 'Advanced reasoning model for complex code analysis',
    cost: 'High',
    speed: 'Medium',
    recommended: false
  },
  'o4-mini': {
    name: 'O4 Mini',
    description: 'Latest O4 model for advanced code review',
    cost: 'High',
    speed: 'Medium',
    recommended: false
  }
}

// Test connection function
export const testOpenAIConnection = async () => {
  try {
    const response = await openai.models.list()
    return {
      success: true,
      message: 'OpenAI API connected successfully',
      availableModels: response.data.map(model => model.id)
    }
  } catch (error) {
    return {
      success: false,
      message: `Connection failed: ${error instanceof Error ? error.message : String(error)}`,
      error: error
    }
  }
}