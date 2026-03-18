import { AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { useEffect } from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  isDangerous?: boolean;
  autoClose?: boolean;
  closeDelay?: number; // ms
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  isLoading = false,
  isDangerous = false,
  autoClose = false,
  closeDelay = 3000
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  // Auto-close after delay if enabled
  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        onCancel();
      }, closeDelay);
      return () => clearTimeout(timer);
    }
  }, [autoClose, closeDelay, onCancel]);

  const confirmButtonColor = isDangerous ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-600 hover:bg-orange-700';

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-start justify-center pt-20">
      {/* Dialog - No backdrop blur, clean popup */}
      <div 
        className="bg-white rounded-2xl p-8 max-w-sm shadow-2xl pointer-events-auto border border-orange-100"
        onClick={(e) => e.stopPropagation()}
      >
          <div className="flex items-start gap-4 mb-4">
            <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-orange-100">
              <AlertCircle className="h-6 w-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {title}
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                {message}
              </p>
            </div>
          </div>

          {!autoClose && (
            <div className="flex gap-3 justify-end mt-6">
              <Button
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                {cancelLabel}
              </Button>
              {onConfirm && (
                <Button
                  type="button"
                  onClick={onConfirm}
                  disabled={isLoading}
                  className={`px-4 py-2 text-white rounded-lg disabled:opacity-50 ${confirmButtonColor}`}
                >
                  {confirmLabel}
                </Button>
              )}
            </div>
          )}
        </div>
    </div>
  );
}
