/**
 * Format file size with optional indicators for file size thresholds
 * @param bytes File size in bytes
 * @param options Formatting options
 * @returns Formatted file size string
 */
export const formatFileSize = (
  bytes: number, 
  options?: {
    showIndicator?: boolean;       // Show size indicator icon
    sizeLimit?: number;            // Size limit in bytes for warning
    compressThreshold?: number;    // Threshold for compression in bytes
  }
): string => {
  // Default options
  const opts = {
    showIndicator: false,
    sizeLimit: 50 * 1024,          // 80KB default limit
    compressThreshold: 30 * 1024,  // 30KB default compression threshold
    ...options
  };

  // Format the basic size string
  let sizeStr: string;
  if (bytes < 1024) {
    sizeStr = bytes + " B";
  } else if (bytes < 1048576) {
    sizeStr = (bytes / 1024).toFixed(0) + " KB";
  } else {
    sizeStr = (bytes / 1048576).toFixed(1) + " MB";
  }

  // Add indicator if requested
  if (opts.showIndicator) {
    if (bytes > opts.sizeLimit) {
      // Over size limit - add warning indicator
      return `${sizeStr} ⚠️`;
    } else if (bytes > opts.compressThreshold) {
      // Over compression threshold - add info indicator
      return `${sizeStr} 📦`;
    }
  }

  return sizeStr;
};