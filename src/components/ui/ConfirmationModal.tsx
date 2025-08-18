import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  icon?: 'trash' | 'warning' | 'alert';
}

export const ConfirmationModal = React.memo(({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = 'danger',
  icon = 'warning'
}: ConfirmationModalProps) => {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          iconBg: 'bg-coral/20',
          iconColor: 'text-coral',
          confirmBg: 'bg-coral hover:bg-coral/80',
          confirmText: 'text-charcoal'
        };
      case 'warning':
        return {
          iconBg: 'bg-amber/20',
          iconColor: 'text-amber',
          confirmBg: 'bg-amber hover:bg-amber/80',
          confirmText: 'text-charcoal'
        };
      case 'info':
        return {
          iconBg: 'bg-sky/20',
          iconColor: 'text-sky',
          confirmBg: 'bg-sky hover:bg-sky/80',
          confirmText: 'text-charcoal'
        };
      default:
        return {
          iconBg: 'bg-coral/20',
          iconColor: 'text-coral',
          confirmBg: 'bg-coral hover:bg-coral/80',
          confirmText: 'text-charcoal'
        };
    }
  };

  const getIcon = () => {
    switch (icon) {
      case 'trash':
        return <Trash2 className="w-6 h-6" />;
      case 'alert':
        return <AlertTriangle className="w-6 h-6" />;
      default:
        return <AlertTriangle className="w-6 h-6" />;
    }
  };

  const styles = getVariantStyles();

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter') {
      onConfirm();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-charcoal/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <div className="bg-cream border-4 border-charcoal rounded-lg shadow-[0px_8px_0px_0px_#27292b] max-w-md w-full mx-4 animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-charcoal p-4 border-b-4 border-charcoal">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg border-3 border-charcoal ${styles.iconBg}`}>
                <div className={styles.iconColor}>
                  {getIcon()}
                </div>
              </div>
              <h3 id="modal-title" className="text-xl font-bold text-cream">
                {title}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-cream hover:text-coral text-xl font-bold p-1 rounded transition-colors"
              aria-label="Close modal"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 bg-cream">
          <p id="modal-description" className="text-charcoal/80 leading-relaxed font-medium">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 p-6 bg-cream border-t-4 border-charcoal">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-charcoal/10 text-charcoal font-bold border-3 border-charcoal rounded-lg hover:bg-charcoal/20 transition-all duration-200"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-6 py-2 font-bold border-3 border-charcoal rounded-lg transition-all duration-200 
              shadow-[2px_2px_0px_0px_#27292b] 
              hover:shadow-[1px_1px_0px_0px_#27292b] 
              hover:translate-x-[1px] hover:translate-y-[1px] 
              active:shadow-none active:translate-x-[2px] active:translate-y-[2px] 
              ${styles.confirmBg} ${styles.confirmText}`}
            autoFocus
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
});