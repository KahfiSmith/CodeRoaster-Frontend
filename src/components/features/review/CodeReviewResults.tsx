import { openaiService } from "@/services";
import {
  HistoryItem,
  ReviewResult,
  ReviewType,
  SupportedLanguage,
  UploadedFile,
  ReviewSuggestion,
} from "@/types";
import {
  forwardRef,
  memo,
  useEffect,
  useImperativeHandle,
  useState,
  useRef,
} from "react";

// File size constants
const FILE_SIZE_LIMIT = 50 * 1024; // 50KB per file limit
const COMPRESSION_THRESHOLD = 30 * 1024; // 30KB threshold for compression

// Cache configuration
const REVIEW_CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const MAX_CACHE_ENTRIES = 50; // Limit cache size to prevent localStorage bloat
const REVIEW_CACHE_STORAGE_KEY = "codeRoaster_review_cache";

// Compute SHA-256 hash for caching
const computeSHA256 = async (input: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};

// LocalStorage-backed cache helpers
const getCachedReview = (key: string): ReviewResult | null => {
  try {
    const raw = localStorage.getItem(REVIEW_CACHE_STORAGE_KEY);
    if (!raw) return null;
    const store = JSON.parse(raw) as Record<
      string,
      { result: ReviewResult; timestamp: number }
    >;
    const entry = store[key];
    if (!entry) return null;
    if (Date.now() - entry.timestamp > REVIEW_CACHE_TTL) return null;
    return entry.result;
  } catch {
    return null;
  }
};

const setCachedReview = (key: string, result: ReviewResult): void => {
  try {
    const raw = localStorage.getItem(REVIEW_CACHE_STORAGE_KEY);
    const store: Record<string, { result: ReviewResult; timestamp: number }> =
      raw ? JSON.parse(raw) : {};

    // Add new entry
    store[key] = { result, timestamp: Date.now() };

    // Prune cache if too many entries
    const entries = Object.entries(store);
    if (entries.length > MAX_CACHE_ENTRIES) {
      // Sort by timestamp (oldest first) and remove excess entries
      const sortedEntries = entries.sort(
        (a, b) => a[1].timestamp - b[1].timestamp
      );
      const entriesToKeep = sortedEntries.slice(-MAX_CACHE_ENTRIES);
      const newStore: Record<
        string,
        { result: ReviewResult; timestamp: number }
      > = {};
      entriesToKeep.forEach(([k, v]) => {
        newStore[k] = v;
      });
      localStorage.setItem(REVIEW_CACHE_STORAGE_KEY, JSON.stringify(newStore));
    } else {
      localStorage.setItem(REVIEW_CACHE_STORAGE_KEY, JSON.stringify(store));
    }
  } catch {
    // ignore storage errors
  }
};

/**
 * Simple text compression for code files
 * This function removes excessive whitespace and comments while preserving code structure
 *
 * @param content The file content to compress
 * @param fileExtension The file extension to determine language-specific rules
 * @returns Compressed content
 */
const compressCodeContent = (
  content: string,
  fileExtension: string
): string => {
  // Skip compression for binary or non-text files
  const nonCompressibleExtensions = [
    ".pdf",
    ".jpg",
    ".png",
    ".gif",
    ".zip",
    ".exe",
  ];
  if (
    nonCompressibleExtensions.some((ext) =>
      fileExtension.toLowerCase().endsWith(ext)
    )
  ) {
    return content;
  }

  let compressed = content;

  // Remove multiple empty lines (replace 3+ newlines with 2)
  compressed = compressed.replace(/\n{3,}/g, "\n\n");

  // Remove trailing whitespace on each line
  compressed = compressed.replace(/[ \t]+$/gm, "");

  // Language specific optimizations
  if (fileExtension.match(/\.(js|ts|jsx|tsx)$/i)) {
    // For JavaScript/TypeScript files

    // Remove single-line comments that are on their own line (not code with trailing comments)
    compressed = compressed.replace(/^\s*\/\/.*$/gm, "");

    // Preserve important comments (containing TODO, FIXME, NOTE, etc.)
    compressed = compressed.replace(
      /^\s*\/\/\s*(TODO|FIXME|HACK|NOTE|IMPORTANT|BUG).*$/gim,
      (match) => match
    );
  } else if (fileExtension.match(/\.(py)$/i)) {
    // For Python files

    // Remove single-line comments that are on their own line
    compressed = compressed.replace(/^\s*#.*$/gm, "");

    // Preserve important comments
    compressed = compressed.replace(
      /^\s*#\s*(TODO|FIXME|HACK|NOTE|IMPORTANT|BUG).*$/gim,
      (match) => match
    );
  }

  // Remove excessive indentation (keep structure but limit to max 40 spaces)
  compressed = compressed.replace(/^([ \t]{40,})/gm, (match) =>
    match.substring(0, 40)
  );

  return compressed;
};

/**
 * Enhanced streaming file reader for large files
 * This implementation uses a more efficient streaming approach with adaptive chunk sizes
 * and optimized memory management
 *
 * @param file The file to read
 * @param initialChunkSize Initial size of each chunk in bytes
 * @param onProgress Optional callback to report reading progress (0-100)
 * @returns Promise that resolves with the file content
 */
const readFileInChunks = async (
  file: File,
  initialChunkSize: number,
  onProgress?: (progress: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    let offset = 0;
    let result = "";
    const totalSize = file.size;

    // Adaptive chunk sizing - start with initial size and adjust based on file characteristics
    let chunkSize = initialChunkSize;
    let lastReadTime = 0;

    // Function to read the next chunk with adaptive sizing
    const readNextChunk = () => {
      // Calculate the end position for this chunk
      const end = Math.min(offset + chunkSize, totalSize);

      // Create a slice of the file
      const blob = file.slice(offset, end);

      // Track read performance
      lastReadTime = performance.now();

      // Read as text
      fileReader.readAsText(blob);
    };

    // Handle chunk load
    fileReader.onload = (event) => {
      if (event.target?.result) {
        // Calculate read performance
        const readDuration = performance.now() - lastReadTime;

        // Adapt chunk size based on performance
        // If reading is fast, increase chunk size for efficiency
        // If reading is slow, decrease chunk size to avoid UI freezing
        if (readDuration < 50 && chunkSize < 1024 * 1024) {
          // Reading is fast, increase chunk size up to 1MB max
          chunkSize = Math.min(chunkSize * 1.5, 1024 * 1024);
        } else if (readDuration > 300 && chunkSize > 16 * 1024) {
          // Reading is slow, decrease chunk size but not below 16KB
          chunkSize = Math.max(chunkSize * 0.7, 16 * 1024);
        }

        // Append chunk to result string instead of storing in array
        // This avoids keeping multiple copies of the content in memory
        result += event.target.result as string;

        // Update offset
        offset = Math.min(offset + chunkSize, totalSize);

        // Report progress if callback provided
        if (onProgress) {
          const progressPercent = Math.min(
            100,
            Math.round((offset / totalSize) * 100)
          );
          onProgress(progressPercent);
        }

        // Check if we've read the entire file
        if (offset < totalSize) {
          // Use setTimeout to avoid deep recursion and allow UI updates
          // Adjust timeout based on file size - larger files need more UI breathing room
          const timeoutDelay = totalSize > 5 * 1024 * 1024 ? 10 : 0;
          setTimeout(readNextChunk, timeoutDelay);
        } else {
          // We've read the entire file, resolve with the result
          resolve(result);

          // Clean up to help garbage collection
          result = "";
        }
      }
    };

    // Handle errors
    fileReader.onerror = (error) => {
      reject(error);

      // Clean up
      result = "";
    };

    // Start reading the first chunk
    readNextChunk();
  });
};

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
    const [processingProgress, setProcessingProgress] = useState<{
      current: number;
      total: number;
      fileName: string;
    }>({ current: 0, total: 0, fileName: "" });
    const [cacheUsed, setCacheUsed] = useState<boolean>(false);
    const debounceTimerRef = useRef<number | null>(null);

    // State for tracking file size warnings and compression
    const [fileProcessingInfo, setFileProcessingInfo] = useState<{
      oversizedFiles: string[];
      compressedFiles: string[];
      totalSizeBefore: number;
      totalSizeAfter: number;
      hasWarnings: boolean;
    }>({
      oversizedFiles: [],
      compressedFiles: [],
      totalSizeBefore: 0,
      totalSizeAfter: 0,
      hasWarnings: false,
    });

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
            dart: "dart",
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
          // Process files sequentially to avoid memory issues
          let codeToAnalyze = "";

          // Reset file processing info
          setFileProcessingInfo({
            oversizedFiles: [],
            compressedFiles: [],
            totalSizeBefore: 0,
            totalSizeAfter: 0,
            hasWarnings: false,
          });

          // Set initial progress
          setProcessingProgress({
            current: 0,
            total: uploadedFiles.length,
            fileName: "",
          });

          // Calculate optimal chunk size based on file sizes
          const calculateOptimalChunkSize = (fileSize: number): number => {
            // For very large files, use smaller chunks
            if (fileSize > 10 * 1024 * 1024) return 256 * 1024; // 256KB for >10MB
            if (fileSize > 5 * 1024 * 1024) return 384 * 1024; // 384KB for >5MB
            return 512 * 1024; // 512KB default
          };

          // Track file processing stats
          const oversizedFiles: string[] = [];
          const compressedFiles: string[] = [];
          let totalSizeBefore = 0;
          let totalSizeAfter = 0;

          // Process files one by one instead of all at once
          for (let i = 0; i < uploadedFiles.length; i++) {
            const uploadedFile = uploadedFiles[i];
            totalSizeBefore += uploadedFile.size;

            // Update progress
            setProcessingProgress({
              current: i + 1,
              total: uploadedFiles.length,
              fileName: uploadedFile.name,
            });

            // Process file content
            let fileContent = "";

            // Skip processing if the file was already preprocessed by FileUploader
            const skipProcessing = uploadedFile.preprocessed === true;

            // Read file in chunks if it's large (over 1MB) and not already preprocessed
            if (uploadedFile.size > 1024 * 1024 && !skipProcessing) {
              const file = uploadedFile.file;
              const chunkSize = calculateOptimalChunkSize(uploadedFile.size);

              // Track chunk reading progress for large files - throttle updates to reduce renders
              let lastProgressUpdate = 0;
              fileContent = await readFileInChunks(
                file,
                chunkSize,
                (chunkProgress) => {
                  // Throttle progress updates to max once per 250ms
                  const now = Date.now();
                  if (now - lastProgressUpdate > 250 || chunkProgress >= 100) {
                    lastProgressUpdate = now;
                    setProcessingProgress((prev) => ({
                      ...prev,
                      fileName: `${uploadedFile.name} (${chunkProgress}%)`,
                    }));
                  }
                }
              );
            } else {
              // For smaller files, read normally
              fileContent = await uploadedFile.file.text();
            }

            // Check if file exceeds size limit
            const contentSize = new Blob([fileContent]).size;

            // Apply compression if needed
            let processedContent = fileContent;
            let wasCompressed = false;

            // Apply compression for files over the threshold, but skip if already preprocessed
            if (contentSize > COMPRESSION_THRESHOLD && !skipProcessing) {
              // Update progress to show compression is happening
              setProcessingProgress((prev) => ({
                ...prev,
                fileName: `${uploadedFile.name} (compressing...)`,
              }));

              // Compress the content
              processedContent = compressCodeContent(
                fileContent,
                uploadedFile.extension || ""
              );

              // Check if compression was effective
              const compressedSize = new Blob([processedContent]).size;
              wasCompressed = compressedSize < contentSize;

              if (wasCompressed) {
                compressedFiles.push(uploadedFile.name);
                totalSizeAfter += compressedSize;
              } else {
                // If compression didn't help, use original
                processedContent = fileContent;
                totalSizeAfter += contentSize;
              }
            } else {
              totalSizeAfter += contentSize;
            }

            // Check if file still exceeds limit after compression
            if (new Blob([processedContent]).size > FILE_SIZE_LIMIT) {
              oversizedFiles.push(uploadedFile.name);

              // Truncate oversized files to the limit
              if (processedContent.length > FILE_SIZE_LIMIT) {
                const truncatedLength = Math.floor(FILE_SIZE_LIMIT * 0.9); // 90% of limit to account for encoding differences
                processedContent =
                  processedContent.substring(0, truncatedLength) +
                  `\n\n// ... File truncated due to size limit (${Math.round(
                    contentSize / 1024
                  )}KB > ${Math.round(FILE_SIZE_LIMIT / 1024)}KB) ...\n`;
              }
            }

            // Append to codeToAnalyze directly with clear file markers for AI to use
            const fileMarker = `FILE_MARKER: ${uploadedFile.name}`;
            codeToAnalyze += `// ============= ${fileMarker} ${
              wasCompressed ? " (compressed)" : ""
            } =============\n${processedContent}\n\n// ============= END_FILE_MARKER: ${uploadedFile.name} =============\n\n`;

            // Help garbage collection by clearing variables
            fileContent = "";
            processedContent = "";
          }

          // Update file processing info
          setFileProcessingInfo({
            oversizedFiles,
            compressedFiles,
            totalSizeBefore,
            totalSizeAfter,
            hasWarnings: oversizedFiles.length > 0,
          });

          // codeToAnalyze is already built during the loop

          // Detect language from file extensions - use most common or first file extension
          const languageMap: Record<string, number> = {};
          uploadedFiles.forEach(file => {
            const ext = file.extension?.replace(".", "") || "javascript";
            languageMap[ext] = (languageMap[ext] || 0) + 1;
          });
          
          // Find the most common language or use the first file's language
          const language = Object.entries(languageMap).sort((a, b) => b[1] - a[1])[0]?.[0] || 
            uploadedFiles[0]?.extension?.replace(".", "") || "javascript";

          // Build cache key from shorter hash input to improve performance
          // Include file count, sizes, and names for uniqueness without full content
          const fileSignature = uploadedFiles
            .map((f) => `${f.name}:${f.size}`)
            .join("|");
          const cacheKey = await computeSHA256(
            `${language}|${reviewType}|${fileSignature}|${uploadedFiles.length}`
          );

          // Short debounce before API call
          await new Promise((resolve) => setTimeout(resolve, 500));

          // Check cache first - this is fast
          console.time("cache-check");
          const cached = getCachedReview(cacheKey);
          console.timeEnd("cache-check");

          if (cached) {
            console.log("⚡ Cache hit! Skipping API call");
            setCacheUsed(true);
            setLocalReviewResults(cached);
            saveToHistory(cached, uploadedFiles);
            // finalize analyzing state since we early return
            setLocalIsAnalyzing(false);
            onAnalysisStateChange?.(false);
            return;
          }

          console.log("🔄 Cache miss, proceeding with API call");

          const result = await openaiService.reviewCode(
            codeToAnalyze,
            language,
            reviewType
          );
          setLocalReviewResults(result);

          // Save to cache
          setCachedReview(cacheKey, result);

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
      startAnalysis: () => {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        debounceTimerRef.current = window.setTimeout(() => {
          analyzeCode();
          debounceTimerRef.current = null;
        }, 500);
      },
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
      // Base tips
      const baseTips = {
        sarcastic:
          "💡 Pro tip: Makin questionable kode lu, makin seru review-nya! Sekarang dengan roasting yang lebih PANJANG dan DETAIL! Upload apa aja - gue ga judge kok 🤭",
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

      // Return the base tip without any additional file size info
      return baseTips[type] || baseTips.sarcastic;
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
                    <span className="font-bold">Skor Kualitas Kode</span>
                    <span className="text-2xl font-bold">
                      {Math.round((reviewResults.score / 100) * 10)}/10
                    </span>
                  </div>
                  <div className="text-xs text-sky/70 mt-1">
                    {reviewResults.summary.totalIssues} masalah ditemukan (
                    {reviewResults.summary.critical} kritis)
                  </div>
                  <div className="text-xs text-sky/70 mt-1">
                    {uploadedFiles.length > 1 ? 
                      `${uploadedFiles.length} file dianalisis - hasil dikelompokkan berdasarkan file` : 
                      "1 file dianalisis"}
                  </div>
                </div>

                {/* Overall Assessment - Dynamic based on review type */}
                {reviewResults.metadata && (
                  <>
                    {reviewResults.metadata.overallAssessment && (
                      <div className="bg-sky/20 border-2 border-charcoal rounded-lg p-3">
                        <h3 className="font-bold text-charcoal text-sm mb-2">
                          📊 Penilaian Keseluruhan
                        </h3>
                        <p className="text-charcoal text-sm">
                          {reviewResults.metadata.overallAssessment}
                        </p>
                      </div>
                    )}

                    {reviewResults.metadata.overallSecurityAssessment && (
                      <div className="bg-coral/20 border-2 border-charcoal rounded-lg p-3">
                        <h3 className="font-bold text-charcoal text-sm mb-2">
                          🛡️ Penilaian Keamanan
                        </h3>
                        <p className="text-charcoal text-sm">
                          {reviewResults.metadata.overallSecurityAssessment}
                        </p>
                      </div>
                    )}

                    {reviewResults.metadata.overallRoast && (
                      <div className="bg-coral/30 border-2 border-charcoal rounded-lg p-3">
                        <h3 className="font-bold text-charcoal text-sm mb-2">
                          🔥 Roasting Keseluruhan
                        </h3>
                        <p className="text-charcoal text-sm">
                          {reviewResults.metadata.overallRoast}
                        </p>
                      </div>
                    )}

                    {reviewResults.metadata.brutalAssessment && (
                      <div className="bg-red-100 border-2 border-charcoal rounded-lg p-3">
                        <h3 className="font-bold text-charcoal text-sm mb-2">
                          💀 Kebenaran Brutal
                        </h3>
                        <p className="text-charcoal text-sm">
                          {reviewResults.metadata.brutalAssessment}
                        </p>
                      </div>
                    )}

                    {reviewResults.metadata.positiveAssessment && (
                      <div className="bg-green-100 border-2 border-charcoal rounded-lg p-3">
                        <h3 className="font-bold text-charcoal text-sm mb-2">
                          🌟 Penilaian Positif
                        </h3>
                        <p className="text-charcoal text-sm">
                          {reviewResults.metadata.positiveAssessment}
                        </p>
                      </div>
                    )}
                  </>
                )}

                {/* File-grouped suggestions */}
                <div className="space-y-6">


                  {/* Group suggestions by file */}
                  {(() => {
                    // Check if suggestions exist and is an array
                    if (!reviewResults.suggestions || !Array.isArray(reviewResults.suggestions) || reviewResults.suggestions.length === 0) {
                      // Create default fallback content when no suggestions are available
                      return (
                        <div className="space-y-4">
                          <div className="bg-amber/20 p-4 rounded-lg">
                            <h3 className="font-bold mb-2">Tidak Ada Saran Detail Tersedia</h3>
                            <p>Review tidak mengembalikan saran spesifik, tapi berikut adalah penilaian umum:</p>
                            
                            <div className="mt-4 p-3 bg-cream/50 border-2 border-charcoal rounded-lg">
                              <h4 className="font-bold text-charcoal text-sm">Penilaian Kode Umum</h4>
                              <p className="mt-2 text-sm">
                                {reviewResults.metadata?.overallAssessment || 
                                 reviewResults.metadata?.positiveAssessment ||
                                 "Kode Anda tampaknya berfungsi dengan baik tanpa masalah besar yang terdeteksi."}
                              </p>
                              
                              <div className="mt-3 text-xs">
                                <p><strong>Rekomendasi:</strong></p>
                                <ul className="list-disc ml-5 mt-1 space-y-1">
                                  <li>Pertimbangkan untuk menambahkan dokumentasi yang lebih komprehensif</li>
                                  <li>Tinjau kode untuk optimasi performa potensial</li>
                                  <li>Pastikan gaya kode konsisten di seluruh proyek</li>
                                  {reviewResults.metadata?.recommendations && Array.isArray(reviewResults.metadata.recommendations) && 
                                    reviewResults.metadata.recommendations.map((rec, i) => (
                                      <li key={i}>{rec}</li>
                                    ))
                                  }
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    
                    // Group suggestions by fileName or create a default group
                    const fileGroups: Record<string, ReviewSuggestion[]> = {};
                    
                    // Add fileName property if missing and group by it
                    reviewResults.suggestions.forEach(suggestion => {
                      // Ensure fileName exists and is a string
                      if (!suggestion.fileName || typeof suggestion.fileName !== 'string') {
                        // Try to extract fileName from title if it contains brackets like [filename.js]
                        const fileNameMatch = suggestion.title?.match(/\[(.*?)\]/);
                        if (fileNameMatch && fileNameMatch[1]) {
                          suggestion.fileName = fileNameMatch[1];
                        } else {
                          // Default to General if no fileName can be extracted
                          suggestion.fileName = "General";
                        }
                      }
                      
                      // Create group if it doesn't exist
                      if (!fileGroups[suggestion.fileName]) {
                        fileGroups[suggestion.fileName] = [];
                      }
                      
                      // Add to group
                      fileGroups[suggestion.fileName].push(suggestion);
                    });
                    
                    // If no groups were created, create a default group
                    if (Object.keys(fileGroups).length === 0) {
                      fileGroups["General"] = reviewResults.suggestions;
                    }
                    
                    // Convert groups to JSX
                    return Object.entries(fileGroups).map(([fileName, fileSuggestions]) => (
                      <div key={fileName} className="border-2 border-charcoal/30 rounded-lg p-3 bg-cream/30">
                        {/* File header */}
                        <div className="bg-charcoal text-amber dark:text-cream px-3 py-2 rounded-t-md mb-3 flex justify-between items-center">
                          <h3 className="font-bold text-sm flex items-center gap-2">
                            <span className="text-xs bg-amber/80 text-charcoal px-1.5 py-0.5 rounded">
                              {fileName.endsWith('.js') ? 'JS' : 
                               fileName.endsWith('.jsx') ? 'JSX' :
                               fileName.endsWith('.ts') ? 'TS' :
                               fileName.endsWith('.tsx') ? 'TSX' :
                               fileName.endsWith('.py') ? 'PY' :
                               fileName.endsWith('.java') ? 'JAVA' :
                               fileName.endsWith('.dart') ? 'DART' : 'CODE'}
                            </span>
                            <span className="font-bold text-amber dark:text-cream underline">{fileName}</span>
                          </h3>
                          <span className="text-xs bg-amber/80 text-charcoal px-1.5 py-0.5 rounded">
                            {fileSuggestions.length} {fileSuggestions.length === 1 ? 'masalah' : 'masalah'}
                          </span>
                        </div>
                        
                        {/* File suggestions */}
                        <div className="space-y-3">
                          {fileSuggestions.map((suggestion) => (
                            <div
                              key={suggestion.id}
                              className="bg-cream/50 border-2 border-charcoal rounded-lg p-3"
                            >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-bold text-charcoal text-sm">
                          {suggestion.fileName && !suggestion.title.includes(suggestion.fileName) ? 
                            `[${suggestion.fileName}] ${suggestion.title}` : 
                            suggestion.title}
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
                            <strong>Dampak:</strong> {suggestion.impact}
                          </p>
                        )}
                        {suggestion.riskLevel && (
                          <p className="text-charcoal">
                            <strong>Tingkat Risiko:</strong> {suggestion.riskLevel}
                          </p>
                        )}
                        {suggestion.attackVector && (
                          <p className="text-charcoal">
                            <strong>Vektor Serangan:</strong>{" "}
                            {suggestion.attackVector}
                          </p>
                        )}
                        {suggestion.benefits && (
                          <p className="text-charcoal">
                            <strong>Manfaat:</strong> {suggestion.benefits}
                          </p>
                        )}
                        {suggestion.roastLevel && (
                          <p className="text-charcoal">
                            <strong>🔥 Tingkat Roasting:</strong>{" "}
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
                            <strong>⚠️ Konsekuensi:</strong>{" "}
                            {suggestion.consequencesIfIgnored}
                          </p>
                        )}
                        {suggestion.learningOpportunity && (
                          <p className="text-charcoal">
                            <strong>📚 Kesempatan Belajar:</strong>{" "}
                            {suggestion.learningOpportunity}
                          </p>
                        )}
                        {suggestion.confidenceBooster && (
                          <p className="text-charcoal">
                            <strong>✨ Kamu Bisa:</strong>{" "}
                            {suggestion.confidenceBooster}
                          </p>
                        )}
                      </div>

                      {suggestion.codeSnippet.original && (
                        <div className="bg-charcoal rounded p-2 text-xs mt-2">
                          <div className="text-coral mb-1">❌ Sebelum:</div>
                          <pre className="text-sky overflow-x-auto">
                            {suggestion.codeSnippet.original}
                          </pre>
                          {suggestion.codeSnippet.improved && (
                            <>
                              <div className="text-green-400 mt-2 mb-1">
                                ✅ Sesudah:
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
                      </div>
                    ));
                  })()}
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

                {/* File processing progress indicator */}
                {processingProgress.total > 0 && (
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                      <div
                        className="bg-sky h-2.5 rounded-full transition-all duration-300"
                        style={{
                          width: `${
                            (processingProgress.current /
                              processingProgress.total) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>
                    <p className="text-xs">
                      Processing file {processingProgress.current} of{" "}
                      {processingProgress.total}: {processingProgress.fileName}
                    </p>

                    {/* File size and compression information */}
                    {fileProcessingInfo.compressedFiles.length > 0 && (
                      <div className="mt-2 p-2 bg-sky/20 rounded text-xs">
                        <p className="font-medium">
                          Compressed {fileProcessingInfo.compressedFiles.length}{" "}
                          file(s) to optimize processing
                        </p>
                        {fileProcessingInfo.totalSizeBefore > 0 && (
                          <p>
                            Size reduction:{" "}
                            {Math.round(
                              fileProcessingInfo.totalSizeBefore / 1024
                            )}
                            KB →
                            {Math.round(
                              fileProcessingInfo.totalSizeAfter / 1024
                            )}
                            KB (
                            {Math.round(
                              (1 -
                                fileProcessingInfo.totalSizeAfter /
                                  fileProcessingInfo.totalSizeBefore) *
                                100
                            )}
                            % saved)
                          </p>
                        )}
                      </div>
                    )}

                    {/* File size warnings */}
                    {fileProcessingInfo.oversizedFiles.length > 0 && (
                      <div className="mt-2 p-2 bg-amber/30 rounded text-xs">
                        <p className="font-medium">
                          ⚠️ {fileProcessingInfo.oversizedFiles.length} file(s)
                          exceed the recommended size limit (
                          {Math.round(FILE_SIZE_LIMIT / 1024)}KB):
                        </p>
                        <ul className="list-disc list-inside mt-1">
                          {fileProcessingInfo.oversizedFiles.map(
                            (fileName, index) => (
                              <li key={index}>{fileName}</li>
                            )
                          )}
                        </ul>
                        <p className="mt-1">
                          These files have been truncated to ensure optimal
                          review quality.
                        </p>
                      </div>
                    )}
                  </div>
                )}

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
              {cacheUsed ? " (cached)" : ""}
            </p>
          </div>
        </div>
      </div>
    );
  }
);

// Memoized export for performance optimization
export const CodeReviewResults = memo(CodeReviewResultsComponent);
