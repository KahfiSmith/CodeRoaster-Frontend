import { useState } from "react";
import {
  History as HistoryIcon,
  Search,
} from "lucide-react";
import { Header } from "@/components/layout";
import { 
  HistoryCard, 
  HistoryDetailModal, 
  HistoryFilters, 
  HistoryStats, 
  HistoryEmptyState 
} from "@/components/features";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { useHistoryManagement, useHistoryFilters } from "@/hooks";
import { HistoryItem } from "@/types";
 

export default function History() {
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);
  
  // Use custom hooks for history management
  const {
    historyItems,
    deleteItem: handleDeleteItem,
    clearAllHistory,
    refreshHistory,
    exportHistory,
  } = useHistoryManagement();
  
  // Use custom hook for filtering
  const { filter, setFilter, filteredItems } = useHistoryFilters(historyItems);

  // Handle clear all history with custom modal
  const handleClearAllHistory = () => {
    setShowClearConfirmation(true);
  };

  const handleConfirmClear = () => {
    clearAllHistory(true); // Skip confirmation since we handled it
    setShowClearConfirmation(false);
  };

  return (
    <div className="bg-cream min-h-screen p-8">
      
      <Header />

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters */}
        <div className="w-full lg:w-1/4">
          <HistoryFilters
            filter={filter}
            setFilter={setFilter}
            onRefreshHistory={refreshHistory}
            onExportHistory={exportHistory}
            onClearAllHistory={handleClearAllHistory}
          />
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
          <HistoryStats historyItems={historyItems} />

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
              <HistoryEmptyState totalItems={historyItems.length} />
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

      {/* Clear All History Confirmation Modal */}
      <ConfirmationModal
        isOpen={showClearConfirmation}
        onClose={() => setShowClearConfirmation(false)}
        onConfirm={handleConfirmClear}
        title="Clear All History"
        message="Are you sure you want to delete all your review history? This will permanently remove all stored reviews and cannot be undone. Your coding journey will start fresh!"
        confirmText="Yes, Clear All"
        cancelText="Keep History"
        variant="danger"
        icon="trash"
      />
    </div>
  );
}