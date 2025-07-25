import { openai, OPENAI_CONFIG, testOpenAIConnection } from '@/config/openai'
import { ConnectionResult, ConnectionStatus, ReviewPrompts, ReviewResult, ReviewType, UsageStats } from '@/types';

// Review prompts for different types of analysis
const REVIEW_PROMPTS: ReviewPrompts = {
  codeQuality: {
    system: `You are an expert code reviewer. Analyze the provided code and return a detailed review in JSON format.

IMPORTANT: Always respond with valid JSON only, no additional text.

Required JSON structure:
{
  "score": number (1-10, overall code quality),
  "summary": {
    "totalIssues": number,
    "critical": number,
    "warning": number,
    "info": number
  },
  "suggestions": [
    {
      "id": "unique-id",
      "type": "bug|performance|style|security|docs",
      "severity": "high|medium|low",
      "line": number (line number where issue occurs),
      "title": "Brief title of the issue",
      "description": "Detailed description of the issue",
      "suggestion": "How to fix or improve this",
      "codeSnippet": {
        "original": "problematic code",
        "improved": "suggested improvement"
      },
      "canAutoFix": boolean
    }
  ]
}

Focus on:
1. Bugs and potential errors
2. Performance optimizations  
3. Code style and best practices
4. Security vulnerabilities
5. Missing documentation`,
    
    user: (code, language) => `
Language: ${language}
Code to review:

\`\`\`${language}
${code}
\`\`\`

Please analyze this code and provide suggestions for improvement.`
  },

  security: {
    system: `You are a security expert. Focus on finding security vulnerabilities in the code. Return results in the same JSON format, but focus only on security issues like:
- Input validation problems
- Authentication/Authorization flaws
- Data exposure risks
- Injection vulnerabilities
- Cryptographic issues`,
    
    user: (code, language) => `
Language: ${language}
Code to scan for security issues:

\`\`\`${language}
${code}
\`\`\`

Perform a security analysis and identify potential vulnerabilities.`
  },

  bestPractices: {
    system: `You are a senior developer mentor. Focus on code quality, design patterns, and best practices for the given language. Return results in the same JSON format.`,
    
    user: (code, language) => `
Language: ${language}
Code to review for best practices:

\`\`\`${language}
${code}
\`\`\`

Review this code against industry best practices and design patterns.`
  }
}

class OpenAIService {
  // Class properties with types
  private isConnected: boolean;
  private connectionPromise: Promise<ConnectionResult> | null;

  constructor() {
    this.isConnected = false;
    this.connectionPromise = null;
    this.init();
  }

  async init(): Promise<void> {
    console.log('🔄 Initializing OpenAI service...')
    this.connectionPromise = this.checkConnection()
    await this.connectionPromise
  }

  async checkConnection(): Promise<ConnectionResult> {
    try {
      const result = await testOpenAIConnection()
      this.isConnected = result.success
      
      if (result.success) {
        console.log('✅ OpenAI API connected successfully')
        console.log('📋 Available models:', result.availableModels?.slice(0, 5))
      } else {
        console.error('❌ OpenAI connection failed:', result.message)
      }
      
      return result 
    } catch (error: unknown) {
      this.isConnected = false
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error('❌ OpenAI connection error:', errorMessage)
      return { success: false, message: errorMessage, error }
    }
  }

  async reviewCode(code: string, language: string, reviewType: ReviewType = 'codeQuality'): Promise<ReviewResult> {
    if (!this.connectionPromise) {
      await this.init()
    } else {
      await this.connectionPromise
    }

    if (!this.isConnected) {
      throw new Error('OpenAI API is not connected. Please check your API key.')
    }

    try {
      const prompt = REVIEW_PROMPTS[reviewType]
      if (!prompt) {
        throw new Error(`Invalid review type: ${reviewType}`)
      }

      console.log(`🔍 Starting ${reviewType} review for ${language} code...`)

      const messages = [
        { role: 'system' as const, content: prompt.system },
        { role: 'user' as const, content: prompt.user(code, language) }
      ];

      // Create request object with type override
      const requestOptions = {
        model: OPENAI_CONFIG.model,
        temperature: OPENAI_CONFIG.temperature,
        max_tokens: OPENAI_CONFIG.max_tokens,
        top_p: OPENAI_CONFIG.top_p,
        frequency_penalty: OPENAI_CONFIG.frequency_penalty,
        presence_penalty: OPENAI_CONFIG.presence_penalty,
        response_format: { type: "json_object" } as const,
        messages
      };

      const response = await openai.chat.completions.create(requestOptions);

      const content = response.choices[0]?.message?.content?.trim() || '{}'
      
      // Parse JSON response
      try {
        const parsedResult = JSON.parse(content) as ReviewResult
        
        // Add metadata
        parsedResult.metadata = {
          reviewType,
          language,
          model: OPENAI_CONFIG.model,
          timestamp: new Date().toISOString(),
          tokensUsed: response.usage?.total_tokens || 0
        }

        console.log('✅ Code review completed successfully')
        return parsedResult
        
      } catch (parseError) {
        console.error('❌ Failed to parse OpenAI response as JSON:', parseError)
        
        // Fallback response
        return {
          score: 5,
          summary: { totalIssues: 1, critical: 0, warning: 0, info: 1 },
          suggestions: [{
            id: `fallback-${Date.now()}`,
            type: 'info',
            severity: 'low',
            line: 1,
            title: 'Review Response Available',
            description: 'The AI provided feedback but in an unexpected format.',
            suggestion: content.substring(0, 200) + '...',
            codeSnippet: { original: code.substring(0, 100), improved: code.substring(0, 100) },
            canAutoFix: false
          }],
          metadata: {
            reviewType,
            language,
            model: OPENAI_CONFIG.model,
            timestamp: new Date().toISOString(),
            tokensUsed: response.usage?.total_tokens || 0,
            fallback: true
          }
        }
      }
    } catch (error: unknown) {
      console.error('❌ Code review failed:', error)
      
      if (error instanceof Error) {
        if (error.message.includes('insufficient_quota')) {
          throw new Error('OpenAI API quota exceeded. Please check your billing settings.')
        }
        
        if (error.message.includes('invalid_api_key')) {
          throw new Error('Invalid OpenAI API key. Please check your configuration.')
        }
        
        throw new Error(`Code review failed: ${error.message}`)
      }
      
      throw new Error('An unknown error occurred during code review')
    }
  }

  async generateBestPractices(language: string): Promise<string> {
    try {
      const messages = [
        {
          role: 'system' as const, 
          content: `Generate best practices and common patterns for ${language} programming language. Include code examples.`
        }
      ];

      const response = await openai.chat.completions.create({
        model: OPENAI_CONFIG.model,
        temperature: OPENAI_CONFIG.temperature,
        max_tokens: OPENAI_CONFIG.max_tokens,
        top_p: OPENAI_CONFIG.top_p,
        frequency_penalty: OPENAI_CONFIG.frequency_penalty,
        presence_penalty: OPENAI_CONFIG.presence_penalty,
        response_format: { type: "json_object" } as const,
        messages
      });

      return response.choices[0]?.message?.content || '';
    } catch (error: unknown) {
      console.error('❌ Failed to generate best practices:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to generate best practices: ${errorMessage}`);
    }
  }

  getConnectionStatus(): ConnectionStatus {
    return {
      isConnected: this.isConnected,
      model: OPENAI_CONFIG.model,
      maxTokens: OPENAI_CONFIG.max_tokens
    }
  }

  async getUsageStats(): Promise<UsageStats> {
    try {
      // Note: OpenAI doesn't provide usage stats directly
      // You might want to track this in your app
      return {
        message: 'Usage stats not available from OpenAI API',
        suggestion: 'Check your OpenAI dashboard for detailed usage'
      }
    } catch (error: unknown) {
      console.error('❌ Failed to get usage stats:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      return { error: errorMessage }
    }
  }
}

// Export singleton instance
export const openaiService = new OpenAIService()

// Export for testing
export { REVIEW_PROMPTS }