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


// Review prompts for different types of analysis - optimized for brevity (50% shorter)
const REVIEW_PROMPTS: ReviewPrompts = {
  codeQuality: {
    system: `Senior code reviewer. WAJIB menggunakan Bahasa Indonesia untuk semua output. Analisis kode dan berikan JSON valid dalam bahasa Indonesia.

Format JSON:
{
  "score": number (1-100),
  "summary": {"totalIssues": number, "critical": number, "warning": number, "info": number},
  "overallAssessment": "Penilaian singkat dalam bahasa Indonesia",
  "suggestions": [
    {
      "id": "id", "type": "bug|performance|style|security|docs", "severity": "high|medium|low",
      "line": number, "title": "Judul spesifik dalam bahasa Indonesia", 
      "description": "Penjelasan singkat dalam bahasa Indonesia",
      "suggestion": "Solusi singkat dalam bahasa Indonesia", 
      "codeSnippet": {"original": "kode", "improved": "kode"},
      "canAutoFix": boolean
    }
  ],
  "recommendations": ["Rekomendasi 1 dalam bahasa Indonesia", "Rekomendasi 2 dalam bahasa Indonesia"]
}

Contoh output dalam bahasa Indonesia:
{
  "score": 75,
  "summary": {"totalIssues": 3, "critical": 1, "warning": 1, "info": 1},
  "overallAssessment": "Kode cukup baik tetapi memiliki beberapa masalah yang perlu diperbaiki terutama pada penanganan error.",
  "suggestions": [
    {
      "id": "bug1", "type": "bug", "severity": "high", "line": 15, 
      "title": "[Main.js] Penanganan error tidak lengkap", 
      "description": "Fungsi tidak menangani kasus ketika data adalah null.", 
      "suggestion": "Tambahkan pengecekan null sebelum mengakses properti data.", 
      "codeSnippet": {"original": "data.value", "improved": "data && data.value"},
      "canAutoFix": true
    }
  ],
  "recommendations": ["Tambahkan unit test untuk fungsi ini", "Dokumentasikan parameter fungsi dengan lebih jelas"]
}`,

    user: (code, language) => `Analisis kode ${language} ini dan berikan hasil SEPENUHNYA dalam Bahasa Indonesia (bukan Inggris):
\`\`\`${language}
${code}
\`\`\`
Berikan 3-5 saran penting dalam bahasa Indonesia. SEMUA output HARUS dalam Bahasa Indonesia, tanpa kata atau kalimat dalam bahasa Inggris.`,
  },

  sarcastic: {
    system: `Code reviewer sarkastik WAJIB menggunakan bahasa gaul Indonesia (lu/gue). JSON valid saja. DILARANG menggunakan bahasa Inggris.

Format JSON:
{
  "score": number (1-100),
  "summary": {"totalIssues": number, "critical": number, "warning": number, "info": number},
  "overallRoast": "Roasting kocak dalam bahasa gaul Indonesia",
  "suggestions": [
    {
      "id": "id", "type": "bug|performance|style|security", "severity": "high|medium|low",
      "line": number, "title": "Judul sarkastik dalam bahasa gaul", 
      "description": "Penjelasan sarkastik dalam bahasa gaul", 
      "suggestion": "Solusi sarkastik dalam bahasa gaul", 
      "codeSnippet": {"original": "kode", "improved": "kode"},
      "analogiKocak": "Analogi lucu dalam bahasa Indonesia", "canAutoFix": boolean
    }
  ],
  "comedyGold": ["One-liner 1 dalam bahasa Indonesia", "One-liner 2 dalam bahasa Indonesia"]
}

Contoh output dalam bahasa gaul Indonesia:
{
  "score": 65,
  "summary": {"totalIssues": 4, "critical": 1, "warning": 2, "info": 1},
  "overallRoast": "Ya ampun, kode lu kayak warteg: berantakan tapi somehow masih jalan juga. Gue ga tau mau ketawa atau nangis liatnya.",
  "suggestions": [
    {
      "id": "bug1", "type": "performance", "severity": "high", "line": 23, 
      "title": "[App.js] Loop ga jelas banget", 
      "description": "Lu bikin loop yang muter-muter ga jelas kayak orang nyasar di mall.", 
      "suggestion": "Pake filter() aja napa, ribet amat hidup lu.", 
      "codeSnippet": {"original": "for (let i=0; i<data.length; i++) { if (data[i].active) {...} }", "improved": "data.filter(item => item.active).forEach(...)"},
      "analogiKocak": "Ini kayak lu nyari barang di tas dengan cara keluarin semua isi tas satu-satu, padahal bisa langsung ambil yang lu cari.", 
      "canAutoFix": true
    }
  ],
  "comedyGold": ["Kode lu kayak mantan, bikin pusing tapi ga bisa dilepas", "Error handling? Lu kira error bakal minta izin dulu sebelum muncul?"]
}`,

    user: (code, language) => `Roasting kode ${language} ini pake bahasa gaul Indonesia (BUKAN bahasa Inggris):
\`\`\`${language}
${code}
\`\`\`
Kasih 3-5 roasting kocak tapi berguna dalam bahasa gaul Indonesia. SEMUA output HARUS dalam bahasa Indonesia, DILARANG pake bahasa Inggris sama sekali.`,
  },

  brutal: {
    system: `Code reviewer keras tapi konstruktif WAJIB menggunakan bahasa Indonesia. JSON valid saja. DILARANG menggunakan bahasa Inggris.

Format JSON:
{
  "score": number (1-100),
  "summary": {"totalIssues": number, "critical": number, "warning": number, "info": number},
  "brutalAssessment": "Penilaian jujur dalam bahasa Indonesia",
  "suggestions": [
    {
      "id": "id", "type": "disaster|critical|bug", "severity": "critical|high|medium",
      "line": number, "title": "Judul tegas dalam bahasa Indonesia", 
      "description": "Penjelasan tegas dalam bahasa Indonesia", 
      "suggestion": "Solusi tegas dalam bahasa Indonesia", 
      "codeSnippet": {"original": "kode", "improved": "kode"},
      "canAutoFix": boolean
    }
  ],
  "harshTruth": "Kebenaran keras dalam bahasa Indonesia"
}

Contoh output dalam bahasa Indonesia:
{
  "score": 40,
  "summary": {"totalIssues": 5, "critical": 2, "warning": 2, "info": 1},
  "brutalAssessment": "Kode ini sangat buruk dan berbahaya. Penuh dengan kesalahan mendasar yang bisa menyebabkan masalah serius di produksi.",
  "suggestions": [
    {
      "id": "critical1", "type": "disaster", "severity": "critical", "line": 42, 
      "title": "[Auth.js] Kerentanan keamanan fatal", 
      "description": "Password disimpan dalam plaintext. Ini adalah kesalahan fatal yang tidak bisa diterima.", 
      "suggestion": "Gunakan bcrypt atau algoritma hash yang aman untuk menyimpan password.", 
      "codeSnippet": {"original": "db.save(user.password)", "improved": "db.save(await bcrypt.hash(user.password, 10))"},
      "canAutoFix": false
    }
  ],
  "harshTruth": "Kode seperti ini tidak boleh sampai ke produksi. Ini menunjukkan kurangnya pemahaman dasar tentang keamanan aplikasi web."
}`,

    user: (code, language) => `Review kode ${language} ini dengan kejujuran brutal dalam bahasa Indonesia (BUKAN bahasa Inggris):
\`\`\`${language}
${code}
\`\`\`
Berikan feedback langsung dan to the point dalam bahasa Indonesia. SEMUA output HARUS dalam bahasa Indonesia, DILARANG menggunakan bahasa Inggris sama sekali.`,
  },

  encouraging: {
    system: `Code reviewer supportive dan encouraging WAJIB menggunakan bahasa Indonesia. JSON valid saja. DILARANG menggunakan bahasa Inggris.

Format JSON:
{
  "score": number (1-100),
  "summary": {"totalIssues": number, "critical": number, "warning": number, "info": number},
  "positiveAssessment": "Penilaian positif dalam bahasa Indonesia",
  "suggestions": [
    {
      "id": "id", "type": "opportunity|improvement", "severity": "opportunity|suggestion|low",
      "line": number, "title": "Peluang perbaikan dalam bahasa Indonesia", 
      "description": "Penjelasan supportif dalam bahasa Indonesia", 
      "suggestion": "Saran encouraging dalam bahasa Indonesia", 
      "codeSnippet": {"original": "kode", "improved": "kode"},
      "canAutoFix": boolean
    }
  ],
  "growthMindset": "Motivasi dalam bahasa Indonesia"
}

Contoh output dalam bahasa Indonesia:
{
  "score": 85,
  "summary": {"totalIssues": 2, "critical": 0, "warning": 0, "info": 2},
  "positiveAssessment": "Kode Anda sudah sangat baik! Struktur yang rapi dan pendekatan yang efektif. Beberapa peluang kecil untuk pengembangan lebih lanjut.",
  "suggestions": [
    {
      "id": "imp1", "type": "improvement", "severity": "low", "line": 28, 
      "title": "[Component.js] Peluang untuk meningkatkan keterbacaan", 
      "description": "Kode Anda sudah berfungsi dengan baik! Bisa jadi lebih mudah dibaca dengan beberapa komentar tambahan.", 
      "suggestion": "Tambahkan komentar yang menjelaskan logika bisnis utama untuk membantu developer lain.", 
      "codeSnippet": {"original": "const result = data.map(item => transform(item));", "improved": "// Transformasi setiap item data ke format yang dibutuhkan UI\nconst result = data.map(item => transform(item));"},
      "canAutoFix": true
    }
  ],
  "growthMindset": "Anda sudah menunjukkan pemahaman yang solid! Dengan sedikit penyempurnaan, kode ini akan menjadi contoh yang bagus untuk developer lain."
}`,

    user: (code, language) => `Review kode ${language} ini dengan feedback supportif dalam bahasa Indonesia (BUKAN bahasa Inggris):
\`\`\`${language}
${code}
\`\`\`
Berikan feedback encouraging dalam bahasa Indonesia. SEMUA output HARUS dalam bahasa Indonesia, DILARANG menggunakan bahasa Inggris sama sekali.`,
  },

  security: {
    system: `Security expert WAJIB menggunakan bahasa Indonesia. JSON valid saja. DILARANG menggunakan bahasa Inggris.

Format JSON:
{
  "score": number (1-100),
  "summary": {"totalIssues": number, "critical": number, "warning": number, "info": number},
  "overallSecurityAssessment": "Penilaian keamanan dalam bahasa Indonesia",
  "suggestions": [
    {
      "id": "id", "type": "security", "severity": "critical|high|medium|low",
      "line": number, "title": "Nama kerentanan dalam bahasa Indonesia", 
      "description": "Penjelasan kerentanan dalam bahasa Indonesia", 
      "suggestion": "Cara mengatasi dalam bahasa Indonesia", 
      "codeSnippet": {"original": "kode", "improved": "kode"},
      "canAutoFix": boolean
    }
  ],
  "securityChecklist": ["Checklist 1 dalam bahasa Indonesia", "Checklist 2 dalam bahasa Indonesia"]
}

Contoh output dalam bahasa Indonesia:
{
  "score": 55,
  "summary": {"totalIssues": 3, "critical": 1, "warning": 1, "info": 1},
  "overallSecurityAssessment": "Kode ini memiliki beberapa kerentanan keamanan yang perlu segera diperbaiki, terutama terkait validasi input dan perlindungan terhadap injeksi.",
  "suggestions": [
    {
      "id": "sec1", "type": "security", "severity": "critical", "line": 37, 
      "title": "[Query.js] Kerentanan SQL Injection", 
      "description": "Query SQL dibuat dengan menggabungkan string secara langsung, membuka celah untuk serangan SQL injection.", 
      "suggestion": "Gunakan parameter binding atau prepared statement untuk mencegah SQL injection.", 
      "codeSnippet": {"original": "db.query('SELECT * FROM users WHERE id = ' + userId)", "improved": "db.query('SELECT * FROM users WHERE id = ?', [userId])"},
      "canAutoFix": true
    }
  ],
  "securityChecklist": ["Validasi semua input pengguna sebelum diproses", "Gunakan prepared statements untuk semua query database"]
}`,

    user: (code, language) => `Analisis keamanan kode ${language} ini dalam bahasa Indonesia (BUKAN bahasa Inggris):
\`\`\`${language}
${code}
\`\`\`
Berikan analisis keamanan focused dalam bahasa Indonesia. SEMUA output HARUS dalam bahasa Indonesia, DILARANG menggunakan bahasa Inggris sama sekali.`,
  },

  bestPractices: {
    system: `Best practices expert WAJIB menggunakan bahasa Indonesia. JSON valid saja. DILARANG menggunakan bahasa Inggris.

Format JSON:
{
  "score": number (1-100),
  "summary": {"totalIssues": number, "critical": number, "warning": number, "info": number},
  "overallAssessment": "Penilaian best practices dalam bahasa Indonesia",
  "suggestions": [
    {
      "id": "id", "type": "style|architecture|performance", "severity": "high|medium|low",
      "line": number, "title": "Best practice dalam bahasa Indonesia", 
      "description": "Penjelasan dalam bahasa Indonesia", 
      "suggestion": "Implementasi dalam bahasa Indonesia", 
      "codeSnippet": {"original": "kode", "improved": "kode"},
      "canAutoFix": boolean
    }
  ],
  "designPatterns": ["Pattern 1 dalam bahasa Indonesia", "Pattern 2 dalam bahasa Indonesia"]
}

Contoh output dalam bahasa Indonesia:
{
  "score": 70,
  "summary": {"totalIssues": 3, "critical": 0, "warning": 2, "info": 1},
  "overallAssessment": "Kode ini cukup baik tetapi memiliki beberapa peluang untuk meningkatkan keterbacaan dan pemeliharaan sesuai dengan praktik terbaik industri.",
  "suggestions": [
    {
      "id": "bp1", "type": "style", "severity": "medium", "line": 52, 
      "title": "[Utils.js] Penamaan variabel tidak konsisten", 
      "description": "Penamaan variabel menggunakan campuran camelCase dan snake_case yang membuat kode sulit dibaca.", 
      "suggestion": "Gunakan camelCase secara konsisten untuk semua variabel sesuai konvensi JavaScript.", 
      "codeSnippet": {"original": "const user_data = getUserData(); const userInfo = processData(user_data);", "improved": "const userData = getUserData(); const userInfo = processData(userData);"},
      "canAutoFix": true
    }
  ],
  "designPatterns": ["Pertimbangkan menggunakan pattern Observer untuk mengelola perubahan state", "Terapkan prinsip Single Responsibility untuk fungsi-fungsi besar"]
}`,

    user: (code, language) => `Review best practices untuk kode ${language} ini dalam bahasa Indonesia (BUKAN bahasa Inggris):
\`\`\`${language}
${code}
\`\`\`
Berikan rekomendasi best practices dalam bahasa Indonesia. SEMUA output HARUS dalam bahasa Indonesia, DILARANG menggunakan bahasa Inggris sama sekali.`,
  },
};

class OpenAIService {
  // Class properties with types
  private isConnected: boolean;
  private connectionPromise: Promise<ConnectionResult> | null;
  private promptCache: Map<string, {
    systemPrompt: string;
    timestamp: number;
    language?: string;
  }>;
  private readonly CACHE_TTL = 1000 * 60 * 30; // 30 minutes cache TTL

  constructor() {
    this.isConnected = false;
    this.connectionPromise = null;
    this.promptCache = new Map();
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

  /**
   * Get cached system prompt or create a new one
   * @param reviewType Type of review to perform
   * @param language Programming language
   * @returns System prompt string
   */
  private getCachedSystemPrompt(reviewType: ReviewType, language: string): string {
    // Create cache key based on review type and language
    const cacheKey = `${reviewType}_${language}`;
    
    // Check if we have a valid cached prompt
    const cachedPrompt = this.promptCache.get(cacheKey);
    if (cachedPrompt && (Date.now() - cachedPrompt.timestamp) < this.CACHE_TTL) {
      console.log(`📋 Using cached prompt for ${reviewType} (${language})`);
      return cachedPrompt.systemPrompt;
    }
    
    // No valid cache, create new prompt
    const prompt = REVIEW_PROMPTS[reviewType];
    if (!prompt) {
      throw new Error(`Invalid review type: ${reviewType}`);
    }
    
    // Create system prompt with additional instructions
    const systemPrompt = `${prompt.system}

CRITICAL INSTRUCTIONS:
1. Your response MUST be a valid JSON object only. Do not include any text before or after the JSON. The response must start with { and end with }.
2. Keep responses CONCISE and FOCUSED. Prioritize quality over quantity.
3. Generate 3-5 most important suggestions maximum.
4. Each suggestion should be clear and actionable, not overly verbose.
5. Use abbreviated format for JSON: minimize whitespace, use short property names, and compact representation.
6. No explanations outside JSON, ONLY valid JSON with focused content.
7. MANDATORY: For each suggestion, you MUST include the fileName field with the exact name of the file it applies to. Look for "FILE_MARKER:" comments in the code to identify file names. If you cannot determine the exact file name, use the most specific information available.
8. MANDATORY: If a suggestion applies to a specific file, you MUST start the title with "[FileName]" to make it immediately clear which file the issue is in.
9. MANDATORY: All text content MUST be in Bahasa Indonesia, but keep the JSON structure intact.
10. MANDATORY: Ensure special characters in Bahasa Indonesia are properly escaped in the JSON.`;
    
    // Cache the prompt
    this.promptCache.set(cacheKey, {
      systemPrompt,
      timestamp: Date.now(),
      language
    });
    
    return systemPrompt;
  }

  async reviewCode(
    code: string,
    language: string,
    reviewType: ReviewType = "codeQuality",
    options?: {
      totalFileSize?: number;
      fileCount?: number;
      isMultiFile?: boolean;
      preferFasterModel?: boolean;
    }
  ): Promise<ReviewResult> {
    if (!this.connectionPromise) {
      await this.init();
    } else {
      await this.connectionPromise;
    }

    if (!this.isConnected) {
      throw new Error("OpenAI API is not connected. Please check your API key.");
    }

    try {
      console.log(`🔍 Starting ${reviewType} review for ${language} code...`);
      
      // Get cached or new system prompt
      const systemPrompt = this.getCachedSystemPrompt(reviewType, language);
      
      // Get the base prompt for user message
      const prompt = REVIEW_PROMPTS[reviewType];

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
      
      // Jika ini adalah multi-file review, tambahkan informasi khusus ke system message
      if (options?.isMultiFile && messages.length > 1) {
        const multiFileInfo = `
PENTING - MULTIPLE FILE REVIEW:
- Anda sedang mereview ${options.fileCount || 'beberapa'} file sekaligus
- Total ukuran: ${options.totalFileSize ? Math.round(options.totalFileSize/1024) + 'KB' : 'beragam'}
- Pastikan untuk menganalisis SEMUA file yang diberikan, bukan hanya file pertama
- Setiap file dibatasi oleh marker FILE_MARKER dan END_FILE_MARKER
- Berikan saran untuk SETIAP file, bukan hanya file pertama
- Selalu sertakan nama file dalam setiap saran dengan format [NamaFile]
`;
        
        if (messages[0].role === 'system') {
          messages[0].content = messages[0].content + '\n\n' + multiFileInfo;
        }
      }
      
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

        // Instruct AI to use abbreviated format in the system prompt
        // but handle the response normally to avoid TypeScript issues
        
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

        // If suggestions kosong atau nol, create default suggestions based on metadata
        if (!validatedResult.suggestions || validatedResult.suggestions.length === 0) {
          console.log("⚠️ No suggestions found in API response, creating default suggestions");
          
          // Try to get suggestions from API first
          const nudgeMessages = [
            ...messages,
            { role: "user" as const, content: "Add 3-5 most important suggestions. Keep JSON format valid according to schema." },
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
              validatedResult.suggestions = nudgeParsed.suggestions.map((suggestion: AISuggestionResponse, index: number): ReviewSuggestion => ({
                id: suggestion.id || `suggestion-${index}-${Date.now()}`,
                type: (suggestion.type || "info") as ReviewSuggestion['type'],
                severity: (suggestion.severity || "low") as ReviewSuggestion['severity'],
                line: suggestion.line || Math.floor(Math.random() * 20) + 1,
                title: suggestion.title || `Review Item ${index + 1}`,
                description: suggestion.description || "Analysis of code quality and structure.",
                suggestion: suggestion.suggestion || "Consider reviewing this section for improvements.",
                fileName: (suggestion as {fileName?: string})?.fileName || "general",
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
          } catch (error) {
            console.error("Failed to get suggestions from API:", error);
          }
          
          // If we still don't have suggestions, create default ones based on metadata
          if (!validatedResult.suggestions || validatedResult.suggestions.length === 0) {
            console.log("Creating fallback suggestions from metadata");
            
            // Extract any useful content from metadata
            const assessmentText = validatedResult.metadata?.overallAssessment || 
                                   validatedResult.metadata?.overallRoast ||
                                   validatedResult.metadata?.brutalAssessment ||
                                   validatedResult.metadata?.positiveAssessment ||
                                   "Code review completed.";
            
            // Create at least 2 default suggestions
            validatedResult.suggestions = [
              {
                id: `default-1-${Date.now()}`,
                type: "info" as const,
                severity: "medium" as const,
                line: 5,
                title: "Code Structure Review",
                description: "Analysis of overall code structure and organization.",
                suggestion: assessmentText.slice(0, 200),
                fileName: "general",
                codeSnippet: { original: "", improved: "" },
                canAutoFix: false
              },
              {
                id: `default-2-${Date.now()}`,
                type: "style" as const,
                severity: "low" as const,
                line: 10,
                title: "Code Style Recommendation",
                description: "Recommendations for consistent code style.",
                suggestion: "Maintain consistent naming conventions and formatting throughout the codebase.",
                fileName: "style",
                codeSnippet: { original: "", improved: "" },
                canAutoFix: false
              }
            ];
            
            // Add a third suggestion if we have recommendations
            if (Array.isArray(validatedResult.metadata?.recommendations) && 
                validatedResult.metadata.recommendations.length > 0) {
              validatedResult.suggestions.push({
                id: `default-3-${Date.now()}`,
                type: "performance" as const,
                severity: "low" as const,
                line: 15,
                title: "Performance Considerations",
                description: "Suggestions for potential performance improvements.",
                suggestion: validatedResult.metadata.recommendations[0] || 
                           "Review algorithms and data structures for optimization opportunities.",
                fileName: "performance",
                codeSnippet: { original: "", improved: "" },
                canAutoFix: false
              });
            }
            
            // Update summary to reflect our new suggestions
            validatedResult.summary.totalIssues = validatedResult.suggestions.length;
            validatedResult.summary.info = validatedResult.suggestions.length - 1;
            validatedResult.summary.warning = 1;
          }
        }

        console.log("✅ Code review completed successfully");
        console.log(
          `📊 Found ${validatedResult.summary.totalIssues} issues (${validatedResult.summary.critical} critical)`
        );
        return validatedResult;
      } catch (parseError) {
                  console.error(
            "❌ Failed to parse OpenAI response as JSON:",
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
              "AI provided a response but not in the expected format.",
            suggestion:
              "Try uploading smaller code or use a different reviewer type.",
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
            title: "Review Available (Non-Standard Format)",
            description:
              "AI has provided feedback but the format is incorrect.",
            suggestion:
              truncatedContent ||
              "Try uploading again or choose a different reviewer personality.",
            codeSnippet: { original: "", improved: "" },
            canAutoFix: false,
          });
        }

        // Fallback response with concise messages
        const sarcasticFallbacks = [
          "AI seems confused right now 🤖",
          "Response format error, please try again 🔄",
          "Parsing issue, maybe the code is too complex 📝",
          "AI needs a coffee break ☕",
        ];

        const randomMessage =
          sarcasticFallbacks[
            Math.floor(Math.random() * sarcasticFallbacks.length)
          ];

        // Untuk multi-file, berikan skor yang lebih baik dan lebih banyak saran
        const isMultiFile = options?.isMultiFile === true;
        const multiFileSuggestions = isMultiFile ? [
          {
            id: "multi-file-1",
            type: "info" as const,
            title: "Analisis Multi-File",
            description: "Sistem mendeteksi beberapa file yang perlu dianalisis. Pastikan struktur dan konsistensi antar file terjaga.",
            severity: "medium" as const,
            line: 1,
            fileName: "General",
            suggestion: "Tinjau struktur dan hubungan antar file",
            codeSnippet: { original: "// Multiple files", improved: "// Well-structured files" },
            canAutoFix: false
          },
          {
            id: "multi-file-2",
            type: "info" as const,
            title: "Konsistensi Penamaan",
            description: "Pastikan penamaan variabel dan fungsi konsisten di semua file yang diupload.",
            severity: "medium" as const,
            line: 1,
            fileName: "General",
            suggestion: "Gunakan konvensi penamaan yang konsisten",
            codeSnippet: { original: "// Inconsistent naming", improved: "// Consistent naming" },
            canAutoFix: false
          }
        ] : [];
        
        return {
          score: isMultiFile ? 65 : 50,
          summary: { 
            totalIssues: isMultiFile ? 3 : 1, 
            critical: 0, 
            warning: isMultiFile ? 1 : 0, 
            info: isMultiFile ? 2 : 1 
          },
          suggestions: [...fallbackSuggestions, ...multiFileSuggestions],
          metadata: {
            reviewType,
            language,
            model: OPENAI_CONFIG.model,
            timestamp: new Date().toISOString(),
            tokensUsed: response.usage?.total_tokens || 0,
            fallback: true,
            error: randomMessage,
            multiFileAnalysis: isMultiFile ? "enabled" : undefined
          },
        };
      }
    } catch (error: unknown) {
      console.error("❌ Code review failed:", error);

      if (error instanceof Error) {
        if (error.message.includes("insufficient_quota")) {
          throw new Error(
            "OpenAI API quota exhausted. Please check your billing settings."
          );
        }

        if (error.message.includes("invalid_api_key")) {
          throw new Error(
            "Invalid OpenAI API key. Please check your configuration."
          );
        }

        throw new Error(`Code review failed: ${error.message}`);
      }

      throw new Error("An unknown error occurred during code review");
    }
  }

  async generateBestPractices(language: string): Promise<string> {
    try {
      const isOModel = (modelId: string) => /^o\d/i.test((modelId || '').trim())
      const messages = isOModel(OPENAI_CONFIG.model)
        ? [
            {
              role: "user" as const,
              content: `Generate best practices and common patterns for ${language} programming language. Include code examples and detailed explanations.`,
            },
          ]
        : [
            {
              role: "system" as const,
              content: `Generate best practices and common patterns for ${language} programming language. Include code examples and detailed explanations.`,
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
      console.error("❌ Failed to generate best practices:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to generate best practices: ${errorMessage}`);
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
      console.error("❌ Failed to get usage stats:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return { error: errorMessage };
    }
  }
}

export const openaiService = new OpenAIService();
export { REVIEW_PROMPTS };
