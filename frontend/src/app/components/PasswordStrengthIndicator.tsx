import React from 'react';
import { getPasswordStrength } from '../../utils/validators';

interface PasswordStrengthIndicatorProps {
  password: string;
  showRequirements?: boolean;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  showRequirements = true,
}) => {
  const strength = getPasswordStrength(password);
  
  const strengthColors = {
    weak: 'bg-red-500',
    fair: 'bg-yellow-500',
    good: 'bg-blue-500',
    strong: 'bg-green-500',
  };
  
  const strengthLabels = {
    weak: 'Weak',
    fair: 'Fair',
    good: 'Good',
    strong: 'Strong',
  };
  
  const strengthPercentages = {
    weak: 25,
    fair: 50,
    good: 75,
    strong: 100,
  };

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-2">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${strengthColors[strength]}`}
            style={{ width: `${strengthPercentages[strength]}%` }}
          />
        </div>
        <span className={`text-xs font-semibold ${strengthColors[strength].replace('bg-', 'text-')}`}>
          {strengthLabels[strength]}
        </span>
      </div>
      
      {showRequirements && (
        <div className="text-xs space-y-1 text-gray-600">
          <p className="font-semibold">Password must include:</p>
          <ul className="pl-4 space-y-1">
            <li className={/\d/.test(password) ? 'text-green-600' : ''}>
              {/\d/.test(password) ? '✓' : '○'} At least one number (0-9)
            </li>
            <li className={/[!@#$%^&*()_+\-=\[\]{}⌖:";'|,.<>?/\\]/.test(password) ? 'text-green-600' : ''}>
              {/[!@#$%^&*()_+\-=\[\]{}⌖:";'|,.<>?/\\]/.test(password) ? '✓' : '○'} At least one special character (!@#$%^&*)
            </li>
            <li className={/[A-Z]/.test(password) ? 'text-green-600' : ''}>
              {/[A-Z]/.test(password) ? '✓' : '○'} At least one uppercase letter (A-Z)
            </li>
            <li className={/[a-z]/.test(password) ? 'text-green-600' : ''}>
              {/[a-z]/.test(password) ? '✓' : '○'} At least one lowercase letter (a-z)
            </li>
            <li className={password.length >= 8 ? 'text-green-600' : ''}>
              {password.length >= 8 ? '✓' : '○'} At least 8 characters
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};
