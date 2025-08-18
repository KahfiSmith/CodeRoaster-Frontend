import React from "react";
import {
  FileCode,
  Calendar,
  Eye,
  Trash2,
  Shield,
  Zap,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { HistoryCardProps } from "@/types";

const reviewTypeColors = {
  codeQuality: "bg-sky",
  security: "bg-coral",
  bestPractices: "bg-amber",
  sarcastic: "bg-soft-coral",
  brutal: "bg-coral",
  encouraging: "bg-sky",
} as const;

const reviewTypeIcons = {
  codeQuality: <FileCode className="w-4 h-4" />,
  security: <Shield className="w-4 h-4" />,
  bestPractices: <Zap className="w-4 h-4" />,
  sarcastic: <FileCode className="w-4 h-4" />,
  brutal: <AlertTriangle className="w-4 h-4" />,
  encouraging: <CheckCircle className="w-4 h-4" />,
} as const;

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

export default React.memo(HistoryCard);
