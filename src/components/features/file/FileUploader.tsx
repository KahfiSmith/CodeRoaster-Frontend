import { useState, useCallback } from "react";
import { CloudUpload } from "lucide-react";
import { UploadedFile } from "@/types";
import { formatFileSize } from "@/lib/helpers";

// Size validation and preprocessing config (module-level constants)
const MAX_FILE_SIZE = 50 * 1024; // 50KB
const SUPPORTED_EXTENSIONS = ['.js', '.ts', '.jsx', '.tsx', '.dart', '.rb', '.swift', '.kt'];
const SMALL_FILE_THRESHOLD = 10 * 1024; // 10KB - skip preprocessing for very small files

// Naive extraction of key sections (functions, classes, exports)
const extractKeyCodeSections = (content: string): string => {
  try {
    const sections: string[] = [];
    // Keep imports for context (limit to avoid bloat)
    const importLines = content.match(/^\s*import\s+[^;]+;\s*$/gmi) || [];
    if (importLines.length) sections.push(importLines.slice(0, 50).join('\n'));

    // Keep export statements
    const exportLines = content.match(/^\s*export\s+(?:default\s+)?[^;]+;\s*$/gmi) || [];
    if (exportLines.length) sections.push(exportLines.join('\n'));

    // Function and class declarations (signatures)
    const declLines = content.match(/^\s*(?:export\s+)?(?:async\s+)?(?:function|class|interface|type|enum)\b.*$/gmi) || [];
    if (declLines.length) sections.push(declLines.join('\n'));

    // Arrow function assignments (signatures)
    const arrowFnLines = content.match(/^\s*(?:export\s+)?(?:const|let|var)\s+\w+\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/gmi) || [];
    if (arrowFnLines.length) sections.push(arrowFnLines.join('\n'));

    const extracted = sections.join('\n\n');
    // Fallback: if extraction too small, include beginning of file for more context
    if (extracted.trim().length < 200) {
      const head = content.slice(0, Math.min(content.length, 10 * 1024));
      return `${extracted}\n\n// --- Context Head ---\n${head}`.trim();
    }
    return extracted;
  } catch {
    // In case of any parsing issues, return original content
    return content;
  }
};

type FileUploaderProps = {
  uploadedFiles: UploadedFile[];
  setUploadedFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>;
  onSubmit?: () => void;
  isAnalyzing?: boolean;
};

export const FileUploader = ({ uploadedFiles, setUploadedFiles, onSubmit, isAnalyzing = false }: FileUploaderProps) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const getFileExtension = useCallback((filename: string): string => {
    return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 1);
  }, []);

  const preprocessFile = useCallback(async (file: File): Promise<{text: string, changed: boolean}> => {
    const originalText = await file.text();
    const ext = `.${getFileExtension(file.name).toLowerCase()}`;
    
    // Skip preprocessing for very small files - they're fast enough already
    if (file.size <= SMALL_FILE_THRESHOLD) {
      return {text: originalText, changed: false};
    }
    
    // Only extract key sections from larger supported code files
    if (SUPPORTED_EXTENSIONS.includes(ext) && file.size > MAX_FILE_SIZE) {
      const processed = extractKeyCodeSections(originalText);
      return {text: processed, changed: processed.length !== originalText.length};
    }
    
    return {text: originalText, changed: false};
  }, [getFileExtension]);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Process at most 5 files at once to prevent UI freeze
      const maxFilesToProcess = 5;
      const filesToProcess = Array.from(e.target.files).slice(0, maxFilesToProcess);
      
      if (e.target.files.length > maxFilesToProcess) {
        alert(`Untuk performa optimal, hanya ${maxFilesToProcess} file pertama yang akan diproses.`);
      }
      
      const prepared = await Promise.all(filesToProcess.map(async (file) => {
        const extension = getFileExtension(file.name);

        let processedFile = file;
        let preprocessed = false;
        try {
          const result = await preprocessFile(file);
          if (result.changed) {
            processedFile = new File([result.text], file.name, { type: 'text/plain' });
            preprocessed = true;
          }
        } catch {
          // If preprocessing fails, keep original file
          processedFile = file;
        }

        return {
          id: crypto.randomUUID(),
          name: file.name,
          size: processedFile.size,
          extension: `.${extension}`,
          file: processedFile,
          preprocessed
        } as UploadedFile;
      }));

      setUploadedFiles((prev) => [...prev, ...prepared]);
    }
  }, [setUploadedFiles, preprocessFile, getFileExtension]);

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // Process at most 5 files at once to prevent UI freeze
      const maxFilesToProcess = 5;
      const filesToProcess = Array.from(e.dataTransfer.files).slice(0, maxFilesToProcess);
      
      if (e.dataTransfer.files.length > maxFilesToProcess) {
        alert(`Untuk performa optimal, hanya ${maxFilesToProcess} file pertama yang akan diproses.`);
      }
      
      const prepared = await Promise.all(filesToProcess.map(async (file) => {
        const extension = getFileExtension(file.name);

        let processedFile = file;
        let preprocessed = false;
        try {
          const result = await preprocessFile(file);
          if (result.changed) {
            processedFile = new File([result.text], file.name, { type: 'text/plain' });
            preprocessed = true;
          }
        } catch {
          processedFile = file;
        }

        return {
          id: crypto.randomUUID(),
          name: file.name,
          size: processedFile.size,
          extension: `.${extension}`,
          file: processedFile,
          preprocessed
        } as UploadedFile;
      }));

      setUploadedFiles((prev) => [...prev, ...prepared]);
    }
  }, [setUploadedFiles, preprocessFile, getFileExtension]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeFile = useCallback((id: string) => {
    setUploadedFiles((prev) => prev.filter((file) => file.id !== id));
  }, [setUploadedFiles]);

  const clearAllFiles = useCallback(() => {
    setUploadedFiles([]);
  }, [setUploadedFiles]);

  return (
    <div className="bg-amber dark:bg-coal-400 border-4 border-charcoal dark:border-cream rounded-lg p-8 shadow-[0px_4px_0px_0px_#27292b]">
      <div className="text-center">
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-charcoal rounded-full flex items-center justify-center">
            <CloudUpload className="w-8 h-8 text-amber dark:text-cream" />
          </div>
          <h3 className="text-xl font-bold text-charcoal dark:text-cream mb-2">
            Upload Your Code
          </h3>
          <p className="text-charcoal/80 dark:text-cream/80 font-medium mb-2">
            Drag & drop your file or click to browse
          </p>
          <p className="text-xs text-charcoal dark:text-cream mb-4">
            <span className="inline-flex items-center">
              <span className="mr-1">🌍</span> File &gt;30KB will be compressed
            </span>
            <span className="mx-2">•</span>
            <span className="inline-flex items-center">
              <span className="mr-1">🌏</span> File &gt;50KB will be truncated
            </span>
          </p>
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {[
              ".js",
              ".jsx",
              ".ts",
              ".tsx",
              ".py",
              ".java",
              ".cpp",
              ".go",
              ".rs",
              ".php",
              ".dart",
              ".rb",
              ".swift",
              ".kt",
            ].map((format) => (
              <span
                key={format}
                className="bg-charcoal text-amber dark:text-cream px-2 py-1 text-xs font-bold rounded border-2 border-charcoal"
              >
                {format}
              </span>
            ))}
          </div>
        </div>
        <div 
          className={`border-3 border-dashed bg-cream/50 border-charcoal dark:border-charcoal/50 rounded-lg p-6 ${
            isDragging ? 'bg-coral/30 dark:bg-cream' : 'bg-amber/20 dark:bg-cream hover:bg-cream/80 dark:hover:bg-cream/80'
          } transition-colors duration-200`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          role="button"
          tabIndex={0}
          aria-label="Upload code files - drag and drop or click to browse"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              const input = e.currentTarget.querySelector('input[type="file"]') as HTMLInputElement;
              input?.click();
            }
          }}
        >
          <label className="cursor-pointer block">
            <div className="flex flex-col items-center justify-center">
              <img
                src="icons/folder.svg"
                alt="Upload folder icon"
                className="w-12 h-12"
              />
              <span className="text-charcoal font-bold">
                Click to select file
              </span>
              <span className="text-sm text-charcoal/70 mt-1">
                or drag and drop here
              </span>
            </div>
            <input
              type="file"
              className="hidden"
              accept=".js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.go,.rs,.php,.rb,.swift,.kt,.dart"
              onChange={handleFileChange}
              multiple
            />
          </label>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-lg font-bold text-charcoal dark:text-cream">
              Files{" "}
              <span className="text-sm font-normal text-charcoal/70 dark:text-cream/70">
                ({uploadedFiles.length})
              </span>
            </h4>
            <button 
              className="text-xs bg-charcoal dark:bg-cream text-amber dark:text-charcoal px-2 py-1 rounded font-bold hover:bg-charcoal/80 dark:hover:bg-cream/80 transition-colors"
              onClick={clearAllFiles}
              disabled={uploadedFiles.length === 0}
            >
              Clear All
            </button>
          </div>

          <div className="max-h-32 overflow-y-auto custom-scrollbar duration-300">
            {uploadedFiles.length > 0 ? (
              <ul className="space-y-2 pr-2">
                {uploadedFiles.map((file) => (
                  <li key={file.id} className="flex items-center justify-between bg-charcoal/10 dark:bg-cream/10 p-2 rounded-md hover:bg-charcoal/20 transition-colors group">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-xs bg-charcoal text-amber dark:bg-cream dark:text-charcoal px-1.5 py-0.5 rounded font-bold">
                        {file.extension}
                      </span>
                      <span className="text-charcoal dark:text-cream text-sm truncate">
                        {file.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span 
                        className="text-xs text-charcoal/70 dark:text-cream/70 group relative cursor-help"
                        title={file.size > 50 * 1024 ? 
                          "File ini melebihi batas ukuran optimal (80KB) dan akan dipotong/dikompresi saat diproses" : 
                          file.size > 30 * 1024 ? 
                          "File ini akan dikompresi otomatis untuk mengoptimalkan proses review" : 
                          ""}
                      >
                        {formatFileSize(file.size, { showIndicator: true })}
                      </span>
                      <button 
                        className="opacity-0 group-hover:opacity-100 text-charcoal dark:text-cream hover:text-charcoal dark:hover:text-cream transition-all text-xs"
                        onClick={() => removeFile(file.id)}
                      >
                        ✕
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-3 text-charcoal/50 dark:text-cream text-sm">
                No files uploaded yet
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        {uploadedFiles.length > 0 && (
          <div className="mt-6">
            <button
              onClick={onSubmit}
              disabled={isAnalyzing}
              className={`w-full py-3 px-6 rounded-lg font-bold text-lg transition-all duration-200 ${
                isAnalyzing
                  ? 'bg-charcoal/50 dark:bg-cream/50 text-amber/50 dark:text-charcoal/50 cursor-not-allowed'
                  : 'bg-charcoal dark:bg-cream text-amber dark:text-charcoal hover:bg-charcoal/90 dark:hover:bg-cream/90 shadow-[0px_4px_0px_0px_#1a1c1e] hover:shadow-[0px_2px_0px_0px_#1a1c1e] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px]'
              } border-2 border-charcoal`}
            >
              {isAnalyzing ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-amber/50 dark:border-cream/50 border-t-amber dark:border-t-cream rounded-full animate-spin"></div>
                  <span>Analyzing Code...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span>🚀</span>
                  <span>Start Code Review</span>
                </div>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
