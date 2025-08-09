import React from "react";
import {
  Filter,
  HistoryIcon,
  Download,
  Trash2,
} from "lucide-react";
import { HistoryFilter } from "@/types";

interface HistoryFiltersProps {
  filter: HistoryFilter;
  setFilter: React.Dispatch<React.SetStateAction<HistoryFilter>>;
  onRefreshHistory: () => void;
  onExportHistory: () => void;
  onClearAllHistory: () => void;
}

const HistoryFilters: React.FC<HistoryFiltersProps> = ({
  filter,
  setFilter,
  onRefreshHistory,
  onExportHistory,
  onClearAllHistory,
}) => {
  return (
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
            onClick={onRefreshHistory}
            className="w-full p-2 bg-sky border-2 border-charcoal rounded font-bold text-charcoal hover:bg-sky/80 transition-colors flex items-center gap-2 justify-center"
          >
            <HistoryIcon className="w-4 h-4" />
            Refresh History
          </button>
          <button
            onClick={onExportHistory}
            className="w-full p-2 bg-amber border-2 border-charcoal rounded font-bold text-charcoal hover:bg-amber/80 transition-colors flex items-center gap-2 justify-center"
          >
            <Download className="w-4 h-4" />
            Export History
          </button>
          <button
            onClick={onClearAllHistory}
            className="w-full p-2 bg-coral border-2 border-charcoal rounded font-bold text-charcoal hover:bg-coral/80 transition-colors flex items-center gap-2 justify-center"
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </button>
        </div>
      </div>
    </div>
  );
};

export default HistoryFilters;
