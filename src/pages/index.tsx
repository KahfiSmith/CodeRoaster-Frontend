import { useState } from "react";
import { UploadedFile } from "@/types";
import { FileUploader } from "@/components/features/file";
import { CodeReviewResults } from "@/components/features/review";
import { Header } from "@/components/layout";

export default function CodeReviewer() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  return (
    <div className="bg-cream min-h-screen p-8">
      <Header />
      <div className="flex flex-col lg:flex-row gap-8 items-start justify-between mb-8">
        <div className="w-full lg:w-[45%]">
          <FileUploader 
            uploadedFiles={uploadedFiles} 
            setUploadedFiles={setUploadedFiles} 
          />
        </div>
        <div className="w-full lg:w-[55%]">
          <CodeReviewResults />
        </div>
      </div>
    </div>
  );
}
