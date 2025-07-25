import OpenAI from 'openai'
import { ENV } from '@/config/env'

// OpenAI Client Setup
export const openai = new OpenAI({
  apiKey: ENV.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Only for client-side usage
})

// OpenAI Request Configuration
export const OPENAI_CONFIG = {
  model: ENV.OPENAI_MODEL,
  temperature: ENV.OPENAI_TEMPERATURE,
  max_tokens: ENV.OPENAI_MAX_TOKENS,
  top_p: 1,
  frequency_penalty: 0,
  presence_penalty: 0,
  response_format: { type: "json_object" } // Force JSON response
}

// Available Models
export const OPENAI_MODELS = {
  'gpt-4o': {
    name: 'GPT-4 Omni',
    description: 'Most capable model, best for complex code review',
    cost: 'High',
    speed: 'Medium'
  },
  'gpt-4o-mini': {
    name: 'GPT-4 Omni Mini',
    description: 'Balanced performance and cost',
    cost: 'Medium',
    speed: 'Fast'
  },
  'gpt-3.5-turbo': {
    name: 'GPT-3.5 Turbo',
    description: 'Fast and economical',
    cost: 'Low',
    speed: 'Very Fast'
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