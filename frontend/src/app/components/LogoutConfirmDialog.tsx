import { AlertCircle } from 'lucide-react';
import { Button } from './ui/button';

interface LogoutConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function LogoutConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  isLoading = false
}: LogoutConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />
      
      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div 
          className="bg-white rounded-2xl p-8 max-w-sm shadow-xl pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start gap-4 mb-4">
            <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-orange-100">
              <AlertCircle className="h-6 w-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                Confirm Logout
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Are you sure you want to logout? You'll need to sign in again to access your account.
              </p>
            </div>
          </div>

          <div className="flex gap-3 justify-end mt-6">
            <Button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
            >
              {isLoading ? 'Logging out...' : 'Logout'}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
