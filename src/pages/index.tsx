import { useState, useRef, useEffect, useCallback } from "react";
import { UploadedFile, ReviewType } from "@/types";
import { FileUploader } from "@/components/features/file";
import {
  CodeReviewResults,
  CodeReviewResultsRef,
} from "@/components/features/review";
import { Header } from "@/components/layout";
import { Button } from "@/components/ui/button";
 
import { useOpenAIValidation } from "@/hooks";
import { reviewTypes } from "@/data/reviewTypes";

export default function CodeReviewer() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [reviewType, setReviewType] = useState<ReviewType>("sarcastic");
  const codeReviewRef = useRef<CodeReviewResultsRef>(null);

  // Use the validation hook to check OpenAI configuration
  const { isConfigured, model, maxTokens, temperature } = useOpenAIValidation();

  // State for tracking analysis
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Log configuration status only in development
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      if (isConfigured) {
        console.log(`✅ OpenAI configured with model: ${model}, max tokens: ${maxTokens}, temperature: ${temperature}`);
      } else {
        console.warn('⚠️ OpenAI not properly configured. Check your .env.local file');
      }
    }
  }, [isConfigured, model, maxTokens, temperature]);

  // Using reviewTypes from external file for better code splitting

  const handleSubmitFiles = useCallback(async () => {
    if (uploadedFiles.length > 0) {
      // Start the AI review process through the ref
      if (codeReviewRef.current) {
        codeReviewRef.current.startAnalysis();
      }
    } else {
      console.warn('⚠️ No files uploaded to review');
    }
  }, [uploadedFiles]);

  const handleAnalysisStateChange = useCallback((analyzing: boolean) => {
    setIsAnalyzing(analyzing);
    // Only log in development environment
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      console.log(analyzing ? '🔄 Analysis state changed to analyzing' : '✅ Analysis completed');
    }
  }, []);

  return (
    <div className="bg-cream dark:bg-coal-500 min-h-screen p-8">
      
      <Header />

      {/* Review Type Selector */}
      <div>
        <div className="bg-charcoal dark:bg-coal-400 p-6 rounded-lg border-3 border-charcoal dark:border-cream">
          <h3 className="text-sky dark:text-cream font-bold text-lg mb-4 flex items-center gap-2">
            <span>🎭</span>
            Pilih Kepribadian Reviewer Kamu
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {reviewTypes.map((type) => (
              <Button
                key={type.key}
                onClick={() => setReviewType(type.key)}
                className={`${type.color} ${
                  reviewType === type.key
                    ? "ring-1 ring-white ring-offset-1 ring-offset-cream scale-[1.02]"
                    : "hover:scale-[1.02]"
                } text-charcoal font-medium py-2 hover:bg-cream px-2 rounded-md border-2 border-white transition-all duration-200 hover:translate-x-[1px] hover:translate-y-[1px] active:shadow-none text-xs h-auto flex-col gap-1 min-h-[60px]`}
              >
                <div className="font-bold text-center leading-tight">
                  {type.label}
                </div>
                <div className="text-[10px] opacity-80 text-center leading-tight">
                  {type.description}
                </div>
              </Button>
            ))}
          </div>
          <div className="mt-4 text-sky dark:text-cream text-sm text-center">
            💡 <strong>Tip:</strong> Mulai dengan "Roasting Sarkastik" untuk nilai 
            entertainment maksimal! 😈
          </div>
        </div>

        {/* Review Type Preview - Big Card */}
        {/* <div className="mt-8">
          <div className="max-w-4xl mx-auto">
            <ReviewTypeDemo reviewType={reviewType} />
          </div>
        </div> */}
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start justify-between mb-8 mt-10">
        <div className="w-full lg:w-[45%]">
          <FileUploader
            uploadedFiles={uploadedFiles}
            setUploadedFiles={setUploadedFiles}
            onSubmit={handleSubmitFiles}
            isAnalyzing={isAnalyzing}
          />
        </div>
        <div className="w-full lg:w-[55%]">
          <CodeReviewResults
            ref={codeReviewRef}
            uploadedFiles={uploadedFiles}
            reviewType={reviewType}
            onAnalysisStateChange={handleAnalysisStateChange}
          />
        </div>
      </div>
    </div>
  );
}
