import { openaiService } from "@/services";
import {
  HistoryItem,
  ReviewResult,
  ReviewType,
  SupportedLanguage,
  UploadedFile,
} from "@/types";
import {
  forwardRef,
  memo,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";

interface CodeReviewResultsProps {
  uploadedFiles: UploadedFile[];
  reviewType?: ReviewType;
  onAnalysisStateChange?: (isAnalyzing: boolean) => void;
  result?: ReviewResult | null;
  error?: string;
  isAnalyzing?: boolean;
  retryCount?: number;
  isRetrying?: boolean;
}

export interface CodeReviewResultsRef {
  startAnalysis: () => void;
}

const CodeReviewResultsComponent = forwardRef<
  CodeReviewResultsRef,
  CodeReviewResultsProps
>(
  (
    {
      uploadedFiles,
      reviewType = "sarcastic",
      onAnalysisStateChange,
      result,
      error: externalError,
      isAnalyzing: externalIsAnalyzing = false,
      retryCount = 0,
      isRetrying = false,
    },
    ref
  ) => {
    // Keep local state for backward compatibility, but prefer external state
    const [localIsAnalyzing, setLocalIsAnalyzing] = useState(false);
    const [localReviewResults, setLocalReviewResults] =
      useState<ReviewResult | null>(null);
    const [localError, setLocalError] = useState<string>("");

    // Use external state when available, fallback to local state
    const isAnalyzing = externalIsAnalyzing || localIsAnalyzing;
    const reviewResults = result || localReviewResults;
    const error = externalError || localError;

    // Function to save review results to history
    const saveToHistory = (result: ReviewResult, files: UploadedFile[]) => {
      try {
        const existingHistory = localStorage.getItem("codeRoaster_history");
        const historyItems: HistoryItem[] = existingHistory
          ? JSON.parse(existingHistory)
          : [];

        // Function to map file extension to supported language
        const mapExtensionToLanguage = (
          extension: string
        ): SupportedLanguage => {
          const ext = extension.replace(".", "").toLowerCase();
          const extensionMap: Record<string, SupportedLanguage> = {
            js: "javascript",
            jsx: "javascript",
            ts: "typescript",
            tsx: "typescript",
            py: "python",
            java: "java",
            cpp: "cpp",
            cc: "cpp",
            cxx: "cpp",
            c: "c",
            go: "go",
            rs: "rust",
            php: "php",
            rb: "ruby",
            swift: "swift",
            kt: "kotlin",
            scala: "scala",
            html: "html",
            css: "css",
            json: "json",
            yml: "yaml",
            yaml: "yaml",
            sql: "sql",
          };

          return extensionMap[ext] || "javascript";
        };

        // Create history items for each file
        files.forEach((file) => {
          const historyItem: HistoryItem = {
            id: `hist_${Date.now()}_${Math.random()
              .toString(36)
              .substring(2, 9)}`,
            filename: file.name,
            language: mapExtensionToLanguage(file.extension || ""),
            reviewResult: result,
            timestamp: new Date().toISOString(),
            fileSize: file.size,
            reviewType: reviewType,
          };

          historyItems.unshift(historyItem); // Add to beginning of array
        });

        // Keep only the last 100 items to prevent storage overflow
        const trimmedHistory = historyItems.slice(0, 100);
        localStorage.setItem(
          "codeRoaster_history",
          JSON.stringify(trimmedHistory)
        );

        console.log("✅ Review results saved to history");
      } catch (error) {
        console.error("❌ Failed to save to history:", error);
      }
    };

    const analyzeCode = async () => {
      // Only use local state management if external state is not provided
      if (!result && !externalError && !externalIsAnalyzing) {
        setLocalIsAnalyzing(true);
        setLocalError("");
        setLocalReviewResults(null);
        onAnalysisStateChange?.(true);

        try {
          // Read all file contents
          const fileContents = await Promise.all(
            uploadedFiles.map(async (uploadedFile) => {
              const content = await uploadedFile.file.text();
              return `// File: ${uploadedFile.name}\n${content}`;
            })
          );

          const codeToAnalyze = fileContents.join("\n\n");

          // Detect language from first file extension
          const language =
            uploadedFiles[0]?.extension?.replace(".", "") || "javascript";

          const result = await openaiService.reviewCode(
            codeToAnalyze,
            language,
            reviewType
          );
          setLocalReviewResults(result);

          // Save successful results to history
          saveToHistory(result, uploadedFiles);
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Unknown error occurred";
          const sarcasticErrors = [
            `Well, this is awkward... ${errorMessage} 🤷‍♂️`,
            `Houston, we have a problem: ${errorMessage} 🚀`,
            `Oops! Something went wrong: ${errorMessage} 😅`,
            `The AI got confused: ${errorMessage} 🤖`,
            `Plot twist: ${errorMessage} 🎭`,
          ];
          setLocalError(
            reviewType === "sarcastic"
              ? sarcasticErrors[
                  Math.floor(Math.random() * sarcasticErrors.length)
                ]
              : `Error: ${errorMessage}`
          );
        } finally {
          setLocalIsAnalyzing(false);
          onAnalysisStateChange?.(false);
        }
      }
    };

    useImperativeHandle(ref, () => ({
      startAnalysis: analyzeCode,
    }));

    // Remove automatic analysis on file upload
    useEffect(() => {
      // Only clear local results when review type changes, don't auto-analyze
      if (!result && !externalError) {
        setLocalReviewResults(null);
        setLocalError("");
      }
    }, [reviewType, result, externalError]);

    // Helper functions for different review type messages
    const getAnalyzingMessage = (type: ReviewType) => {
      const baseMessages = {
        sarcastic: "Lagi nganalisis karya agung lu... Siap-siap aja ya 🙄",
        brutal: "Nyiapin buat ngehancurin kode lu... Bersiap kena dampak! 💥",
        encouraging:
          "Lagi review kode keren lu dengan teliti... Hampir selesai! 🌟",
        codeQuality:
          "Lagi analisis code quality secara comprehensive... Tunggu ya ⚙️",
        security: "Lagi scan vulnerability keamanan... 🔍",
        bestPractices: "Lagi cek best practices industry... 📚",
      };

      const baseMessage = baseMessages[type] || baseMessages.sarcastic;

      // Add retry information if available
      if (isRetrying && retryCount > 0) {
        const retryMessages: Record<ReviewType, string> = {
          sarcastic: `${baseMessage} (Percobaan ${
            retryCount + 1
          } - Pantang menyerah! 😤)`,
          brutal: `${baseMessage} (RETRY ${
            retryCount + 1
          } - JANGAN PERNAH NYERAH! 💪)`,
          encouraging: `${baseMessage} (Coba ${
            retryCount + 1
          } - Pasti bisa! 🌈)`,
          codeQuality: `${baseMessage} (Percobaan ${retryCount + 1})`,
          security: `${baseMessage} (Retry ${
            retryCount + 1
          } - Keamanan penting! 🛡️)`,
          bestPractices: `${baseMessage} (Percobaan ${
            retryCount + 1
          } - Excellence butuh kesabaran! ⭐)`,
        };
        return retryMessages[type];
      }

      return baseMessage;
    };

    const getErrorMessage = (type: ReviewType) => {
      const messages = {
        sarcastic: "Waduh, ada masalah nih bro 🚀",
        brutal: "GAGAL TOTAL! Sistemnya ga kuat sama kebrutalan ini 💀",
        encouraging: "Ups! Tenang aja, kita selesaiin bareng-bareng 🤗",
        codeQuality: "Analisis gagal. Coba lagi ya.",
        security: "Scan keamanan terganggu ⚠️",
        bestPractices: "Pengecekan best practices gagal 📋",
      };
      return messages[type] || messages.sarcastic;
    };

    const getUploadedMessage = (type: ReviewType) => {
      const messages = {
        sarcastic:
          "File udah keupload. Mari kita liat apa yang mau dianalisis... 🧐",
        brutal: "File udah dimuat. Siap-siap penghancuran total... 💀",
        encouraging: "File udah keupload! Siap bantu lo jadi lebih kece! ✨",
        codeQuality: "File siap untuk analisis profesional 📊",
        security: "File udah dimuat. Mulai scan keamanan... 🔒",
        bestPractices:
          "File udah keupload. Review best practices dimulai... 📖",
      };
      return messages[type] || messages.sarcastic;
    };

    const getWelcomeMessage = (type: ReviewType) => {
      const messages = {
        sarcastic: `// Upload kode lu buat ngeliat roasting! 🔥
// Format yang didukung: JavaScript, TypeScript, Python, Java, C++, Go, Rust, PHP...

function selamatDatangDiRoasting() {
  console.log("Halo, jiwa pemberani! ☕");
  console.log("Siap kode lu di-judge?");
  console.log("Tenang aja, gue bakal... gentle kok 😈");
}`,
        brutal: `// SIAP-SIAP DIHANCURIN! 💀
// KODE LU BAKAL DIOBRAK-ABRIK SAMA FAKTA DAN LOGIKA!

function persiapanKebrutalan() {
  console.error("PERINGATAN: Ga bakal ada ampun!");
  console.error("Kode jelek bakal DIMUSNAHKAN!");
  console.error("Lu udah diperingatkan! 💥");
}`,
        encouraging: `// Selamat datang di mentor coding pribadi lu! 🌟
// Setiap perjalanan dimulai dengan satu langkah!

function selamatDatangDiPertumbuhan() {
  console.log("Lu pasti bisa! 💪");
  console.log("Setiap expert dulu juga pemula! ✨");
  console.log("Ayo bikin kode lu makin kece! 🌈");
}`,
        codeQuality: `// Professional Code Review Service
// Comprehensive analysis of code quality, performance, and maintainability

function initiateAnalysis() {
  console.log("Initializing professional review...");
  console.log("Analyzing: structure, patterns, efficiency");
  console.log("Generating detailed report...");
}`,
        security: `// Security Vulnerability Assessment
// Scanning for potential security risks and exploits

function securityScan() {
  console.log("🛡️ Initializing security scan...");
  console.log("Checking: input validation, authentication, encryption");
  console.log("Generating security report...");
}`,
        bestPractices: `// Best Practices Compliance Check
// Evaluating code against industry standards and conventions

function checkBestPractices() {
  console.log("📚 Analyzing best practices...");
  console.log("Checking: patterns, naming, structure");
  console.log("Generating recommendations...");
}`,
      };
      return messages[type] || messages.sarcastic;
    };

    const getTipMessage = (type: ReviewType) => {
      const tips = {
        sarcastic:
          "💡 Pro tip: Makin questionable kode lu, makin seru review-nya! Sekarang dengan roasting yang lebih PANJANG dan DETAIL! Upload apa aja - gue ga judge kok... banyak 🤭",
        brutal:
          "⚠️ Peringatan: Reviewer ini GA ADA AMPUN dengan analisis yang COMPREHENSIVE dan BRUTAL! Upload kode cuma kalo lu sanggup nerima KEBENARAN DETAIL yang panjang lebar! 💀",
        encouraging:
          "✨ Inget: Setiap kesalahan adalah kesempatan belajar! Sekarang dengan feedback yang lebih MENDALAM dan SUPPORTIVE! Upload kode lu dan mari berkembang bareng! 🌱",
        codeQuality:
          "📊 Enhanced: Sekarang dengan analisis yang lebih komprehensif, detailed metrics, dan rekomendasi yang lebih mendalam untuk hasil review yang maksimal.",
        security:
          "🔒 Advanced Security: Scanning yang lebih detail dengan risk assessment, attack vectors, dan mitigation strategies yang comprehensive untuk keamanan maksimal.",
        bestPractices:
          "📚 Comprehensive: Evaluasi mendalam terhadap design patterns, quality metrics, dan industry standards dengan rekomendasi yang lebih actionable.",
      };
      return tips[type] || tips.sarcastic;
    };

    return (
      <div className="bg-sky dark:bg-coal-400 border-4 border-charcoal dark:border-cream rounded-lg shadow-[0px_4px_0px_0px_#27292b]">
        <div className="bg-charcoal dark:bg-cream p-4 border-b-4 border-charcoal dark:border-cream rounded-t-sm">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-sky dark:text-charcoal flex items-center gap-2">
              <span>🔍</span>
              Code Review Results
            </h2>
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-coral"></div>
              <div className="w-3 h-3 rounded-full bg-amber"></div>
              <div className="w-3 h-3 rounded-full bg-sky"></div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-sky/80 dark:bg-coal-400/80 min-h-[300px] rounded-b-sm">
          {/* Status indicator */}
          <div className="bg-charcoal dark:bg-cream rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  isAnalyzing
                    ? "bg-amber animate-pulse"
                    : error
                    ? "bg-coral"
                    : reviewResults
                    ? "bg-green-400"
                    : "bg-sky"
                }`}
              ></div>
              <span className="text-sky dark:text-charcoal font-bold text-sm">
                {isAnalyzing
                  ? getAnalyzingMessage(reviewType)
                  : error
                  ? getErrorMessage(reviewType)
                  : reviewResults
                  ? "Review complete"
                  : uploadedFiles.length > 0
                  ? getUploadedMessage(reviewType)
                  : "Ready for code review"}
              </span>
            </div>
          </div>

          {/* Main content area */}
          <div className="bg-cream border-3 border-charcoal rounded-lg p-4">
            {error ? (
              <div className="text-coral font-medium">{error}</div>
            ) : reviewResults ? (
              <div className="space-y-4">
                {/* Review Score */}
                <div className="bg-charcoal p-3 rounded-lg">
                  <div className="flex items-center justify-between text-sky">
                    <span className="font-bold">Code Quality Score</span>
                    <span className="text-2xl font-bold">
                      {Math.round((reviewResults.score / 100) * 10)}/10
                    </span>
                  </div>
                  <div className="text-xs text-sky/70 mt-1">
                    {reviewResults.summary.totalIssues} issues found (
                    {reviewResults.summary.critical} critical)
                  </div>
                </div>

                {/* Overall Assessment - Dynamic based on review type */}
                {reviewResults.metadata && (
                  <>
                    {reviewResults.metadata.overallAssessment && (
                      <div className="bg-sky/20 border-2 border-charcoal rounded-lg p-3">
                        <h3 className="font-bold text-charcoal text-sm mb-2">
                          📊 Overall Assessment
                        </h3>
                        <p className="text-charcoal text-sm">
                          {reviewResults.metadata.overallAssessment}
                        </p>
                      </div>
                    )}

                    {reviewResults.metadata.overallSecurityAssessment && (
                      <div className="bg-coral/20 border-2 border-charcoal rounded-lg p-3">
                        <h3 className="font-bold text-charcoal text-sm mb-2">
                          🛡️ Security Assessment
                        </h3>
                        <p className="text-charcoal text-sm">
                          {reviewResults.metadata.overallSecurityAssessment}
                        </p>
                      </div>
                    )}

                    {reviewResults.metadata.overallRoast && (
                      <div className="bg-coral/30 border-2 border-charcoal rounded-lg p-3">
                        <h3 className="font-bold text-charcoal text-sm mb-2">
                          🔥 Overall Roast
                        </h3>
                        <p className="text-charcoal text-sm">
                          {reviewResults.metadata.overallRoast}
                        </p>
                      </div>
                    )}

                    {reviewResults.metadata.brutalAssessment && (
                      <div className="bg-red-100 border-2 border-charcoal rounded-lg p-3">
                        <h3 className="font-bold text-charcoal text-sm mb-2">
                          💀 Brutal Truth
                        </h3>
                        <p className="text-charcoal text-sm">
                          {reviewResults.metadata.brutalAssessment}
                        </p>
                      </div>
                    )}

                    {reviewResults.metadata.positiveAssessment && (
                      <div className="bg-green-100 border-2 border-charcoal rounded-lg p-3">
                        <h3 className="font-bold text-charcoal text-sm mb-2">
                          🌟 Positive Assessment
                        </h3>
                        <p className="text-charcoal text-sm">
                          {reviewResults.metadata.positiveAssessment}
                        </p>
                      </div>
                    )}
                  </>
                )}

                {/* Suggestions */}
                <div className="space-y-3">
                  {reviewResults.suggestions.map((suggestion) => (
                    <div
                      key={suggestion.id}
                      className="bg-cream/50 border-2 border-charcoal rounded-lg p-3"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-bold text-charcoal text-sm">
                          {suggestion.title}
                        </h4>
                        <span
                          className={`px-2 py-1 rounded text-xs font-bold ${
                            suggestion.severity === "critical"
                              ? "bg-red-600 text-white"
                              : suggestion.severity === "high"
                              ? "bg-coral text-white"
                              : suggestion.severity === "medium"
                              ? "bg-amber text-charcoal"
                              : suggestion.severity === "opportunity"
                              ? "bg-green-400 text-white"
                              : suggestion.severity === "enhancement"
                              ? "bg-purple-400 text-white"
                              : "bg-sky text-white"
                          }`}
                        >
                          {suggestion.severity}
                        </span>
                      </div>

                      <p className="text-charcoal text-sm mb-2">
                        {suggestion.description}
                      </p>
                      <p className="text-charcoal text-sm font-medium mb-2">
                        💡 {suggestion.suggestion}
                      </p>

                      {/* Dynamic fields display */}
                      <div className="space-y-1 text-xs">
                        {suggestion.impact && (
                          <p className="text-charcoal">
                            <strong>Impact:</strong> {suggestion.impact}
                          </p>
                        )}
                        {suggestion.riskLevel && (
                          <p className="text-charcoal">
                            <strong>Risk Level:</strong> {suggestion.riskLevel}
                          </p>
                        )}
                        {suggestion.attackVector && (
                          <p className="text-charcoal">
                            <strong>Attack Vector:</strong>{" "}
                            {suggestion.attackVector}
                          </p>
                        )}
                        {suggestion.benefits && (
                          <p className="text-charcoal">
                            <strong>Benefits:</strong> {suggestion.benefits}
                          </p>
                        )}
                        {suggestion.roastLevel && (
                          <p className="text-charcoal">
                            <strong>🔥 Roast Level:</strong>{" "}
                            {suggestion.roastLevel}
                          </p>
                        )}
                        {suggestion.analogiKocak && (
                          <p className="text-charcoal">
                            <strong>😂 Analogi:</strong>{" "}
                            {suggestion.analogiKocak}
                          </p>
                        )}
                        {suggestion.consequencesIfIgnored && (
                          <p className="text-charcoal">
                            <strong>⚠️ Consequences:</strong>{" "}
                            {suggestion.consequencesIfIgnored}
                          </p>
                        )}
                        {suggestion.learningOpportunity && (
                          <p className="text-charcoal">
                            <strong>📚 Learning:</strong>{" "}
                            {suggestion.learningOpportunity}
                          </p>
                        )}
                        {suggestion.confidenceBooster && (
                          <p className="text-charcoal">
                            <strong>✨ You Got This:</strong>{" "}
                            {suggestion.confidenceBooster}
                          </p>
                        )}
                      </div>

                      {suggestion.codeSnippet.original && (
                        <div className="bg-charcoal rounded p-2 text-xs mt-2">
                          <div className="text-coral mb-1">❌ Before:</div>
                          <pre className="text-sky overflow-x-auto">
                            {suggestion.codeSnippet.original}
                          </pre>
                          {suggestion.codeSnippet.improved && (
                            <>
                              <div className="text-green-400 mt-2 mb-1">
                                ✅ After:
                              </div>
                              <pre className="text-sky overflow-x-auto">
                                {suggestion.codeSnippet.improved}
                              </pre>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Additional Dynamic Content */}
                {reviewResults.metadata && (
                  <div className="space-y-3">
                    {reviewResults.metadata.recommendations &&
                      reviewResults.metadata.recommendations.length > 0 && (
                        <div className="bg-sky/20 border-2 border-charcoal rounded-lg p-3">
                          <h3 className="font-bold text-charcoal text-sm mb-2">
                            📋 Recommendations
                          </h3>
                          <ul className="list-disc list-inside space-y-1">
                            {reviewResults.metadata.recommendations.map(
                              (rec, index) => (
                                <li
                                  key={index}
                                  className="text-charcoal text-xs"
                                >
                                  {rec}
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}

                    {reviewResults.metadata.comedyGold &&
                      reviewResults.metadata.comedyGold.length > 0 && (
                        <div className="bg-amber/20 border-2 border-charcoal rounded-lg p-3">
                          <h3 className="font-bold text-charcoal text-sm mb-2">
                            🎭 Comedy Gold
                          </h3>
                          <ul className="list-disc list-inside space-y-1">
                            {reviewResults.metadata.comedyGold.map(
                              (quote, index) => (
                                <li
                                  key={index}
                                  className="text-charcoal text-xs italic"
                                >
                                  "{quote}"
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}

                    {reviewResults.metadata.encouragements &&
                      reviewResults.metadata.encouragements.length > 0 && (
                        <div className="bg-green-100 border-2 border-charcoal rounded-lg p-3">
                          <h3 className="font-bold text-charcoal text-sm mb-2">
                            🌟 Encouragements
                          </h3>
                          <ul className="list-disc list-inside space-y-1">
                            {reviewResults.metadata.encouragements.map(
                              (enc, index) => (
                                <li
                                  key={index}
                                  className="text-charcoal text-xs"
                                >
                                  {enc}
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}

                    {reviewResults.metadata.motivasiSarkastik && (
                      <div className="bg-orange-100 border-2 border-charcoal rounded-lg p-3">
                        <h3 className="font-bold text-charcoal text-sm mb-2">
                          🔥 Motivasi Sarkastik
                        </h3>
                        <p className="text-charcoal text-sm italic">
                          "{reviewResults.metadata.motivasiSarkastik}"
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : uploadedFiles.length > 0 && isAnalyzing ? (
              <div className="text-charcoal text-sm text-center py-8">
                <div className="animate-spin text-2xl mb-4">⚡</div>
                <p>The AI is putting on its reading glasses...</p>
                <p className="text-xs mt-2 opacity-70">
                  This could take 10-30 seconds (yes, really)
                </p>
              </div>
            ) : (
              <pre className="text-charcoal text-sm overflow-x-auto font-mono leading-relaxed">
                {getWelcomeMessage(reviewType)}
              </pre>
            )}
          </div>

          {/* Tip section */}
          <div className="mt-4 p-3 bg-amber/20 border-2 dark:bg-cream border-charcoal rounded-lg">
            <p className="text-charcoal text-sm font-medium">
              {getTipMessage(reviewType)}
            </p>
          </div>
        </div>
      </div>
    );
  }
);

// Memoized export for performance optimization
export const CodeReviewResults = memo(CodeReviewResultsComponent);
