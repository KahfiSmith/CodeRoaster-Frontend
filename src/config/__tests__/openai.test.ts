import { describe, it, expect, vi } from 'vitest'

// Mock ENV config first
vi.mock('@/config/env', () => ({
  ENV: {
    OPENAI_API_KEY: 'test-api-key',
    OPENAI_MODEL: 'gpt-4o-mini',
    OPENAI_TEMPERATURE: 0.7,
    OPENAI_MAX_TOKENS: 2000
  }
}))

// Mock OpenAI - simple approach
const mockModelsListFn = vi.fn()

vi.mock('openai', () => {
  return {
    default: function MockOpenAI() {
      return {
        models: {
          list: mockModelsListFn
        }
      }
    }
  }
})

// Import after mocking
import { OPENAI_CONFIG, OPENAI_MODELS } from '../openai'

describe('OpenAI Configuration', () => {
  describe('OPENAI_CONFIG', () => {
    it('should have correct default configuration', () => {
      expect(OPENAI_CONFIG).toEqual({
        model: 'gpt-4o-mini',
        temperature: 0.7,
        max_tokens: 2000,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
        response_format: { type: "json_object" }
      })
    })

    it('should use environment variables for key settings', () => {
      expect(OPENAI_CONFIG.model).toBe('gpt-4o-mini')
      expect(OPENAI_CONFIG.temperature).toBe(0.7)
      expect(OPENAI_CONFIG.max_tokens).toBe(2000)
    })
  })

  describe('OPENAI_MODELS', () => {
    it('should contain all expected models', () => {
      const expectedModels = ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo']
      const actualModels = Object.keys(OPENAI_MODELS)
      
      expect(actualModels).toEqual(expectedModels)
    })

    it('should have correct model metadata', () => {
      expect(OPENAI_MODELS['gpt-4o']).toEqual({
        name: 'GPT-4 Omni',
        description: 'Most capable model, best for complex code review',
        cost: 'High',
        speed: 'Medium'
      })

      expect(OPENAI_MODELS['gpt-4o-mini']).toEqual({
        name: 'GPT-4 Omni Mini',
        description: 'Balanced performance and cost',
        cost: 'Medium',
        speed: 'Fast'
      })

      expect(OPENAI_MODELS['gpt-3.5-turbo']).toEqual({
        name: 'GPT-3.5 Turbo',
        description: 'Fast and economical',
        cost: 'Low',
        speed: 'Very Fast'
      })
    })

    it('should have required properties for each model', () => {
      Object.values(OPENAI_MODELS).forEach(model => {
        expect(model).toHaveProperty('name')
        expect(model).toHaveProperty('description')
        expect(model).toHaveProperty('cost')
        expect(model).toHaveProperty('speed')
      })
    })
  })

  describe('testOpenAIConnection', () => {
    it('should be a function', async () => {
      // Import testOpenAIConnection dynamically to avoid hoisting issues
      const { testOpenAIConnection } = await import('../openai')
      expect(typeof testOpenAIConnection).toBe('function')
    })

    it('should handle successful connection', async () => {
      mockModelsListFn.mockResolvedValueOnce({
        data: [
          { id: 'gpt-4o', object: 'model' },
          { id: 'gpt-4o-mini', object: 'model' }
        ]
      })

      const { testOpenAIConnection } = await import('../openai')
      const result = await testOpenAIConnection()

      expect(result.success).toBe(true)
      expect(result.message).toBe('OpenAI API connected successfully')
      expect(result.availableModels).toEqual(['gpt-4o', 'gpt-4o-mini'])
    })

    it('should handle connection failure', async () => {
      mockModelsListFn.mockRejectedValueOnce(new Error('API key invalid'))

      const { testOpenAIConnection } = await import('../openai')
      const result = await testOpenAIConnection()

      expect(result.success).toBe(false)
      expect(result.message).toContain('Connection failed: API key invalid')
      expect(result.error).toBeInstanceOf(Error)
    })
  })
})