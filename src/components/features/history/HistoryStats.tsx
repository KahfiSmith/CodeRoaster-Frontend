import React from "react";
import { HistoryItem } from "@/types";

interface HistoryStatsProps {
  historyItems: HistoryItem[];
}

const HistoryStats: React.FC<HistoryStatsProps> = ({ historyItems }) => {
  const totalReviews = historyItems.length;
  const avgScore = totalReviews > 0 
    ? Math.round(historyItems.reduce((acc, item) => acc + item.reviewResult.score, 0) / totalReviews) 
    : 0;
  const totalCriticalIssues = historyItems.reduce((acc, item) => acc + item.reviewResult.summary.critical, 0);
  const totalLanguages = new Set(historyItems.map(item => item.language)).size;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-sky border-3 border-charcoal rounded-lg p-4">
        <div className="text-2xl font-bold text-charcoal">{totalReviews}</div>
        <div className="text-sm font-medium text-charcoal/70">Total Reviews</div>
      </div>
      <div className="bg-amber border-3 border-charcoal rounded-lg p-4">
        <div className="text-2xl font-bold text-charcoal">{avgScore}</div>
        <div className="text-sm font-medium text-charcoal/70">Avg Score</div>
      </div>
      <div className="bg-coral border-3 border-charcoal rounded-lg p-4">
        <div className="text-2xl font-bold text-charcoal">{totalCriticalIssues}</div>
        <div className="text-sm font-medium text-charcoal/70">Critical Issues</div>
      </div>
      <div className="bg-soft-coral border-3 border-charcoal rounded-lg p-4">
        <div className="text-2xl font-bold text-charcoal">{totalLanguages}</div>
        <div className="text-sm font-medium text-charcoal/70">Languages</div>
      </div>
    </div>
  );
};

export default HistoryStats;
