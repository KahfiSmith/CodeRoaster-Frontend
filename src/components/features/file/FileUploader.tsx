import { useState, useCallback } from "react";
import { CloudUpload } from "lucide-react";
import { UploadedFile } from "@/types";
import { formatFileSize } from "@/lib/helpers";

type FileUploaderProps = {
  uploadedFiles: UploadedFile[];
  setUploadedFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>;
  onSubmit?: () => void;
  isAnalyzing?: boolean;
};

export const FileUploader = ({ uploadedFiles, setUploadedFiles, onSubmit, isAnalyzing = false }: FileUploaderProps) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const getFileExtension = (filename: string): string => {
    return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 1);
  };

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map((file) => {
        const extension = getFileExtension(file.name);
        return {
          id: crypto.randomUUID(),
          name: file.name,
          size: file.size,
          extension: `.${extension}`,
          file: file,
        };
      });
      
      setUploadedFiles((prev) => [...prev, ...newFiles]);
    }
  }, [setUploadedFiles]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files).map((file) => {
        const extension = getFileExtension(file.name);
        return {
          id: crypto.randomUUID(),
          name: file.name,
          size: file.size,
          extension: `.${extension}`,
          file: file,
        };
      });
      
      setUploadedFiles((prev) => [...prev, ...newFiles]);
    }
  }, [setUploadedFiles]);

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
    <div className="bg-amber border-4 border-charcoal rounded-lg p-8 shadow-[0px_4px_0px_0px_#27292b]">
      <div className="text-center">
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-charcoal rounded-full flex items-center justify-center">
            <CloudUpload className="w-8 h-8 text-amber" />
          </div>
          <h3 className="text-xl font-bold text-charcoal mb-2">
            Upload Your Code
          </h3>
          <p className="text-charcoal/80 font-medium mb-4">
            Drag & drop your file or click to browse
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
            ].map((format) => (
              <span
                key={format}
                className="bg-charcoal text-amber px-2 py-1 text-xs font-bold rounded border-2 border-charcoal"
              >
                {format}
              </span>
            ))}
          </div>
        </div>
        <div 
          className={`border-3 border-dashed border-charcoal rounded-lg p-6 ${
            isDragging ? 'bg-coral/30' : 'bg-amber/20 hover:bg-coral/30'
          } transition-colors duration-200`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <label className="cursor-pointer block">
            <div className="flex flex-col items-center justify-center">
              <img
                src="icons/folder.svg"
                alt=""
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
              accept=".js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.go,.rs,.php,.rb,.swift,.kt,.scala,.sh,.html,.css,.json,.xml,.yaml,.yml"
              onChange={handleFileChange}
              multiple
            />
          </label>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-lg font-bold text-charcoal">
              Files{" "}
              <span className="text-sm font-normal text-charcoal/70">
                ({uploadedFiles.length})
              </span>
            </h4>
            <button 
              className="text-xs bg-charcoal text-amber px-2 py-1 rounded font-bold hover:bg-charcoal/80 transition-colors"
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
                  <li key={file.id} className="flex items-center justify-between bg-charcoal/10 p-2 rounded-md hover:bg-charcoal/20 transition-colors group">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-xs bg-charcoal text-amber px-1.5 py-0.5 rounded font-bold">
                        {file.extension}
                      </span>
                      <span className="text-charcoal text-sm truncate">
                        {file.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-charcoal/70">
                        {formatFileSize(file.size)}
                      </span>
                      <button 
                        className="opacity-0 group-hover:opacity-100 text-charcoal hover:text-charcoal transition-all text-xs"
                        onClick={() => removeFile(file.id)}
                      >
                        ✕
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-3 text-charcoal/50 text-sm">
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
                  ? 'bg-charcoal/50 text-amber/50 cursor-not-allowed'
                  : 'bg-charcoal text-amber hover:bg-charcoal/90 shadow-[0px_4px_0px_0px_#1a1c1e] hover:shadow-[0px_2px_0px_0px_#1a1c1e] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px]'
              } border-2 border-charcoal`}
            >
              {isAnalyzing ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-amber/50 border-t-amber rounded-full animate-spin"></div>
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
