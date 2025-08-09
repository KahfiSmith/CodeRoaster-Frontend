import { useState, useMemo } from 'react';
import { HistoryItem, HistoryFilter } from '@/types';

export const useHistoryFilters = (historyItems: HistoryItem[]) => {
  const [filter, setFilter] = useState<HistoryFilter>({
    searchTerm: "",
    language: "all",
    reviewType: "all",
    severity: "all",
    dateRange: "all",
  });

  const filteredItems = useMemo(() => {
    return historyItems.filter((item) => {
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
  }, [historyItems, filter]);

  return {
    filter,
    setFilter,
    filteredItems,
  };
};
