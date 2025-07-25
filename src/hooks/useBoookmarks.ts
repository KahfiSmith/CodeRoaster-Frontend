// File: src/hooks/useBookmarks.ts
import { BookmarkCategory, BookmarkFilter, BookmarkItem, BookmarkSort } from '@/types';
import { useState, useEffect, useCallback, useMemo } from 'react';

// Custom hook untuk bookmark management
export const useBookmarks = (initialBookmarks: BookmarkItem[] = []) => {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>(initialBookmarks);
  const [filter, setFilter] = useState<BookmarkFilter>({
    category: 'all',
    language: 'all',
    searchTerm: '',
    tags: []
  });
  const [sort, setSort] = useState<BookmarkSort>({
    field: 'dateAdded',
    direction: 'desc'
  });

  // Load bookmarks from localStorage on mount
  useEffect(() => {
    const savedBookmarks = localStorage.getItem('codeRoaster_bookmarks');
    if (savedBookmarks) {
      try {
        const parsed = JSON.parse(savedBookmarks);
        setBookmarks(parsed);
      } catch (error) {
        console.error('Error loading bookmarks from localStorage:', error);
      }
    }
  }, []);

  // Save bookmarks to localStorage whenever bookmarks change
  useEffect(() => {
    localStorage.setItem('codeRoaster_bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  // Add new bookmark
  const addBookmark = useCallback((bookmark: Omit<BookmarkItem, 'id'>) => {
    const newBookmark: BookmarkItem = {
      ...bookmark,
      id: Date.now(), // Simple ID generation
      dateAdded: new Date().toISOString().split('T')[0],
      usageCount: 0
    };
    setBookmarks(prev => [newBookmark, ...prev]);
    return newBookmark.id;
  }, []);

  // Update existing bookmark
  const updateBookmark = useCallback((id: number, updates: Partial<BookmarkItem>) => {
    setBookmarks(prev => prev.map(bookmark => 
      bookmark.id === id ? { ...bookmark, ...updates } : bookmark
    ));
  }, []);

  // Delete bookmark
  const deleteBookmark = useCallback((id: number) => {
    setBookmarks(prev => prev.filter(bookmark => bookmark.id !== id));
  }, []);

  // Toggle bookmark status
  const toggleBookmark = useCallback((id: number) => {
    setBookmarks(prev => prev.map(bookmark => 
      bookmark.id === id 
        ? { ...bookmark, isBookmarked: !bookmark.isBookmarked }
        : bookmark
    ));
  }, []);

  // Increment usage count
  const incrementUsage = useCallback((id: number) => {
    setBookmarks(prev => prev.map(bookmark => 
      bookmark.id === id 
        ? { ...bookmark, usageCount: bookmark.usageCount + 1 }
        : bookmark
    ));
  }, []);

  // Filter and sort bookmarks
  const filteredAndSortedBookmarks = useMemo(() => {
    const filtered = bookmarks.filter(bookmark => {
      // Category filter
      if (filter.category !== 'all' && bookmark.category !== filter.category) {
        return false;
      }

      // Language filter
      if (filter.language !== 'all' && bookmark.language !== filter.language) {
        return false;
      }

      // Search term filter
      if (filter.searchTerm) {
        const searchLower = filter.searchTerm.toLowerCase();
        const matchesTitle = bookmark.title.toLowerCase().includes(searchLower);
        const matchesDescription = bookmark.description.toLowerCase().includes(searchLower);
        const matchesTags = bookmark.tags.some(tag => 
          tag.toLowerCase().includes(searchLower)
        );
        if (!matchesTitle && !matchesDescription && !matchesTags) {
          return false;
        }
      }

      // Tags filter
      if (filter.tags.length > 0) {
        const hasAllTags = filter.tags.every(filterTag =>
          bookmark.tags.some(bookmarkTag => 
            bookmarkTag.toLowerCase().includes(filterTag.toLowerCase())
          )
        );
        if (!hasAllTags) {
          return false;
        }
      }

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: string | number = a[sort.field];
      let bValue: string | number = b[sort.field];

      // Handle different data types
      if (sort.field === 'dateAdded') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sort.direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [bookmarks, filter, sort]);

  // Get categories with counts
  const categoriesWithCounts = useMemo(() => {
    const counts = bookmarks.reduce((acc, bookmark) => {
      acc[bookmark.category] = (acc[bookmark.category] || 0) + 1;
      return acc;
    }, {} as Record<BookmarkCategory, number>);

    return [
      { id: 'all', name: 'All Bookmarks', count: bookmarks.length },
      { id: 'best-practices', name: 'Best Practices', count: counts['best-practices'] || 0 },
      { id: 'security', name: 'Security', count: counts['security'] || 0 },
      { id: 'performance', name: 'Performance', count: counts['performance'] || 0 },
      { id: 'bugs', name: 'Bug Fixes', count: counts['bugs'] || 0 },
      { id: 'documentation', name: 'Documentation', count: counts['documentation'] || 0 }
    ];
  }, [bookmarks]);

  // Get available languages
  const availableLanguages = useMemo(() => {
    const languages = new Set(bookmarks.map(bookmark => bookmark.language));
    return ['all', ...Array.from(languages).sort()];
  }, [bookmarks]);

  // Get all tags
  const availableTags = useMemo(() => {
    const allTags = bookmarks.flatMap(bookmark => bookmark.tags);
    return Array.from(new Set(allTags)).sort();
  }, [bookmarks]);

  // Stats
  const stats = useMemo(() => {
    const totalBookmarks = bookmarks.length;
    
    // Most used category
    const categoryCounts = bookmarks.reduce((acc, bookmark) => {
      acc[bookmark.category] = (acc[bookmark.category] || 0) + 1;
      return acc;
    }, {} as Record<BookmarkCategory, number>);
    
    const mostUsedCategory = Object.entries(categoryCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] as BookmarkCategory;

    // Top languages
    const languageCounts = bookmarks.reduce((acc, bookmark) => {
      acc[bookmark.language] = (acc[bookmark.language] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topLanguages = Object.entries(languageCounts)
      .map(([language, count]) => ({ language, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Recently added
    const recentlyAdded = [...bookmarks]
      .sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime())
      .slice(0, 5);

    return {
      totalBookmarks,
      mostUsedCategory,
      topLanguages,
      recentlyAdded
    };
  }, [bookmarks]);

  return {
    // Data
    bookmarks: filteredAndSortedBookmarks,
    allBookmarks: bookmarks,
    categories: categoriesWithCounts,
    availableLanguages,
    availableTags,
    stats,
    
    // Current state
    filter,
    sort,
    
    // Actions
    addBookmark,
    updateBookmark,
    deleteBookmark,
    toggleBookmark,
    incrementUsage,
    
    // Filter actions
    setFilter,
    updateFilter: (updates: Partial<BookmarkFilter>) => 
      setFilter(prev => ({ ...prev, ...updates })),
    resetFilter: () => setFilter({
      category: 'all',
      language: 'all', 
      searchTerm: '',
      tags: []
    }),
    
    // Sort actions
    setSort,
    toggleSort: (field: BookmarkSort['field']) => {
      setSort(prev => ({
        field,
        direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
      }));
    }
  };
};

// Hook untuk search functionality
export const useBookmarkSearch = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // Load search history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('codeRoaster_searchHistory');
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading search history:', error);
      }
    }
  }, []);

  // Save search history
  useEffect(() => {
    localStorage.setItem('codeRoaster_searchHistory', JSON.stringify(searchHistory));
  }, [searchHistory]);

  const addToHistory = useCallback((term: string) => {
    if (term.trim() && !searchHistory.includes(term)) {
      setSearchHistory(prev => [term, ...prev.slice(0, 9)]); // Keep last 10
    }
  }, [searchHistory]);

  const clearHistory = useCallback(() => {
    setSearchHistory([]);
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    searchHistory,
    addToHistory,
    clearHistory
  };
};

export const useBookmarkModal = () => {
  const [selectedBookmark, setSelectedBookmark] = useState<BookmarkItem | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const openModal = useCallback((bookmark: BookmarkItem) => {
    setSelectedBookmark(bookmark);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setSelectedBookmark(null);
    setIsOpen(false);
  }, []);

  return {
    selectedBookmark,
    isOpen,
    openModal,
    closeModal
  };
};