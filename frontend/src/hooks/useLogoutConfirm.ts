import { useState, useCallback } from 'react';

export function useLogoutConfirm() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  let confirmCallback: (() => void) | null = null;

  const openConfirm = useCallback((onConfirm: () => void) => {
    confirmCallback = onConfirm;
    setIsOpen(true);
  }, []);

  const onConfirm = useCallback(() => {
    setIsLoading(true);
    if (confirmCallback) {
      confirmCallback();
    }
    setIsOpen(false);
    setIsLoading(false);
  }, []);

  const onCancel = useCallback(() => {
    setIsOpen(false);
    confirmCallback = null;
  }, []);

  return {
    isOpen,
    isLoading,
    openConfirm,
    onConfirm,
    onCancel
  };
}
