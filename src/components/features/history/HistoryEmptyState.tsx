import React from "react";

interface HistoryEmptyStateProps {
  totalItems: number;
}

const HistoryEmptyState: React.FC<HistoryEmptyStateProps> = ({ totalItems }) => {
  const isEmpty = totalItems === 0;

  return (
    <div className="bg-amber/20 border-3 border-charcoal rounded-lg p-8 text-center">
      <img
        src="icons/history.svg"
        alt=""
        className="w-16 h-16 mx-auto mb-4 opacity-50"
      />
      <h3 className="text-xl font-bold text-charcoal mb-2">
        {isEmpty ? "No reviews yet" : "No history found"}
      </h3>
      <p className="text-charcoal/70 font-medium mb-4">
        {isEmpty 
          ? "Start by uploading and reviewing some code files. Your review history will appear here automatically!" 
          : "Try adjusting your filters or refresh the history to see your past reviews."
        }
      </p>
      {isEmpty && (
        <a 
          href="/"
          className="inline-block px-6 py-3 bg-sky border-3 border-charcoal rounded-lg font-bold text-charcoal hover:bg-sky/80 transition-colors shadow-[0px_4px_0px_0px_#27292b] hover:shadow-[0px_2px_0px_0px_#27292b] hover:translate-y-[2px]"
        >
          🚀 Start Reviewing Code
        </a>
      )}
    </div>
  );
};

export default HistoryEmptyState;
