import React, { useState } from "react";
import {
  FileCode,
  Bug,
  Zap,
  Shield,
  Code,
  Info,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { HistoryDetailModalProps } from "@/types";

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

export default HistoryDetailModal;
