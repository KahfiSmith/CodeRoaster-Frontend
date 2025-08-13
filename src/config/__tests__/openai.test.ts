import { describe, it, expect, vi } from 'vitest'

// Mock ENV config first
vi.mock('@/config/env', () => ({
  ENV: {
    OPENAI_API_KEY: 'test-api-key',
    OPENAI_MODEL: 'gpt-5-mini',
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
        model: 'gpt-5-mini',
        temperature: 0.7,
        max_tokens: 2000,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
        response_format: { type: "json_object" }
      })
    })

    it('should use environment variables for key settings', () => {
      expect(OPENAI_CONFIG.model).toBe('gpt-5-mini')
      expect(OPENAI_CONFIG.temperature).toBe(0.7)
      expect(OPENAI_CONFIG.max_tokens).toBe(2000)
    })
  })

  describe('OPENAI_MODELS', () => {
    it('should contain all expected models', () => {
      const expectedModels = [
        'gpt-5-mini', 'gpt-5-nano', 'gpt-4.1-mini', 'gpt-4.1-nano', 
        'gpt-4o-mini', 'o1-mini', 'o4-mini'
      ]
      const actualModels = Object.keys(OPENAI_MODELS)
      
      expect(actualModels).toEqual(expectedModels)
    })

    it('should have correct model metadata', () => {
      expect(OPENAI_MODELS['gpt-5-mini']).toEqual({
        name: 'GPT-5 Mini',
        description: 'Latest GPT-5 model, best for code review and analysis',
        cost: 'Medium-High',
        speed: 'Fast',
        recommended: true
      })

      expect(OPENAI_MODELS['gpt-4o-mini']).toEqual({
        name: 'GPT-4 Omni Mini',
        description: 'Reliable GPT-4 model for code review',
        cost: 'Medium',
        speed: 'Fast',
        recommended: false
      })
    })

    it('should have required properties for each model', () => {
      Object.values(OPENAI_MODELS).forEach(model => {
        expect(model).toHaveProperty('name')
        expect(model).toHaveProperty('description')
        expect(model).toHaveProperty('cost')
        expect(model).toHaveProperty('speed')
        expect(model).toHaveProperty('recommended')
      })
    })

    it('should mark gpt-5-mini as recommended', () => {
      expect(OPENAI_MODELS['gpt-5-mini'].recommended).toBe(true)
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
          { id: 'gpt-5-mini', object: 'model' },
          { id: 'gpt-4o-mini', object: 'model' }
        ]
      })

      const { testOpenAIConnection } = await import('../openai')
      const result = await testOpenAIConnection()

      expect(result.success).toBe(true)
      expect(result.message).toBe('OpenAI API connected successfully')
      expect(result.availableModels).toEqual(['gpt-5-mini', 'gpt-4o-mini'])
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