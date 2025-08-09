import { useState, useEffect } from 'react';
import { HistoryItem } from '@/types';

// Sample data that was in the original component
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

export const useHistoryManagement = () => {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);

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

  const deleteItem = (id: string) => {
    setHistoryItems(prev => prev.filter(item => item.id !== id));
  };

  const clearAllHistory = (skipConfirmation = false) => {
    if (skipConfirmation) {
      setHistoryItems([]);
      localStorage.removeItem('codeRoaster_history');
    } else {
      // Return callback for external confirmation handling
      return () => {
        setHistoryItems([]);
        localStorage.removeItem('codeRoaster_history');
      };
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

  return {
    historyItems,
    deleteItem,
    clearAllHistory,
    refreshHistory,
    exportHistory,
  };
};
