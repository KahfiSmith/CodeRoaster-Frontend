import { openai, OPENAI_CONFIG, testOpenAIConnection } from '@/config/openai'
import { ConnectionResult, ConnectionStatus, ReviewPrompts, ReviewResult, ReviewType, UsageStats } from '@/types';

// Review prompts for different types of analysis
const REVIEW_PROMPTS: ReviewPrompts = {
  codeQuality: {
    system: `Kamu adalah senior code reviewer yang ahli. Analisis kode dan berikan review dalam format JSON yang valid.

WAJIB: Respons hanya dalam format JSON yang valid, tidak ada teks lain.

Format JSON yang HARUS diikuti:
{
  "score": number (1-100),
  "summary": {
    "totalIssues": number,
    "critical": number,
    "warning": number,
    "info": number
  },
  "overallAssessment": "Penilaian keseluruhan kode dalam 2-3 kalimat bahasa Indonesia",
  "suggestions": [
    {
      "id": "saran-1",
      "type": "bug|performance|style|security|docs",
      "severity": "high|medium|low",
      "line": number,
      "title": "Judul masalah dalam bahasa Indonesia",
      "description": "Penjelasan detail masalah dan dampaknya dalam bahasa Indonesia (minimal 2 kalimat)",
      "suggestion": "Solusi detail dan cara memperbaikinya dalam bahasa Indonesia (minimal 2 kalimat)",
      "codeSnippet": {
        "original": "kode yang bermasalah",
        "improved": "kode yang sudah diperbaiki"
      },
      "canAutoFix": boolean
    }
  ],
  "recommendations": [
    "Saran perbaikan 1",
    "Saran perbaikan 2"
  ]
}

Berikan analisis yang mendalam dan berguna dalam bahasa Indonesia.`,
    
    user: (code, language) => `Analisis kode ${language} berikut dan berikan review dalam format JSON yang valid:

\`\`\`${language}
${code}
\`\`\`

Berikan analisis komprehensif dengan saran yang actionable dalam bahasa Indonesia.`
  },

  sarcastic: {
    system: `Kamu adalah code reviewer yang sarkastik tapi membantu dalam bahasa Indonesia. Kasih review yang entertaining dan kocak, tapi tetap berguna.

WAJIB: Respons hanya dalam format JSON yang valid, tidak ada teks lain.

Format JSON yang HARUS diikuti:
{
  "score": number (1-100),
  "summary": {
    "totalIssues": number,
    "critical": number,
    "warning": number,
    "info": number
  },
  "overallRoast": "Roasting kocak tentang kode ini dalam 2-3 kalimat bahasa Indonesia",
  "suggestions": [
    {
      "id": "roast-1",
      "type": "bug|performance|style|security|docs|comedy",
      "severity": "high|medium|low",
      "line": number,
      "title": "Judul sarkastik untuk masalahnya",
      "description": "Penjelasan masalah dengan gaya sarkastik Indonesia yang lucu tapi informatif (minimal 2 kalimat)",
      "suggestion": "Solusi dengan gaya roasting yang tetap membantu (minimal 2 kalimat)",
      "codeSnippet": {
        "original": "kode yang bermasalah",
        "improved": "kode yang udah diperbaiki"
      },
      "analogiKocak": "Analogi lucu untuk menggambarkan masalahnya",
      "canAutoFix": boolean
    }
  ],
  "motivasiSarkastik": "Motivasi sarkastik tapi encouraging untuk programmer"
}

Berikan review yang entertaining tapi tetap berguna dalam bahasa Indonesia.`,
    
    user: (code, language) => `Roasting kode ${language} berikut dengan gaya sarkastik Indonesia yang kocak tapi membantu:

\`\`\`${language}
${code}
\`\`\`

Kasih review yang lucu dan menghibur tapi tetap educational dalam format JSON yang valid!`
  },

  brutal: {
    system: `Kamu adalah code reviewer yang keras tapi konstruktif dalam bahasa Indonesia.

WAJIB: Respons hanya dalam format JSON yang valid, tidak ada teks lain.

Format JSON yang HARUS diikuti:
{
  "score": number (1-100),
  "summary": {
    "totalIssues": number,
    "critical": number,
    "warning": number,
    "info": number
  },
  "brutalAssessment": "Assessment jujur tentang kode dalam 2-3 kalimat bahasa Indonesia",
  "suggestions": [
    {
      "id": "brutal-1",
      "type": "disaster|catastrophe|critical|bug",
      "severity": "critical|high|medium",
      "line": number,
      "title": "Judul tegas tentang masalahnya",
      "description": "Penjelasan tegas kenapa ini masalah serius (minimal 2 kalimat)",
      "suggestion": "Solusi yang harus diterapkan tanpa kompromi (minimal 2 kalimat)",
      "codeSnippet": {
        "original": "kode bermasalah",
        "improved": "kode yang proper"
      },
      "urgencyLevel": "Seberapa urgent harus diperbaiki",
      "canAutoFix": boolean
    }
  ],
  "harshTruth": "Kebenaran yang harus didengar tentang kode ini"
}

Berikan review yang tegas tapi konstruktif dalam bahasa Indonesia.`,
    
    user: (code, language) => `Review kode ${language} berikut dengan tegas dan jujur:

\`\`\`${language}
${code}
\`\`\`

Kasih feedback yang direct dan jujur dalam format JSON yang valid!`
  },

  encouraging: {
    system: `Kamu adalah code reviewer yang supportive dan encouraging dalam bahasa Indonesia.

WAJIB: Respons hanya dalam format JSON yang valid, tidak ada teks lain.

Format JSON yang HARUS diikuti:
{
  "score": number (1-100),
  "summary": {
    "totalIssues": number,
    "critical": number,
    "warning": number,
    "info": number
  },
  "positiveAssessment": "Assessment positif tentang kode dalam 2-3 kalimat bahasa Indonesia",
  "suggestions": [
    {
      "id": "encourage-1",
      "type": "opportunity|improvement|enhancement|learning",
      "severity": "opportunity|suggestion|low",
      "line": number,
      "title": "Peluang perbaikan",
      "description": "Penjelasan supportif tentang area perbaikan (minimal 2 kalimat)",
      "suggestion": "Saran yang encouraging untuk perbaikan (minimal 2 kalimat)",
      "codeSnippet": {
        "original": "kode sekarang",
        "improved": "kode yang lebih baik"
      },
      "learningOpportunity": "Kesempatan belajar dari perbaikan ini",
      "canAutoFix": boolean
    }
  ],
  "growthMindset": "Motivasi untuk terus berkembang sebagai programmer"
}

Berikan review yang supportive dan memotivasi dalam bahasa Indonesia.`,
    
    user: (code, language) => `Review kode ${language} berikut dengan pendekatan yang supportive:

\`\`\`${language}
${code}
\`\`\`

Kasih feedback yang encouraging dan membangun dalam format JSON yang valid!`
  },

  security: {
    system: `Kamu adalah security expert yang fokus pada kerentanan keamanan dalam bahasa Indonesia.

WAJIB: Respons hanya dalam format JSON yang valid, tidak ada teks lain.

Format JSON yang HARUS diikuti:
{
  "score": number (1-100),
  "summary": {
    "totalIssues": number,
    "critical": number,
    "warning": number,
    "info": number
  },
  "overallSecurityAssessment": "Assessment keamanan kode dalam 2-3 kalimat bahasa Indonesia",
  "suggestions": [
    {
      "id": "security-1",
      "type": "security",
      "severity": "critical|high|medium|low",
      "line": number,
      "title": "Nama kerentanan keamanan",
      "description": "Penjelasan detail kerentanan dan risikonya (minimal 2 kalimat)",
      "suggestion": "Cara mengatasi kerentanan secara detail (minimal 2 kalimat)",
      "codeSnippet": {
        "original": "kode vulnerable",
        "improved": "kode yang secure"
      },
      "attackVector": "Bagaimana kerentanan ini bisa dieksploitasi",
      "riskLevel": "Tingkat risiko dan dampaknya",
      "canAutoFix": boolean
    }
  ],
  "securityChecklist": [
    "Checklist keamanan yang perlu diperhatikan"
  ]
}

Fokus pada identifikasi dan solusi masalah keamanan dalam bahasa Indonesia.`,
    
    user: (code, language) => `Analisis keamanan kode ${language} berikut:

\`\`\`${language}
${code}
\`\`\`

Berikan analisis keamanan yang komprehensif dalam format JSON yang valid!`
  },

  bestPractices: {
    system: `Kamu adalah expert best practices dan coding standards dalam bahasa Indonesia.

WAJIB: Respons hanya dalam format JSON yang valid, tidak ada teks lain.

Format JSON yang HARUS diikuti:
{
  "score": number (1-100),
  "summary": {
    "totalIssues": number,
    "critical": number,
    "warning": number,
    "info": number
  },
  "overallAssessment": "Assessment adherence terhadap best practices dalam 2-3 kalimat bahasa Indonesia",
  "suggestions": [
    {
      "id": "best-practice-1",
      "type": "style|architecture|performance|docs",
      "severity": "high|medium|low",
      "line": number,
      "title": "Best practice yang perlu diterapkan",
      "description": "Penjelasan kenapa best practice ini penting (minimal 2 kalimat)",
      "suggestion": "Cara implementasi best practice (minimal 2 kalimat)",
      "codeSnippet": {
        "original": "kode sekarang",
        "improved": "kode dengan best practice"
      },
      "industryStandard": "Standar industri yang relevan",
      "benefits": "Manfaat menerapkan best practice ini",
      "canAutoFix": boolean
    }
  ],
  "designPatterns": [
    "Design patterns yang bisa diterapkan"
  ]
}

Fokus pada penerapan best practices dan coding standards dalam bahasa Indonesia.`,
    
    user: (code, language) => `Review best practices kode ${language} berikut:

\`\`\`${language}
${code}
\`\`\`

Berikan rekomendasi best practices dalam format JSON yang valid!`
  }
};

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
      console.error('❌ Error koneksi OpenAI:', errorMessage)
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
      throw new Error('OpenAI API tidak terhubung. Silakan cek API key Anda.')
    }

    try {
      const prompt = REVIEW_PROMPTS[reviewType]
      if (!prompt) {
        throw new Error(`Tipe review tidak valid: ${reviewType}`)
      }

      console.log(`🔍 Starting ${reviewType} review for ${language} code...`)

      // Add additional instruction for JSON enforcement
      const systemPrompt = `${prompt.system}

CRITICAL: Your response MUST be a valid JSON object only. Do not include any text before or after the JSON. The response must start with { and end with }. No explanations, no additional text, ONLY valid JSON.`;

      const messages = [
        { role: 'system' as const, content: systemPrompt },
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

      let content = response.choices[0]?.message?.content?.trim() || '{}'
      
      // Clean up the response to extract JSON if it's wrapped in other text
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        content = jsonMatch[0];
      }
      
      console.log('📄 AI Response length:', content.length, 'characters');
      
      // Parse JSON response
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const parsedResult = JSON.parse(content) as any // Use any to access dynamic properties from AI response
        
        // Validate required properties and provide defaults
        const validatedResult: ReviewResult = {
          score: parsedResult.score || 5,
          summary: {
            totalIssues: parsedResult.summary?.totalIssues || 0,
            critical: parsedResult.summary?.critical || 0,
            warning: parsedResult.summary?.warning || 0,
            info: parsedResult.summary?.info || 0
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          suggestions: Array.isArray(parsedResult.suggestions) ? parsedResult.suggestions.map((suggestion: any, index: number) => ({
            id: suggestion.id || `suggestion-${index}`,
            type: suggestion.type || 'info',
            severity: suggestion.severity || 'low',
            line: suggestion.line || 1,
            title: suggestion.title || `Saran ${index + 1}`,
            description: suggestion.description || 'Tidak ada deskripsi tersedia',
            suggestion: suggestion.suggestion || 'Tidak ada saran spesifik',
            codeSnippet: {
              original: suggestion.codeSnippet?.original || '',
              improved: suggestion.codeSnippet?.improved || ''
            },
            // Handle dynamic fields from different review types
            impact: suggestion.impact || undefined,
            priority: suggestion.priority || undefined,
            riskLevel: suggestion.riskLevel || undefined,
            attackVector: suggestion.attackVector || undefined,
            mitigationStrategy: suggestion.mitigationStrategy || undefined,
            benefits: suggestion.benefits || undefined,
            industryStandard: suggestion.industryStandard || undefined,
            difficulty: suggestion.difficulty || undefined,
            roastLevel: suggestion.roastLevel || undefined,
            analogiKocak: suggestion.analogiKocak || undefined,
            consequencesIfIgnored: suggestion.consequencesIfIgnored || undefined,
            urgencyLevel: suggestion.urgencyLevel || undefined,
            learningOpportunity: suggestion.learningOpportunity || undefined,
            confidenceBooster: suggestion.confidenceBooster || undefined,
            nextSteps: suggestion.nextSteps || undefined,
            canAutoFix: suggestion.canAutoFix || false
          })) : [],
          metadata: {
            reviewType,
            language,
            model: OPENAI_CONFIG.model,
            timestamp: new Date().toISOString(),
            tokensUsed: response.usage?.total_tokens || 0,
            // Store dynamic assessment fields
            overallAssessment: parsedResult.overallAssessment || undefined,
            overallSecurityAssessment: parsedResult.overallSecurityAssessment || undefined,
            overallRoast: parsedResult.overallRoast || undefined,
            brutalAssessment: parsedResult.brutalAssessment || undefined,
            positiveAssessment: parsedResult.positiveAssessment || undefined,
            codeMetrics: parsedResult.codeMetrics || undefined,
            recommendations: parsedResult.recommendations || undefined,
            securityChecklist: parsedResult.securityChecklist || undefined,
            designPatterns: parsedResult.designPatterns || undefined,
            qualityMetrics: parsedResult.qualityMetrics || undefined,
            comedyGold: parsedResult.comedyGold || undefined,
            motivasiSarkastik: parsedResult.motivasiSarkastik || undefined,
            realityCheck: parsedResult.realityCheck || undefined,
            harshTruth: parsedResult.harshTruth || undefined,
            encouragements: parsedResult.encouragements || undefined,
            growthMindset: parsedResult.growthMindset || undefined
          }
        }

        console.log('✅ Code review completed successfully')
        console.log(`📊 Found ${validatedResult.summary.totalIssues} issues (${validatedResult.summary.critical} critical)`)
        return validatedResult
        
      } catch (parseError) {
        console.error('❌ Gagal parse response OpenAI sebagai JSON:', parseError)
        console.log('📄 Raw response:', content.substring(0, 500))
        
        // Create a manual review result from the raw response
        const fallbackSuggestions = [];
        
        // Try to extract useful information from the raw response
        if (content.includes('error') || content.includes('Error')) {
          fallbackSuggestions.push({
            id: `error-${Date.now()}`,
            type: 'info' as const,
            severity: 'medium' as const,
            line: 1,
            title: 'AI Response Error',
            description: 'AI memberikan respons tapi tidak dalam format yang diharapkan. Ini mungkin karena kode terlalu kompleks atau ada masalah koneksi.',
            suggestion: 'Coba upload kode yang lebih kecil atau cek koneksi internet kamu.',
            codeSnippet: { original: '', improved: '' },
            canAutoFix: false
          });
        } else {
          // Extract some content as a general suggestion
          const truncatedContent = content.substring(0, 200).replace(/[{}[\]"]/g, '');
          fallbackSuggestions.push({
            id: `fallback-${Date.now()}`,
            type: 'info' as const,
            severity: 'low' as const,
            line: 1,
            title: 'Review Tersedia (Format Tidak Standar)',
            description: 'AI udah ngasih feedback tapi formatnya agak aneh. Ini mungkin hasil yang masih bisa dibaca:',
            suggestion: truncatedContent || 'Coba upload ulang atau pilih reviewer personality yang berbeda.',
            codeSnippet: { original: '', improved: '' },
            canAutoFix: false
          });
        }

        // Fallback response with Indonesian sarcastic messages
        const sarcasticFallbacks = [
          "Wah, AI-nya lagi bingung nih kayaknya 🤖",
          "Plot twist: AI ga bisa parsing response sendiri 🎭", 
          "Houston, we have a parsing problem 🚀",
          "AI lagi error, mungkin kode lu terlalu complicated 😅"
        ];
        
        const randomMessage = sarcasticFallbacks[Math.floor(Math.random() * sarcasticFallbacks.length)];
        
        return {
          score: 3,
          summary: { totalIssues: 1, critical: 0, warning: 1, info: 0 },
          suggestions: fallbackSuggestions,
          metadata: {
            reviewType,
            language,
            model: OPENAI_CONFIG.model,
            timestamp: new Date().toISOString(),
            tokensUsed: response.usage?.total_tokens || 0,
            fallback: true,
            error: randomMessage
          }
        }
      }
    } catch (error: unknown) {
      console.error('❌ Code review gagal:', error)
      
      if (error instanceof Error) {
        if (error.message.includes('insufficient_quota')) {
          throw new Error('Kuota OpenAI API habis. Silakan cek pengaturan billing Anda.')
        }
        
        if (error.message.includes('invalid_api_key')) {
          throw new Error('API key OpenAI tidak valid. Silakan cek konfigurasi Anda.')
        }
        
        throw new Error(`Code review gagal: ${error.message}`)
      }
      
      throw new Error('Terjadi error yang tidak diketahui saat code review')
    }
  }

  async generateBestPractices(language: string): Promise<string> {
    try {
      const messages = [
        {
          role: 'system' as const, 
          content: `Generate best practices dan pola umum untuk bahasa pemrograman ${language} dalam bahasa Indonesia. Sertakan contoh kode dan penjelasan yang detail.`
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
      console.error('❌ Gagal generate best practices:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Gagal generate best practices: ${errorMessage}`);
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
      console.error('❌ Gagal mendapatkan usage stats:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      return { error: errorMessage }
    }
  }
}

export const openaiService = new OpenAIService()
export { REVIEW_PROMPTS }