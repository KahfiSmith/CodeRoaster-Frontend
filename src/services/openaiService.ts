import { openai, OPENAI_CONFIG, testOpenAIConnection } from "@/config/openai";
import type { ChatCompletionCreateParamsNonStreaming } from "openai/resources/chat/completions";
type ChatParams = ChatCompletionCreateParamsNonStreaming & { max_completion_tokens?: number }
import {
  AIResponseData,
  AISuggestionResponse,
  ConnectionResult,
  ConnectionStatus,
  ReviewPrompts,
  ReviewResult,
  ReviewSuggestion,
  ReviewType,
  UsageStats,
} from "@/types";


// Review prompts for different types of analysis
const REVIEW_PROMPTS: ReviewPrompts = {
  codeQuality: {
    system: `Kamu adalah senior code reviewer yang ahli. Analisis kode dan berikan review dalam format JSON yang valid.

WAJIB: Respons hanya dalam format JSON yang valid, tidak ada teks lain.
FOKUS: Berikan analisis yang berguna dan actionable, tidak perlu terlalu panjang.

Format JSON yang HARUS diikuti:
{
  "score": number (1-100),
  "summary": {
    "totalIssues": number,
    "critical": number,
    "warning": number,
    "info": number
  },
  "overallAssessment": "Penilaian keseluruhan kode dalam 2-3 kalimat bahasa Indonesia yang concise",
  "suggestions": [
    {
      "id": "saran-1",
      "type": "bug|performance|style|security|docs|architecture|maintainability",
      "severity": "high|medium|low",
      "line": number,
      "title": "Judul masalah yang SPESIFIK",
      "description": "Penjelasan masalah dalam 1-2 kalimat",
      "suggestion": "Solusi dalam 1-2 kalimat",
      "codeSnippet": {
        "original": "kode bermasalah",
        "improved": "kode yang diperbaiki"
      },
      "canAutoFix": boolean
    }
  ],
  "recommendations": [
    "Saran perbaikan concise 1",
    "Saran perbaikan concise 2"
  ]
}

Berikan analisis yang fokus dan berguna dalam bahasa Indonesia.`,

    user: (
      code,
      language
    ) => `Analisis kode ${language} berikut dan berikan review concise dalam format JSON:

\`\`\`${language}
${code}
\`\`\`

Berikan 3-5 suggestions yang paling penting dan actionable.`,
  },

  sarcastic: {
    system: `Lu adalah code reviewer ROASTER yang sarkastik tapi tetap bantuin. Gaya bahasa: bahasa gaul santai (lu/gue), nyeleneh, nggak kaku, fun, tapi tetep respect (hindari kata kasar/menyerang). Fokus tetap teknis dan actionable.

WAJIB: Respons cuma dalam format JSON yang valid. Jangan ada teks di luar JSON.

Gaya output: singkat, pedes tapi informatif, pake istilah gaul (mis. "ini bikin performa ngedrop parah", "struktur kodenya masih acak-adul, yuk dirapiin").

Format JSON yang HARUS diikuti:
{
  "score": number (1-100),
  "summary": {
    "totalIssues": number,
    "critical": number,
    "warning": number,
    "info": number
  },
  "overallRoast": "Roasting kocak, bahasa gaul, 2-3 kalimat",
  "suggestions": [
    {
      "id": "roast-1",
      "type": "bug|performance|style|security|docs|comedy",
      "severity": "high|medium|low",
      "line": number,
      "title": "Judul roasting singkat (gaul)",
      "description": "Penjelasan gaul 1-2 kalimat, to the point",
      "suggestion": "Solusi teknis singkat & actionable (tetap gaul)",
      "codeSnippet": {
        "original": "kode bermasalah",
        "improved": "kode yang diperbaiki"
      },
      "analogiKocak": "Analogi lucu 1 kalimat",
      "canAutoFix": boolean
    }
  ],
  "comedyGold": [
    "Satu-liner kocak 1",
    "Satu-liner kocak 2"
  ]
}

Ingat: tetep sopan, no toxic. Prioritas: manfaat teknis + bahasa gaul yang friendly.`,

    user: (
      code,
      language
    ) => `Roasting kode ${language} berikut pake bahasa gaul santai (lu/gue), pedes tapi bantuin, tetep singkat & fokus:

\`\`\`${language}
${code}
\`\`\`

Kasih 3-5 roasting yang kocak tapi berguna, jangan kepanjangan.`,
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
  "brutalAssessment": "Assessment jujur tentang kode dalam 1-2 kalimat",
  "suggestions": [
    {
      "id": "brutal-1",
      "type": "disaster|catastrophe|critical|bug",
      "severity": "critical|high|medium",
      "line": number,
      "title": "Judul tegas",
      "description": "Penjelasan tegas dalam 1-2 kalimat",
      "suggestion": "Solusi yang harus diterapkan dalam 1-2 kalimat",
      "codeSnippet": {
        "original": "kode bermasalah",
        "improved": "kode yang proper"
      },
      "canAutoFix": boolean
    }
  ],
  "harshTruth": "Kebenaran yang harus didengar"
}

Berikan review yang tegas tapi konstruktif dalam bahasa Indonesia.`,

    user: (
      code,
      language
    ) => `Review kode ${language} berikut dengan tegas dan jujur:

\`\`\`${language}
${code}
\`\`\`

Kasih feedback yang direct dan to the point.`,
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
  "positiveAssessment": "Assessment positif tentang kode dalam 1-2 kalimat",
  "suggestions": [
    {
      "id": "encourage-1",
      "type": "opportunity|improvement|enhancement|learning",
      "severity": "opportunity|suggestion|low",
      "line": number,
      "title": "Peluang perbaikan",
      "description": "Penjelasan supportif dalam 1-2 kalimat",
      "suggestion": "Saran encouraging dalam 1-2 kalimat",
      "codeSnippet": {
        "original": "kode sekarang",
        "improved": "kode yang lebih baik"
      },
      "canAutoFix": boolean
    }
  ],
  "growthMindset": "Motivasi untuk terus berkembang"
}

Berikan review yang supportive dalam bahasa Indonesia.`,

    user: (
      code,
      language
    ) => `Review kode ${language} berikut dengan pendekatan supportive:

\`\`\`${language}
${code}
\`\`\`

Kasih feedback yang encouraging dan membangun.`,
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
  "overallSecurityAssessment": "Assessment keamanan dalam 1-2 kalimat",
  "suggestions": [
    {
      "id": "security-1",
      "type": "security",
      "severity": "critical|high|medium|low",
      "line": number,
      "title": "Nama kerentanan",
      "description": "Penjelasan kerentanan dalam 1-2 kalimat",
      "suggestion": "Cara mengatasi dalam 1-2 kalimat",
      "codeSnippet": {
        "original": "kode vulnerable",
        "improved": "kode yang secure"
      },
      "canAutoFix": boolean
    }
  ],
  "securityChecklist": [
    "Checklist keamanan 1",
    "Checklist keamanan 2"
  ]
}

Fokus pada identifikasi masalah keamanan yang critical dalam bahasa Indonesia.`,

    user: (code, language) => `Analisis keamanan kode ${language} berikut:

\`\`\`${language}
${code}
\`\`\`

Berikan analisis keamanan yang focused dan actionable.`,
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
  "overallAssessment": "Assessment best practices dalam 1-2 kalimat",
  "suggestions": [
    {
      "id": "best-practice-1",
      "type": "style|architecture|performance|docs",
      "severity": "high|medium|low",
      "line": number,
      "title": "Best practice yang perlu diterapkan",
      "description": "Penjelasan dalam 1-2 kalimat",
      "suggestion": "Cara implementasi dalam 1-2 kalimat",
      "codeSnippet": {
        "original": "kode sekarang",
        "improved": "kode dengan best practice"
      },
      "canAutoFix": boolean
    }
  ],
  "designPatterns": [
    "Pattern yang bisa diterapkan"
  ]
}

Fokus pada best practices yang paling impactful dalam bahasa Indonesia.`,

    user: (code, language) => `Review best practices kode ${language} berikut:

\`\`\`${language}
${code}
\`\`\`

Berikan rekomendasi best practices yang concise dan actionable.`,
  },
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
    console.log("🔄 Initializing OpenAI service...");
    this.connectionPromise = this.checkConnection();
    await this.connectionPromise;
  }

  async checkConnection(): Promise<ConnectionResult> {
    try {
      const result = await testOpenAIConnection();
      this.isConnected = result.success;

      if (result.success) {
        console.log("✅ OpenAI API connected successfully");
        console.log(
          "📋 Available models:",
          result.availableModels?.slice(0, 10)
        );
      } else {
        console.error("❌ OpenAI connection failed:", result.message);
      }

      return result;
    } catch (error: unknown) {
      this.isConnected = false;
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("❌ Error koneksi OpenAI:", errorMessage);
      return { success: false, message: errorMessage, error };
    }
  }

  async reviewCode(
    code: string,
    language: string,
    reviewType: ReviewType = "codeQuality"
  ): Promise<ReviewResult> {
    if (!this.connectionPromise) {
      await this.init();
    } else {
      await this.connectionPromise;
    }

    if (!this.isConnected) {
      throw new Error("OpenAI API tidak terhubung. Silakan cek API key Anda.");
    }

    try {
      const prompt = REVIEW_PROMPTS[reviewType];
      if (!prompt) {
        throw new Error(`Tipe review tidak valid: ${reviewType}`);
      }

      console.log(`🔍 Starting ${reviewType} review for ${language} code...`);

      // Add additional instruction for JSON enforcement and concise responses
      const systemPrompt = `${prompt.system}

CRITICAL INSTRUCTIONS:
1. Your response MUST be a valid JSON object only. Do not include any text before or after the JSON. The response must start with { and end with }.
2. Keep responses CONCISE and FOCUSED. Prioritize quality over quantity.
3. Generate 3-5 most important suggestions maximum.
4. Each suggestion should be clear and actionable, not overly verbose.
5. No explanations outside JSON, ONLY valid JSON with focused content.`;

      const isOModel = (modelId: string) => /^o\d/i.test((modelId || '').trim())
      const MODELS_COMPLETION = new Set([
        'gpt-5-mini',
        'gpt-5-nano',
        'gpt-4.1-mini',
        'gpt-4.1-nano',
        'gpt-4o-mini',
        'o1-mini',
        'o4-mini',
      ])
      const usesCompletionTokens = (modelId: string) => MODELS_COMPLETION.has((modelId || '').trim()) || isOModel(modelId)
      const messages = isOModel(OPENAI_CONFIG.model)
        ? [
            { role: "user" as const, content: `${systemPrompt}\n\n${prompt.user(code, language)}` },
          ]
        : [
            { role: "system" as const, content: systemPrompt },
            { role: "user" as const, content: prompt.user(code, language) },
          ]

      // Create request object with optimized settings for reliable responses
      // Some models (o* family) require `max_completion_tokens` instead of `max_tokens`
      const useCompletionTokens = usesCompletionTokens(OPENAI_CONFIG.model)
      type ChatParams = ChatCompletionCreateParamsNonStreaming & { max_completion_tokens?: number }
      const requestOptions: ChatParams = {
        model: OPENAI_CONFIG.model,
        messages,
      } as ChatParams
      // Always request JSON response; if model rejects, we retry without in catch
      ;(requestOptions as ChatParams).response_format = { type: "json_object" } as const
      if (useCompletionTokens) {
        requestOptions.max_completion_tokens = OPENAI_CONFIG.max_tokens
      } else {
        requestOptions.max_tokens = OPENAI_CONFIG.max_tokens
        requestOptions.temperature = OPENAI_CONFIG.temperature
        requestOptions.top_p = OPENAI_CONFIG.top_p
        requestOptions.frequency_penalty = OPENAI_CONFIG.frequency_penalty
        requestOptions.presence_penalty = OPENAI_CONFIG.presence_penalty
      }

      let response;
      try {
        response = await openai.chat.completions.create(requestOptions);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        // Retry: switch to max_completion_tokens if max_tokens unsupported
        if (message.includes("Unsupported parameter") && message.includes("max_tokens")) {
          const retryOptions: ChatParams = {
            model: OPENAI_CONFIG.model,
            messages,
            max_completion_tokens: OPENAI_CONFIG.max_tokens,
          } as ChatParams
          try {
            response = await openai.chat.completions.create(retryOptions)
          } catch (err2: unknown) {
            // Final fallback: minimal payload (only model, messages, and token cap)
            const minimal: ChatParams = {
              model: OPENAI_CONFIG.model,
              messages,
            } as ChatParams
            if (usesCompletionTokens(OPENAI_CONFIG.model)) {
              minimal.max_completion_tokens = OPENAI_CONFIG.max_tokens
            } else {
              minimal.max_tokens = OPENAI_CONFIG.max_tokens
            }
            response = await openai.chat.completions.create(minimal)
          }
        } else if (message.includes("response_format") || message.includes("json_object")) {
          // Retry without response_format for models that reject it
          const minimal: ChatParams = {
            model: OPENAI_CONFIG.model,
            messages,
          } as ChatParams
          if (usesCompletionTokens(OPENAI_CONFIG.model)) {
            minimal.max_completion_tokens = OPENAI_CONFIG.max_tokens
          } else {
            minimal.max_tokens = OPENAI_CONFIG.max_tokens
          }
          response = await openai.chat.completions.create(minimal)
        } else {
          throw err
        }
      }

      let content = response.choices[0]?.message?.content?.trim() || "{}";
      // If model did not honor response_format and returned text, retry once to force JSON
      if (!/^\s*\{[\s\S]*\}\s*$/.test(content)) {
        const forceJsonMessages = [
          ...messages,
          { role: "user" as const, content: "Ulangi jawaban DALAM JSON VALID sesuai schema di instruksi. Wajib 3-5 suggestions. Jangan ada teks di luar JSON." },
        ]
        const forceJsonOptions: ChatParams = {
          model: OPENAI_CONFIG.model,
          messages: forceJsonMessages,
        } as ChatParams
        if (useCompletionTokens) {
          forceJsonOptions.max_completion_tokens = OPENAI_CONFIG.max_tokens
        } else {
          forceJsonOptions.max_tokens = OPENAI_CONFIG.max_tokens
          forceJsonOptions.temperature = OPENAI_CONFIG.temperature
          forceJsonOptions.top_p = OPENAI_CONFIG.top_p
          forceJsonOptions.frequency_penalty = OPENAI_CONFIG.frequency_penalty
          forceJsonOptions.presence_penalty = OPENAI_CONFIG.presence_penalty
          ;(forceJsonOptions as ChatParams).response_format = { type: "json_object" } as const
        }
        try {
          const retryResp = await openai.chat.completions.create(forceJsonOptions)
          content = retryResp.choices[0]?.message?.content?.trim() || content
        } catch {
          // keep original content
        }
        // final guard: if still not JSON, coerce minimal JSON to avoid empty UI
        if (!/^\s*\{[\s\S]*\}\s*$/.test(content)) {
          const safe = {
            score: 50,
            summary: { totalIssues: 0, critical: 0, warning: 0, info: 0 },
            overallAssessment: content.slice(0, 300),
            suggestions: [] as unknown[],
          }
          content = JSON.stringify(safe)
        }
      }

      // Clean up the response to extract JSON if it's wrapped in other text
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        content = jsonMatch[0];
      }

      console.log("📄 AI Response length:", content.length, "characters");

      // Parse JSON response
      try {
        const parsedResult = JSON.parse(content) as AIResponseData;

        // Validate required properties and provide defaults
        const validatedResult: ReviewResult = {
          score: parsedResult.score || 50,
          summary: {
            totalIssues: parsedResult.summary?.totalIssues || 0,
            critical: parsedResult.summary?.critical || 0,
            warning: parsedResult.summary?.warning || 0,
            info: parsedResult.summary?.info || 0,
          },
          suggestions: Array.isArray(parsedResult.suggestions)
            ? parsedResult.suggestions.map(
                (suggestion: AISuggestionResponse, index: number) => ({
                  id: suggestion.id || `suggestion-${index}`,
                  type: (suggestion.type || "info") as ReviewSuggestion['type'],
                  severity: (suggestion.severity || "low") as ReviewSuggestion['severity'],
                  line: suggestion.line || 1,
                  title: suggestion.title || `Saran ${index + 1}`,
                  description:
                    suggestion.description || "Tidak ada deskripsi tersedia",
                  suggestion:
                    suggestion.suggestion || "Tidak ada saran spesifik",
                  codeSnippet: {
                    original: suggestion.codeSnippet?.original || "",
                    improved: suggestion.codeSnippet?.improved || "",
                  },
                  // Only include essential dynamic fields
                  analogiKocak: suggestion.analogiKocak || undefined,
                  urgencyLevel: suggestion.urgencyLevel || undefined,
                  learningOpportunity:
                    suggestion.learningOpportunity || undefined,
                  canAutoFix: suggestion.canAutoFix || false,
                }))
            : [],
          metadata: {
            reviewType,
            language,
            model: OPENAI_CONFIG.model,
            timestamp: new Date().toISOString(),
            tokensUsed: response.usage?.total_tokens || 0,
            // Store only essential assessment fields
            overallAssessment: parsedResult.overallAssessment || undefined,
            overallSecurityAssessment:
              parsedResult.overallSecurityAssessment || undefined,
            overallRoast: parsedResult.overallRoast || undefined,
            brutalAssessment: parsedResult.brutalAssessment || undefined,
            positiveAssessment: parsedResult.positiveAssessment || undefined,
            recommendations: parsedResult.recommendations || undefined,
            securityChecklist: parsedResult.securityChecklist || undefined,
            designPatterns: parsedResult.designPatterns || undefined,
            comedyGold: parsedResult.comedyGold || undefined,
            motivasiSarkastik: parsedResult.motivasiSarkastik || undefined,
            harshTruth: parsedResult.harshTruth || undefined,
            growthMindset: parsedResult.growthMindset || undefined,
          },
        };

        // If suggestions kosong atau nol, minta pengulangan sekali lagi untuk mengisi suggestions
        if (!validatedResult.suggestions || validatedResult.suggestions.length === 0) {
          const nudgeMessages = [
            ...messages,
            { role: "user" as const, content: "Tambahkan 3-5 suggestions yang paling penting. Format tetap JSON valid sesuai schema." },
          ]
          const nudgeOptions: ChatParams = {
            model: OPENAI_CONFIG.model,
            messages: nudgeMessages,
          } as ChatParams
          if (useCompletionTokens) {
            nudgeOptions.max_completion_tokens = OPENAI_CONFIG.max_tokens
          } else {
            nudgeOptions.max_tokens = OPENAI_CONFIG.max_tokens
            nudgeOptions.temperature = OPENAI_CONFIG.temperature
            nudgeOptions.top_p = OPENAI_CONFIG.top_p
            nudgeOptions.frequency_penalty = OPENAI_CONFIG.frequency_penalty
            nudgeOptions.presence_penalty = OPENAI_CONFIG.presence_penalty
            ;(nudgeOptions as ChatParams).response_format = { type: "json_object" } as const
          }
          try {
            const nudgeResp = await openai.chat.completions.create(nudgeOptions)
            let nudgeContent = nudgeResp.choices[0]?.message?.content?.trim() || "{}"
            const nudgeMatch = nudgeContent.match(/\{[\s\S]*\}/)
            if (nudgeMatch) nudgeContent = nudgeMatch[0]
            const nudgeParsed = JSON.parse(nudgeContent) as AIResponseData
            if (Array.isArray(nudgeParsed.suggestions) && nudgeParsed.suggestions.length > 0) {
              validatedResult.suggestions = nudgeParsed.suggestions.map((suggestion: AISuggestionResponse, index: number) => ({
                id: suggestion.id || `suggestion-${index}`,
                type: (suggestion.type || "info") as ReviewSuggestion['type'],
                severity: (suggestion.severity || "low") as ReviewSuggestion['severity'],
                line: suggestion.line || 1,
                title: suggestion.title || `Saran ${index + 1}`,
                description: suggestion.description || "Tidak ada deskripsi tersedia",
                suggestion: suggestion.suggestion || "Tidak ada saran spesifik",
                codeSnippet: {
                  original: suggestion.codeSnippet?.original || "",
                  improved: suggestion.codeSnippet?.improved || "",
                },
                analogiKocak: suggestion.analogiKocak || undefined,
                urgencyLevel: suggestion.urgencyLevel || undefined,
                learningOpportunity: suggestion.learningOpportunity || undefined,
                canAutoFix: suggestion.canAutoFix || false,
              }))
            }
          } catch {/* ignore nudge failure */}
        }

        console.log("✅ Code review completed successfully");
        console.log(
          `📊 Found ${validatedResult.summary.totalIssues} issues (${validatedResult.summary.critical} critical)`
        );
        return validatedResult;
      } catch (parseError) {
        console.error(
          "❌ Gagal parse response OpenAI sebagai JSON:",
          parseError
        );
        console.log("📄 Raw response:", content.substring(0, 500));

        // Create a manual review result from the raw response
        const fallbackSuggestions = [];

        // Try to extract useful information from the raw response
        if (content.includes("error") || content.includes("Error")) {
          fallbackSuggestions.push({
            id: `error-${Date.now()}`,
            type: "info" as const,
            severity: "medium" as const,
            line: 1,
            title: "AI Response Error",
            description:
              "AI memberikan respons tapi tidak dalam format yang diharapkan.",
            suggestion:
              "Coba upload kode yang lebih kecil atau gunakan reviewer type yang berbeda.",
            codeSnippet: { original: "", improved: "" },
            canAutoFix: false,
          });
        } else {
          // Extract some content as a general suggestion
          const truncatedContent = content
            .substring(0, 150)
            .replace(/[{}[\]"]/g, "");
          fallbackSuggestions.push({
            id: `fallback-${Date.now()}`,
            type: "info" as const,
            severity: "low" as const,
            line: 1,
            title: "Review Tersedia (Format Tidak Standar)",
            description:
              "AI sudah memberikan feedback tapi formatnya tidak sesuai.",
            suggestion:
              truncatedContent ||
              "Coba upload ulang atau pilih reviewer personality yang berbeda.",
            codeSnippet: { original: "", improved: "" },
            canAutoFix: false,
          });
        }

        // Fallback response with concise Indonesian messages
        const sarcasticFallbacks = [
          "AI-nya lagi confused kayaknya 🤖",
          "Response format error, coba lagi deh �",
          "Parsing issue, mungkin kode terlalu kompleks 📝",
          "AI butuh coffee break ☕",
        ];

        const randomMessage =
          sarcasticFallbacks[
            Math.floor(Math.random() * sarcasticFallbacks.length)
          ];

        return {
          score: 5,
          summary: { totalIssues: 1, critical: 0, warning: 0, info: 1 },
          suggestions: fallbackSuggestions,
          metadata: {
            reviewType,
            language,
            model: OPENAI_CONFIG.model,
            timestamp: new Date().toISOString(),
            tokensUsed: response.usage?.total_tokens || 0,
            fallback: true,
            error: randomMessage,
          },
        };
      }
    } catch (error: unknown) {
      console.error("❌ Code review gagal:", error);

      if (error instanceof Error) {
        if (error.message.includes("insufficient_quota")) {
          throw new Error(
            "Kuota OpenAI API habis. Silakan cek pengaturan billing Anda."
          );
        }

        if (error.message.includes("invalid_api_key")) {
          throw new Error(
            "API key OpenAI tidak valid. Silakan cek konfigurasi Anda."
          );
        }

        throw new Error(`Code review gagal: ${error.message}`);
      }

      throw new Error("Terjadi error yang tidak diketahui saat code review");
    }
  }

  async generateBestPractices(language: string): Promise<string> {
    try {
      const isOModel = (modelId: string) => /^o\d/i.test((modelId || '').trim())
      const messages = isOModel(OPENAI_CONFIG.model)
        ? [
            {
              role: "user" as const,
              content: `Generate best practices dan pola umum untuk bahasa pemrograman ${language} dalam bahasa Indonesia. Sertakan contoh kode dan penjelasan yang detail.`,
            },
          ]
        : [
            {
              role: "system" as const,
              content: `Generate best practices dan pola umum untuk bahasa pemrograman ${language} dalam bahasa Indonesia. Sertakan contoh kode dan penjelasan yang detail.`,
            },
          ]

      const requiresCompletionTokens = (modelId: string) => /^o\d/i.test((modelId || '').trim())
      const useCompletionTokensBP = requiresCompletionTokens(OPENAI_CONFIG.model)
      const bestPracticesOptions: ChatParams = {
        model: OPENAI_CONFIG.model,
        messages,
      } as ChatParams
      // Always request JSON response; if model rejects, we retry without in catch
      ;(bestPracticesOptions as ChatParams).response_format = { type: "json_object" } as const
      if (useCompletionTokensBP) {
        bestPracticesOptions.max_completion_tokens = OPENAI_CONFIG.max_tokens
      } else {
        bestPracticesOptions.max_tokens = OPENAI_CONFIG.max_tokens
        bestPracticesOptions.temperature = OPENAI_CONFIG.temperature
        bestPracticesOptions.top_p = OPENAI_CONFIG.top_p
        bestPracticesOptions.frequency_penalty = OPENAI_CONFIG.frequency_penalty
        bestPracticesOptions.presence_penalty = OPENAI_CONFIG.presence_penalty
      }
      let response;
      try {
        response = await openai.chat.completions.create(bestPracticesOptions);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        if (message.includes("Unsupported parameter") && message.includes("max_tokens")) {
          const retryOptions: ChatParams = {
            model: OPENAI_CONFIG.model,
            messages,
            max_completion_tokens: OPENAI_CONFIG.max_tokens,
          } as ChatParams
          response = await openai.chat.completions.create(retryOptions)
        } else {
          throw err
        }
      }

      return response.choices[0]?.message?.content || "";
    } catch (error: unknown) {
      console.error("❌ Gagal generate best practices:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Gagal generate best practices: ${errorMessage}`);
    }
  }

  getConnectionStatus(): ConnectionStatus {
    return {
      isConnected: this.isConnected,
      model: OPENAI_CONFIG.model,
      maxTokens: OPENAI_CONFIG.max_tokens,
    };
  }

  async getUsageStats(): Promise<UsageStats> {
    try {
      // Note: OpenAI doesn't provide usage stats directly
      // You might want to track this in your app
      return {
        message: "Usage stats not available from OpenAI API",
        suggestion: "Check your OpenAI dashboard for detailed usage",
      };
    } catch (error: unknown) {
      console.error("❌ Gagal mendapatkan usage stats:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return { error: errorMessage };
    }
  }
}

export const openaiService = new OpenAIService();
export { REVIEW_PROMPTS };
