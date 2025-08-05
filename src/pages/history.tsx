import React, { useState, useEffect } from "react";
import {
  History as HistoryIcon,
  Search,
  Filter,
  Calendar,
  FileCode,
  AlertTriangle,
  CheckCircle,
  Info,
  Zap,
  Bug,
  Shield,
  Code,
  Eye,
  Download,
  Trash2,
} from "lucide-react";
import { Header } from "@/components/layout";
import { HistoryCardProps, HistoryDetailModalProps, HistoryFilter, HistoryItem } from "@/types";

const sampleHistoryData: HistoryItem[] = [
  {
    id: "hist_001",
    filename: "userService.js",
    language: "javascript",
    reviewResult: {
      score: 75,
      summary: {
        totalIssues: 8,
        critical: 2,
        warning: 4,
        info: 2,
      },
      suggestions: [
        {
          id: "sug_001",
          type: "security",
          severity: "high",
          line: 23,
          title: "SQL Injection Vulnerability",
          description: "Direct string concatenation in SQL query creates security risk",
          suggestion: "Use parameterized queries or prepared statements",
          codeSnippet: {
            original: "const query = `SELECT * FROM users WHERE id = ${userId}`;",
            improved: "const query = 'SELECT * FROM users WHERE id = ?'; db.query(query, [userId]);"
          },
          canAutoFix: true,
        },
        {
          id: "sug_002",
          type: "performance",
          severity: "medium",
          line: 45,
          title: "Inefficient Array Method Chain",
          description: "Multiple array iterations can be optimized",
          suggestion: "Combine filter and map operations using reduce",
          codeSnippet: {
            original: "const result = users.filter(u => u.active).map(u => u.name);",
            improved: "const result = users.reduce((acc, u) => u.active ? [...acc, u.name] : acc, []);"
          },
          canAutoFix: false,
        }
      ],
      metadata: {
        reviewType: "codeQuality",
        language: "javascript",
        model: "gpt-4",
        timestamp: "2025-08-04T10:30:00Z",
        tokensUsed: 1250,
      }
    },
    timestamp: "2025-08-04T10:30:00Z",
    fileSize: 2048,
    reviewType: "codeQuality",
  },
  {
    id: "hist_002",
    filename: "authController.py",
    language: "python",
    reviewResult: {
      score: 88,
      summary: {
        totalIssues: 4,
        critical: 0,
        warning: 2,
        info: 2,
      },
      suggestions: [
        {
          id: "sug_003",
          type: "security",
          severity: "medium",
          line: 15,
          title: "Weak Password Validation",
          description: "Password requirements are too lenient",
          suggestion: "Implement stronger password policy with complexity requirements",
          codeSnippet: {
            original: "if len(password) < 6:",
            improved: "if not re.match(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$', password):"
          },
          canAutoFix: true,
        }
      ],
      metadata: {
        reviewType: "security",
        language: "python",
        model: "gpt-4",
        timestamp: "2025-08-03T14:15:00Z",
        tokensUsed: 890,
      }
    },
    timestamp: "2025-08-03T14:15:00Z",
    fileSize: 1536,
    reviewType: "security",
  },
  {
    id: "hist_003",
    filename: "dataProcessor.ts",
    language: "typescript",
    reviewResult: {
      score: 92,
      summary: {
        totalIssues: 2,
        critical: 0,
        warning: 1,
        info: 1,
      },
      suggestions: [
        {
          id: "sug_004",
          type: "style",
          severity: "low",
          line: 32,
          title: "Missing Type Annotations",
          description: "Function parameters should have explicit type annotations",
          suggestion: "Add type annotations for better type safety",
          codeSnippet: {
            original: "function processData(data, options) {",
            improved: "function processData(data: DataItem[], options: ProcessOptions): ProcessedData {"
          },
          canAutoFix: false,
        }
      ],
      metadata: {
        reviewType: "bestPractices",
        language: "typescript",
        model: "gpt-4",
        timestamp: "2025-08-02T09:45:00Z",
        tokensUsed: 567,
      }
    },
    timestamp: "2025-08-02T09:45:00Z",
    fileSize: 3072,
    reviewType: "bestPractices",
  }
];

const severityColors = {
  high: "bg-coral",
  medium: "bg-amber", 
  low: "bg-sky",
} as const;

const severityIcons = {
  high: <AlertTriangle className="w-4 h-4" />,
  medium: <Info className="w-4 h-4" />,
  low: <CheckCircle className="w-4 h-4" />,
} as const;

const reviewTypeColors = {
  codeQuality: "bg-sky",
  security: "bg-coral",
  bestPractices: "bg-amber",
  sarcastic: "bg-soft-coral",
  brutal: "bg-coral",
  encouraging: "bg-sky",
} as const;

const reviewTypeIcons = {
  codeQuality: <Code className="w-4 h-4" />,
  security: <Shield className="w-4 h-4" />,
  bestPractices: <Zap className="w-4 h-4" />,
  sarcastic: <FileCode className="w-4 h-4" />,
  brutal: <AlertTriangle className="w-4 h-4" />,
  encouraging: <CheckCircle className="w-4 h-4" />,
} as const;

const suggestionTypeIcons = {
  bug: <Bug className="w-4 h-4" />,
  performance: <Zap className="w-4 h-4" />,
  style: <Code className="w-4 h-4" />,
  security: <Shield className="w-4 h-4" />,
  docs: <FileCode className="w-4 h-4" />,
  info: <Info className="w-4 h-4" />,
} as const;

export default function History() {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [filter, setFilter] = useState<HistoryFilter>({
    searchTerm: "",
    language: "all",
    reviewType: "all",
    severity: "all",
    dateRange: "all",
  });

  // Load history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('codeRoaster_history');
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        setHistoryItems(parsedHistory);
        console.log('📚 Loaded history from localStorage:', parsedHistory.length, 'items');
      } catch (error) {
        console.error('❌ Error loading history:', error);
        // Fallback to sample data if localStorage is corrupted
        setHistoryItems(sampleHistoryData);
      }
    } else {
      // Use sample data if no history exists
      console.log('📝 No history found, using sample data');
      setHistoryItems(sampleHistoryData);
    }
  }, []);

  // Save history to localStorage when items change (only if user made changes)
  useEffect(() => {
    // Only save if there are actual items (not empty array from clear)
    if (historyItems.length > 0) {
      localStorage.setItem('codeRoaster_history', JSON.stringify(historyItems));
    }
  }, [historyItems]);

  const filteredItems = historyItems.filter((item) => {
    const matchesSearch =
      item.filename.toLowerCase().includes(filter.searchTerm.toLowerCase()) ||
      item.reviewResult.suggestions.some(s => 
        s.title.toLowerCase().includes(filter.searchTerm.toLowerCase()) ||
        s.description.toLowerCase().includes(filter.searchTerm.toLowerCase())
      );
    
    const matchesLanguage = filter.language === "all" || item.language === filter.language;
    const matchesReviewType = filter.reviewType === "all" || item.reviewType === filter.reviewType;
    const matchesSeverity = filter.severity === "all" || 
      item.reviewResult.suggestions.some(s => s.severity === filter.severity);

    let matchesDate = true;
    if (filter.dateRange !== "all") {
      const itemDate = new Date(item.timestamp);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24));
      
      switch (filter.dateRange) {
        case "today":
          matchesDate = daysDiff === 0;
          break;
        case "week":
          matchesDate = daysDiff <= 7;
          break;
        case "month":
          matchesDate = daysDiff <= 30;
          break;
      }
    }

    return matchesSearch && matchesLanguage && matchesReviewType && matchesSeverity && matchesDate;
  });

  const handleDeleteItem = (id: string) => {
    setHistoryItems(prev => prev.filter(item => item.id !== id));
  };

  const clearAllHistory = () => {
    if (confirm("Are you sure you want to clear all history? This action cannot be undone.")) {
      setHistoryItems([]);
      localStorage.removeItem('codeRoaster_history');
    }
  };

  const refreshHistory = () => {
    const savedHistory = localStorage.getItem('codeRoaster_history');
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        setHistoryItems(parsedHistory);
        console.log('🔄 History refreshed:', parsedHistory.length, 'items');
      } catch (error) {
        console.error('❌ Error refreshing history:', error);
      }
    } else {
      console.log('📝 No history found in localStorage');
      setHistoryItems([]);
    }
  };

  const exportHistory = () => {
    const dataStr = JSON.stringify(historyItems, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `codeRoaster_history_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-cream min-h-screen p-8">
      <Header />

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters */}
        <div className="w-full lg:w-1/4">
          <div className="bg-sky border-4 border-charcoal rounded-lg shadow-[0px_4px_0px_0px_#27292b] sticky top-8">
            <div className="bg-charcoal p-4 border-b-4 border-charcoal">
              <h2 className="text-xl font-bold text-sky flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters
              </h2>
            </div>
            <div className="p-4 bg-sky/80 space-y-4">
              {/* Language Filter */}
              <div>
                <label className="block text-sm font-bold text-charcoal mb-2">Language</label>
                <select
                  value={filter.language}
                  onChange={(e) => setFilter(prev => ({ ...prev, language: e.target.value }))}
                  className="w-full p-2 bg-cream border-2 border-charcoal rounded font-bold text-charcoal"
                >
                  <option value="all">All Languages</option>
                  <option value="javascript">JavaScript</option>
                  <option value="typescript">TypeScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                </select>
              </div>

              {/* Review Type Filter */}
              <div>
                <label className="block text-sm font-bold text-charcoal mb-2">Review Type</label>
                <select
                  value={filter.reviewType}
                  onChange={(e) => setFilter(prev => ({ ...prev, reviewType: e.target.value }))}
                  className="w-full p-2 bg-cream border-2 border-charcoal rounded font-bold text-charcoal"
                >
                  <option value="all">All Types</option>
                  <option value="sarcastic">🔥 Roasting Sarkastik</option>
                  <option value="brutal">💀 Brutal Jujur</option>
                  <option value="encouraging">🌟 Mentor Supportif</option>
                  <option value="codeQuality">🔍 Profesional</option>
                  <option value="security">🛡️ Fokus Keamanan</option>
                  <option value="bestPractices">⭐ Best Practices</option>
                </select>
              </div>

              {/* Severity Filter */}
              <div>
                <label className="block text-sm font-bold text-charcoal mb-2">Severity</label>
                <select
                  value={filter.severity}
                  onChange={(e) => setFilter(prev => ({ ...prev, severity: e.target.value }))}
                  className="w-full p-2 bg-cream border-2 border-charcoal rounded font-bold text-charcoal"
                >
                  <option value="all">All Severities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              {/* Date Range Filter */}
              <div>
                <label className="block text-sm font-bold text-charcoal mb-2">Date Range</label>
                <select
                  value={filter.dateRange}
                  onChange={(e) => setFilter(prev => ({ ...prev, dateRange: e.target.value }))}
                  className="w-full p-2 bg-cream border-2 border-charcoal rounded font-bold text-charcoal"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Last Week</option>
                  <option value="month">Last Month</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-4 border-t-2 border-charcoal">
                <button
                  onClick={refreshHistory}
                  className="w-full p-2 bg-sky border-2 border-charcoal rounded font-bold text-charcoal hover:bg-sky/80 transition-colors flex items-center gap-2 justify-center"
                >
                  <HistoryIcon className="w-4 h-4" />
                  Refresh History
                </button>
                <button
                  onClick={exportHistory}
                  className="w-full p-2 bg-amber border-2 border-charcoal rounded font-bold text-charcoal hover:bg-amber/80 transition-colors flex items-center gap-2 justify-center"
                >
                  <Download className="w-4 h-4" />
                  Export History
                </button>
                <button
                  onClick={clearAllHistory}
                  className="w-full p-2 bg-coral border-2 border-charcoal rounded font-bold text-charcoal hover:bg-coral/80 transition-colors flex items-center gap-2 justify-center"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="w-full lg:w-3/4">
          {/* Header with Search */}
          <div className="bg-coral border-4 border-charcoal rounded-lg shadow-[0px_4px_0px_0px_#27292b] mb-6">
            <div className="bg-charcoal p-4 border-b-4 border-charcoal">
              <h1 className="text-2xl font-bold text-coral flex items-center gap-2">
                <HistoryIcon className="w-6 h-6" />
                Review History
              </h1>
              <p className="text-coral/80 text-sm mt-1">
                View and manage your past code reviews
              </p>
            </div>
            <div className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-charcoal w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search files, issues, or suggestions..."
                  value={filter.searchTerm}
                  onChange={(e) => setFilter(prev => ({ ...prev, searchTerm: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 bg-cream border-3 border-charcoal rounded-lg text-charcoal font-bold placeholder:text-charcoal/60 focus:outline-none focus:shadow-[0px_0px_0px_3px_#27292b]"
                />
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-sky border-3 border-charcoal rounded-lg p-4">
              <div className="text-2xl font-bold text-charcoal">{historyItems.length}</div>
              <div className="text-sm font-medium text-charcoal/70">Total Reviews</div>
            </div>
            <div className="bg-amber border-3 border-charcoal rounded-lg p-4">
              <div className="text-2xl font-bold text-charcoal">
                {Math.round(historyItems.reduce((acc, item) => acc + item.reviewResult.score, 0) / historyItems.length) || 0}
              </div>
              <div className="text-sm font-medium text-charcoal/70">Avg Score</div>
            </div>
            <div className="bg-coral border-3 border-charcoal rounded-lg p-4">
              <div className="text-2xl font-bold text-charcoal">
                {historyItems.reduce((acc, item) => acc + item.reviewResult.summary.critical, 0)}
              </div>
              <div className="text-sm font-medium text-charcoal/70">Critical Issues</div>
            </div>
            <div className="bg-soft-coral border-3 border-charcoal rounded-lg p-4">
              <div className="text-2xl font-bold text-charcoal">
                {new Set(historyItems.map(item => item.language)).size}
              </div>
              <div className="text-sm font-medium text-charcoal/70">Languages</div>
            </div>
          </div>

          {/* History Items */}
          <div className="space-y-4">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <HistoryCard
                  key={item.id}
                  item={item}
                  onClick={() => setSelectedItem(item)}
                  onDelete={handleDeleteItem}
                />
              ))
            ) : (
              <div className="bg-amber/20 border-3 border-charcoal rounded-lg p-8 text-center">
                <img
                  src="icons/history.svg"
                  alt=""
                  className="w-16 h-16 mx-auto mb-4 opacity-50"
                />
                <h3 className="text-xl font-bold text-charcoal mb-2">
                  {historyItems.length === 0 ? "No reviews yet" : "No history found"}
                </h3>
                <p className="text-charcoal/70 font-medium mb-4">
                  {historyItems.length === 0 
                    ? "Start by uploading and reviewing some code files. Your review history will appear here automatically!" 
                    : "Try adjusting your filters or refresh the history to see your past reviews."
                  }
                </p>
                {historyItems.length === 0 && (
                  <a 
                    href="/"
                    className="inline-block px-6 py-3 bg-sky border-3 border-charcoal rounded-lg font-bold text-charcoal hover:bg-sky/80 transition-colors shadow-[0px_4px_0px_0px_#27292b] hover:shadow-[0px_2px_0px_0px_#27292b] hover:translate-y-[2px]"
                  >
                    🚀 Start Reviewing Code
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* History Detail Modal */}
      {selectedItem && (
        <HistoryDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
}

// History Card Component
const HistoryCard: React.FC<HistoryCardProps> = ({ item, onClick, onDelete }) => {
  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-cream border-4 border-charcoal rounded-lg shadow-[0px_4px_0px_0px_#27292b] hover:shadow-[0px_2px_0px_0px_#27292b] hover:translate-y-[2px] transition-all duration-200">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <FileCode className="w-6 h-6 text-charcoal" />
            <div>
              <h3 className="text-lg font-bold text-charcoal">{item.filename}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs bg-charcoal text-cream px-2 py-1 rounded font-bold">
                  {item.language}
                </span>
                <span className={`text-xs ${reviewTypeColors[item.reviewType] || 'bg-amber'} text-charcoal px-2 py-1 rounded font-bold border-2 border-charcoal flex items-center gap-1`}>
                  {reviewTypeIcons[item.reviewType] || <FileCode className="w-4 h-4" />}
                  {item.reviewType}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
              className="p-2 bg-sky border-2 border-charcoal rounded font-bold text-charcoal hover:bg-sky/80 transition-colors"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item.id);
              }}
              className="p-2 bg-coral border-2 border-charcoal rounded font-bold text-charcoal hover:bg-coral/80 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className={`text-center p-3 rounded-lg border-2 border-charcoal ${getScoreColor(item.reviewResult.score) === 'text-green-600' ? 'bg-sky' : getScoreColor(item.reviewResult.score) === 'text-amber-600' ? 'bg-amber' : 'bg-coral'}`}>
            <div className="text-2xl font-bold text-charcoal">{item.reviewResult.score}</div>
            <div className="text-xs font-medium text-charcoal/70">Score</div>
          </div>
          <div className="text-center p-3 bg-coral/20 rounded-lg border-2 border-charcoal">
            <div className="text-lg font-bold text-charcoal">{item.reviewResult.summary.critical}</div>
            <div className="text-xs font-medium text-charcoal/70">Critical</div>
          </div>
          <div className="text-center p-3 bg-amber/20 rounded-lg border-2 border-charcoal">
            <div className="text-lg font-bold text-charcoal">{item.reviewResult.summary.warning}</div>
            <div className="text-xs font-medium text-charcoal/70">Warning</div>
          </div>
          <div className="text-center p-3 bg-sky/20 rounded-lg border-2 border-charcoal">
            <div className="text-lg font-bold text-charcoal">{item.reviewResult.summary.info}</div>
            <div className="text-xs font-medium text-charcoal/70">Info</div>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-charcoal/70">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatDate(item.timestamp)}
            </span>
            <span className="flex items-center gap-1">
              <FileCode className="w-4 h-4" />
              {formatFileSize(item.fileSize)}
            </span>
          </div>
          <span className="font-medium">{item.reviewResult.summary.totalIssues} issues found</span>
        </div>
      </div>
    </div>
  );
};

// History Detail Modal
const HistoryDetailModal: React.FC<HistoryDetailModalProps> = ({ item, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'suggestions'>('overview');

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 bg-charcoal/80 flex items-center justify-center p-4 z-50">
      <div className="bg-cream border-4 border-charcoal rounded-lg shadow-[0px_8px_0px_0px_#27292b] max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="bg-charcoal p-4 border-b-4 border-charcoal sticky top-0">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-cream flex items-center gap-2">
                <FileCode className="w-6 h-6" />
                {item.filename}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm bg-cream text-charcoal px-3 py-1 rounded-full font-bold">
                  {item.language}
                </span>
                <span className={`text-sm ${reviewTypeColors[item.reviewType] || 'bg-amber'} text-charcoal px-3 py-1 rounded-full font-bold border-2 border-charcoal flex items-center gap-1`}>
                  {reviewTypeIcons[item.reviewType] || <FileCode className="w-4 h-4" />}
                  {item.reviewType}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-cream hover:text-coral text-xl font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {/* Tabs */}
          <div className="flex border-b-3 border-charcoal mb-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 font-bold border-r-3 border-charcoal ${
                activeTab === 'overview'
                  ? 'bg-sky text-charcoal'
                  : 'bg-charcoal/10 text-charcoal hover:bg-sky/30'
              }`}
            >
              📊 Overview
            </button>
            <button
              onClick={() => setActiveTab('suggestions')}
              className={`px-6 py-3 font-bold ${
                activeTab === 'suggestions'
                  ? 'bg-amber text-charcoal'
                  : 'bg-charcoal/10 text-charcoal hover:bg-amber/30'
              }`}
            >
              💡 Suggestions ({item.reviewResult.suggestions.length})
            </button>
          </div>

          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Score and Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-sky border-3 border-charcoal rounded-lg p-6">
                  <h3 className="text-lg font-bold text-charcoal mb-4">Review Score</h3>
                  <div className="text-4xl font-bold text-charcoal">{item.reviewResult.score}/100</div>
                </div>
                <div className="bg-amber border-3 border-charcoal rounded-lg p-6">
                  <h3 className="text-lg font-bold text-charcoal mb-4">Issue Summary</h3>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-2xl font-bold text-charcoal">{item.reviewResult.summary.critical}</div>
                      <div className="text-xs text-charcoal/70">Critical</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-charcoal">{item.reviewResult.summary.warning}</div>
                      <div className="text-xs text-charcoal/70">Warning</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-charcoal">{item.reviewResult.summary.info}</div>
                      <div className="text-xs text-charcoal/70">Info</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Metadata */}
              <div className="bg-coral/20 border-3 border-charcoal rounded-lg p-6">
                <h3 className="text-lg font-bold text-charcoal mb-4">Review Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-bold text-charcoal">Reviewed:</span>{' '}
                    <span className="text-charcoal/80">{formatDate(item.timestamp)}</span>
                  </div>
                  <div>
                    <span className="font-bold text-charcoal">Model:</span>{' '}
                    <span className="text-charcoal/80">{item.reviewResult.metadata?.model}</span>
                  </div>
                  <div>
                    <span className="font-bold text-charcoal">Tokens Used:</span>{' '}
                    <span className="text-charcoal/80">{item.reviewResult.metadata?.tokensUsed}</span>
                  </div>
                  <div>
                    <span className="font-bold text-charcoal">File Size:</span>{' '}
                    <span className="text-charcoal/80">{(item.fileSize / 1024).toFixed(1)} KB</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'suggestions' && (
            <div className="space-y-4">
              {item.reviewResult.suggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className={`${severityColors[suggestion.severity as keyof typeof severityColors]} border-4 border-charcoal rounded-lg p-6`}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      {suggestionTypeIcons[suggestion.type as keyof typeof suggestionTypeIcons]}
                      {severityIcons[suggestion.severity as keyof typeof severityIcons]}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-lg font-bold text-charcoal">{suggestion.title}</h4>
                        <span className="text-xs bg-charcoal text-cream px-2 py-1 rounded font-bold">
                          Line {suggestion.line}
                        </span>
                        <span className="text-xs bg-charcoal text-cream px-2 py-1 rounded font-bold">
                          {suggestion.severity}
                        </span>
                        {suggestion.canAutoFix && (
                          <span className="text-xs bg-sky text-charcoal px-2 py-1 rounded font-bold">
                            Auto-fixable
                          </span>
                        )}
                      </div>
                      <p className="text-charcoal text-sm mb-4">{suggestion.description}</p>
                      <p className="text-charcoal/80 text-sm mb-4 font-medium">{suggestion.suggestion}</p>
                    </div>
                  </div>

                  {/* Code Snippets */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-sm font-bold text-charcoal mb-2">❌ Original</h5>
                      <div className="bg-charcoal rounded-lg p-3">
                        <pre className="text-cream text-xs font-mono leading-relaxed overflow-x-auto">
                          {suggestion.codeSnippet.original}
                        </pre>
                      </div>
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-charcoal mb-2">✅ Improved</h5>
                      <div className="bg-charcoal rounded-lg p-3">
                        <pre className="text-cream text-xs font-mono leading-relaxed overflow-x-auto">
                          {suggestion.codeSnippet.improved}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};