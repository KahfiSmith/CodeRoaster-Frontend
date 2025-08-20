export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  extension: string;
  file: File;
  preprocessed?: boolean;
}

export interface BookmarkItem {
  id: number;
  title: string;
  category: BookmarkCategory;
  language: string;
  description: string;
  codeExample: {
    wrong: string;
    correct: string;
  };
  tags: string[];
  dateAdded: string;
  usageCount: number;
  source?: "from-review" | "manual-add" | "preset";
  isBookmarked?: boolean;
  canAutoFix?: boolean;
}

export type BookmarkCategory =
  | "best-practices"
  | "security"
  | "performance"
  | "bugs"
  | "documentation";

export interface Category {
  id: string;
  name: string;
  count: number;
  icon?: React.ReactNode;
  color?: string;
}

export interface BookmarkFilter {
  category: string;
  language: string;
  searchTerm: string;
  tags: string[];
}

export interface BookmarkStats {
  totalBookmarks: number;
  mostUsedCategory: BookmarkCategory;
  topLanguages: { language: string; count: number }[];
  recentlyAdded: BookmarkItem[];
}

export interface BookmarkCardProps {
  bookmark: BookmarkItem;
  onClick: () => void;
  onBookmarkToggle?: (id: number) => void;
  onDelete?: (id: number) => void;
  showActions?: boolean;
}

export interface BookmarkDetailModalProps {
  bookmark: BookmarkItem;
  onClose: () => void;
  onEdit?: (bookmark: BookmarkItem) => void;
  onDelete?: (id: number) => void;
}

export interface BookmarkManagerProps {
  initialBookmarks?: BookmarkItem[];
  onBookmarkAdd?: (bookmark: Omit<BookmarkItem, "id">) => void;
  onBookmarkUpdate?: (bookmark: BookmarkItem) => void;
  onBookmarkDelete?: (id: number) => void;
}

export interface CategorySidebarProps {
  categories: Category[];
  selectedCategory: string;
  onCategorySelect: (categoryId: string) => void;
}

export interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  placeholder?: string;
  filters?: {
    languages: string[];
    selectedLanguage: string;
    onLanguageChange: (language: string) => void;
  };
}

export type BookmarkSortField =
  | "title"
  | "dateAdded"
  | "usageCount"
  | "category"
  | "language";
export type SortDirection = "asc" | "desc";

export interface BookmarkSort {
  field: BookmarkSortField;
  direction: SortDirection;
}

export const BOOKMARK_CATEGORIES: Record<
  BookmarkCategory,
  { name: string; color: string; description: string }
> = {
  "best-practices": {
    name: "Best Practices",
    color: "bg-amber",
    description: "Recommended coding patterns and conventions",
  },
  security: {
    name: "Security",
    color: "bg-coral",
    description: "Security-related improvements and fixes",
  },
  performance: {
    name: "Performance",
    color: "bg-sky",
    description: "Performance optimizations and improvements",
  },
  bugs: {
    name: "Bug Fixes",
    color: "bg-soft-coral",
    description: "Common bugs and their solutions",
  },
  documentation: {
    name: "Documentation",
    color: "bg-cream",
    description: "Documentation and comment improvements",
  },
};

export const SUPPORTED_LANGUAGES = [
  "javascript",
  "typescript",
  "python",
  "java",
  "cpp",
  "c",
  "go",
  "rust",
  "php",
  "ruby",
  "swift",
  "kotlin",
  "dart",
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export interface ReviewSuggestion {
  id: string;
  type:
    | "bug"
    | "performance"
    | "style"
    | "security"
    | "docs"
    | "info"
    | "architecture"
    | "testing"
    | "comedy"
    | "disaster"
    | "catastrophe"
    | "nightmare"
    | "unacceptable"
    | "critical"
    | "opportunity"
    | "improvement"
    | "enhancement"
    | "learning"
    | "growth";
  severity:
    | "critical"
    | "high"
    | "medium"
    | "low"
    | "opportunity"
    | "enhancement"
    | "suggestion";
  line: number;
  title: string;
  description: string;
  suggestion: string;
  codeSnippet: {
    original: string;
    improved: string;
  };
  fileName?: string; // File name where the suggestion applies
  filePath?: string; // Optional file path for multi-file projects
  canAutoFix: boolean;
  impact?: string;
  priority?: string;
  riskLevel?: string;
  attackVector?: string;
  mitigationStrategy?: string;
  benefits?: string;
  industryStandard?: string;
  difficulty?: string;
  roastLevel?: string;
  analogiKocak?: string;
  consequencesIfIgnored?: string;
  urgencyLevel?: string;
  learningOpportunity?: string;
  confidenceBooster?: string;
  nextSteps?: string;
}

export interface ReviewSummary {
  totalIssues: number;
  critical: number;
  warning: number;
  info: number;
}

export interface ReviewMetadata {
  reviewType: string;
  language: string;
  model: string;
  timestamp: string;
  tokensUsed: number;
  fallback?: boolean;
  error?: string;
  overallAssessment?: string;
  overallSecurityAssessment?: string;
  overallRoast?: string;
  brutalAssessment?: string;
  positiveAssessment?: string;
  codeMetrics?: {
    complexity?: string;
    maintainability?: string;
    testability?: string;
  };
  recommendations?: string[];
  securityChecklist?: string[];
  designPatterns?: string[];
  qualityMetrics?: {
    codeOrganization?: string;
    namingConventions?: string;
    documentationLevel?: string;
    testability?: string;
  };
  comedyGold?: string[];
  motivasiSarkastik?: string;
  realityCheck?: string[];
  harshTruth?: string;
  encouragements?: string[];
  growthMindset?: string;
}

export interface ReviewResult {
  score: number;
  summary: ReviewSummary;
  suggestions: ReviewSuggestion[];
  metadata?: ReviewMetadata;
}

export interface ConnectionResult {
  success: boolean;
  message: string;
  availableModels?: string[];
  error?: unknown;
}

export interface ConnectionStatus {
  isConnected: boolean;
  model: string;
  maxTokens: number;
}

export interface UsageStats {
  message?: string;
  suggestion?: string;
  error?: string;
}

export type ReviewType =
  | "codeQuality"
  | "security"
  | "bestPractices"
  | "sarcastic"
  | "brutal"
  | "encouraging";

export interface ReviewPrompt {
  system: string;
  user: (code: string, language: string) => string;
}

export interface ReviewPrompts {
  codeQuality: ReviewPrompt;
  security: ReviewPrompt;
  bestPractices: ReviewPrompt;
  sarcastic: ReviewPrompt;
  brutal: ReviewPrompt;
  encouraging: ReviewPrompt;
  [key: string]: ReviewPrompt;
}

export interface HistoryItem {
  id: string;
  filename: string;
  language: SupportedLanguage;
  reviewResult: ReviewResult;
  timestamp: string;
  fileSize: number;
  reviewType: ReviewType;
}

export interface HistoryFilter {
  searchTerm: string;
  language: string;
  reviewType: string;
  severity: string;
  dateRange: string;
}

export interface HistoryCardProps {
  item: HistoryItem;
  onClick: () => void;
  onDelete: (id: string) => void;
}

export interface HistoryDetailModalProps {
  item: HistoryItem;
  onClose: () => void;
}

export interface BookmarkItem {
  id: number;
  title: string;
  category: BookmarkCategory;
  language: string;
  description: string;
  codeExample: {
    wrong: string;
    correct: string;
  };
  tags: string[];
  dateAdded: string;
  usageCount: number;
}

export interface Category {
  id: string;
  name: string;
  count: number;
}

export interface BookmarkCardProps {
  bookmark: BookmarkItem;
  onClick: () => void;
}

export interface BookmarkDetailModalProps {
  bookmark: BookmarkItem;
  onClose: () => void;
}

export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  icon?: "trash" | "warning" | "alert";
}

export interface AICodeSnippet {
  original?: string;
  improved?: string;
}

export interface AISuggestionResponse {
  id?: string;
  type?:
    | "bug"
    | "performance"
    | "style"
    | "security"
    | "docs"
    | "info"
    | "architecture"
    | "testing"
    | "comedy"
    | "disaster"
    | "catastrophe"
    | "nightmare"
    | "unacceptable"
    | "critical"
    | "opportunity"
    | "improvement"
    | "enhancement"
    | "learning"
    | "growth";
  severity?:
    | "critical"
    | "high"
    | "medium"
    | "low"
    | "opportunity"
    | "enhancement"
    | "suggestion";
  line?: number;
  title?: string;
  description?: string;
  suggestion?: string;
  codeSnippet?: AICodeSnippet;
  analogiKocak?: string;
  urgencyLevel?: string;
  learningOpportunity?: string;
  canAutoFix?: boolean;
}

export interface AIResponseData {
  score?: number;
  summary?: {
    totalIssues?: number;
    critical?: number;
    warning?: number;
    info?: number;
  };
  suggestions?: AISuggestionResponse[];
  overallAssessment?: string;
  overallSecurityAssessment?: string;
  overallRoast?: string;
  brutalAssessment?: string;
  positiveAssessment?: string;
  recommendations?: string[];
  securityChecklist?: string[];
  designPatterns?: string[];
  comedyGold?: string[];
  motivasiSarkastik?: string;
  harshTruth?: string;
  growthMindset?: string;
}
