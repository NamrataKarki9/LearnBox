import React, { useEffect, useState } from 'react';

interface FieldErrorProps {
  error?: string;
  className?: string;
  autoHideDuration?: number; // in milliseconds, default 3000
}

export const FieldError: React.FC<FieldErrorProps> = ({ 
  error, 
  className = '',
  autoHideDuration = 3000 
}) => {
  const [displayError, setDisplayError] = useState(error);

  useEffect(() => {
    if (error) {
      setDisplayError(error);
      const timer = setTimeout(() => {
        setDisplayError("");
      }, autoHideDuration);
      
      return () => clearTimeout(timer);
    } else {
      setDisplayError("");
    }
  }, [error, autoHideDuration]);

  if (!displayError) return null;

  return (
    <span className={`text-sm text-red-600 font-medium block mt-1 ${className}`}>
      {displayError}
    </span>
  );
};

interface FieldSuccessProps {
  message?: string;
  className?: string;
}

export const FieldSuccess: React.FC<FieldSuccessProps> = ({ message, className = '' }) => {
  if (!message) return null;

  return (
    <span className={`text-sm text-green-600 font-medium block mt-1 ${className}`}>
      {message}
    </span>
  );
};

interface FieldHintProps {
  hint?: string;
  className?: string;
}

export const FieldHint: React.FC<FieldHintProps> = ({ hint, className = '' }) => {
  if (!hint) return null;

  return (
    <span className={`text-xs text-gray-500 block mt-1 ${className}`}>
      {hint}
    </span>
  );
};
