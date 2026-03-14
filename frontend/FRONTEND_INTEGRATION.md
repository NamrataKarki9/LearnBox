# Frontend Integration Guide

## Overview of Backend Changes

All student-related authentication and user management endpoints have been enhanced with comprehensive error handling. The changes are **100% backward compatible** - existing functionality remains unchanged, but responses now include more detailed error information.

---

## Key Changes Summary

### 1. Response Format
All endpoints now return a consistent response structure with a `success` flag:

```typescript
// Success Response
interface SuccessResponse {
  success: true;
  message: string;
  data?: any;
  tokens?: {
    access: string;
    refresh: string;
  };
}

// Error Response
interface ErrorResponse {
  success: false;
  error: string;              // User-friendly error message
  field?: string;             // Which field caused the error (for validation)
  details?: string;           // Technical details (dev mode only)
}
```

### 2. Error Identification
Errors now come in three types:

```typescript
// Type 1: Validation Error (specific field is wrong)
if (response.field) {
  setFieldError(response.field, response.error);
}

// Type 2: Authentication Error (credentials issue)
if (response.error.includes('Incorrect password')) {
  showLoginError(response.error);
}

// Type 3: Generic Error (server issue)
if (!response.success && !response.field && !response.error.includes('Incorrect')) {
  toast.error(response.error);
}
```

### 3. HTTP Status Codes
Proper HTTP status codes are now returned:

| Status | Meaning | Common Scenario |
|--------|---------|-----------------|
| 200 | Success | Login successful, profile updated |
| 201 | Created | User registered successfully |
| 400 | Bad Request | Invalid input (validation error) |
| 401 | Unauthorized | Wrong credentials, token expired |
| 403 | Forbidden | Account not verified, deactivated |
| 404 | Not Found | User/resource doesn't exist |
| 409 | Conflict | Email/username already exists |
| 500 | Server Error | Database or server issue |

---

## Frontend Migration Guide

### Before (Old Response Handling)
```typescript
const handleLogin = async (email: string, password: string) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();
  
  // Had to guess what error meant
  if (!data.success) {
    toast.error('Login failed'); // Generic message
  } else {
    localStorage.setItem('accessToken', data.tokens.access);
  }
};
```

### After (New Response Handling)
```typescript
const handleLogin = async (email: string, password: string) => {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    
    if (data.success) {
      // Success case
      localStorage.setItem('accessToken', data.tokens.access);
      localStorage.setItem('refreshToken', data.tokens.refresh);
      toast.success(data.message);
      navigate('/dashboard');
    } else {
      // Error case - now you know exactly what went wrong
      if (data.field) {
        // Validation error - highlight the field
        setFieldError(data.field, data.error);
      } else {
        // Other error - show as toast
        toast.error(data.error);
      }
    }
  } catch (error) {
    toast.error('Connection error. Please try again.');
  }
};
```

---

## Common Patterns to Update

### Pattern 1: Form Validation Feedback

**Registration Form**
```typescript
import { useState } from 'react';
import { toast } from 'react-toastify'; // or your toast library

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFieldErrors({}); // Clear previous errors
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Registration successful! Check your email for verification code.');
        // Navigate to verification page
      } else if (data.field) {
        // IMPORTANT: Set error on specific field
        setFieldErrors(prev => ({
          ...prev,
          [data.field]: data.error
        }));
        // Optionally show toast as well
        toast.warning(data.error);
      } else {
        toast.error(data.error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Username</label>
        <input
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          className={fieldErrors.username ? 'input-error' : ''}
        />
        {fieldErrors.username && (
          <span className="error-text">{fieldErrors.username}</span>
        )}
      </div>

      <div>
        <label>Email</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className={fieldErrors.email ? 'input-error' : ''}
        />
        {fieldErrors.email && (
          <span className="error-text">{fieldErrors.email}</span>
        )}
      </div>

      <div>
        <label>Password</label>
        <input
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          className={fieldErrors.password ? 'input-error' : ''}
        />
        {fieldErrors.password && (
          <span className="error-text">{fieldErrors.password}</span>
        )}
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Registering...' : 'Register'}
      </button>
    </form>
  );
};

export default RegisterForm;
```

### Pattern 2: Authentication Context

```typescript
import React, { createContext, useContext, useState, useCallback } from 'react';

interface AuthContextType {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  user: any;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [tokens, setTokens] = useState({
    access: localStorage.getItem('accessToken'),
    refresh: localStorage.getItem('refreshToken')
  });

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!data.success) {
        // Let component handle error display
        throw new Error(data.error);
      }

      // Store tokens
      localStorage.setItem('accessToken', data.tokens.access);
      localStorage.setItem('refreshToken', data.tokens.refresh);
      
      setTokens(data.tokens);
      setUser(data.user);
      
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setTokens({ access: null, refresh: null });
  }, []);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/token/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: tokens.refresh })
      });

      const data = await response.json();

      if (!data.success) {
        logout();
        return false;
      }

      localStorage.setItem('accessToken', data.tokens.access);
      setTokens(data.tokens);
      return true;
    } catch {
      logout();
      return false;
    }
  }, [tokens.refresh, logout]);

  return (
    <AuthContext.Provider
      value={{
        login,
        logout,
        refresh,
        isAuthenticated: !!user,
        user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### Pattern 3: API Service Layer

```typescript
// services/api.ts

interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  requiresAuth?: boolean;
}

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  error?: string;
  field?: string;
  data?: T;
  tokens?: {
    access: string;
    refresh: string;
  };
}

export class ApiError extends Error {
  constructor(
    public message: string,
    public field?: string,
    public status?: number,
    public details?: any
  ) {
    super(message);
  }
}

export const apiCall = async <T = any>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> => {
  const {
    method = 'GET',
    body,
    requiresAuth = false
  } = options;

  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };

  if (requiresAuth) {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      throw new ApiError('Authentication required', undefined, 401);
    }
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`http://localhost:5000${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });

    const data: ApiResponse<T> = await response.json();

    if (!data.success) {
      // Throw structured error for easy handling
      throw new ApiError(
        data.error,
        data.field,
        response.status,
        data.details
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Network error. Please try again.', undefined, 0);
  }
};

// Usage in components
const handleRegister = async (formData) => {
  try {
    const response = await apiCall('/api/auth/register', {
      method: 'POST',
      body: formData
    });
    
    toast.success(response.message);
    // Handle success
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.field) {
        setFieldError(error.field, error.message);
      } else {
        toast.error(error.message);
      }
    }
  }
};
```

---

## Password Requirements

Users should be informed of these requirements:
- **Minimum 8 characters**
- **At least one number** (0-9)
- **At least one special character** (!@#$%^&*()_+-=[]{}⌖:";'|,.<>?/)

Update your password input component to show these requirements:

```typescript
const PasswordInput = ({ value, onChange, showRequirements = true }) => {
  const requirements = {
    length: value.length >= 8,
    number: /\d/.test(value),
    special: /[!@#$%^&*()_+\-=\[\]{}⌖:";'|,.<>?/]/.test(value)
  };

  const isValid = Object.values(requirements).every(req => req);

  return (
    <div>
      <input
        type="password"
        value={value}
        onChange={onChange}
        placeholder="Enter password"
        className={isValid ? 'valid' : 'invalid'}
      />
      
      {showRequirements && (
        <div className="requirements">
          <p>Password must contain:</p>
          <div className={requirements.length ? 'met' : 'unmet'}>
            ✓ At least 8 characters
          </div>
          <div className={requirements.number ? 'met' : 'unmet'}>
            ✓ At least one number (0-9)
          </div>
          <div className={requirements.special ? 'met' : 'unmet'}>
            ✓ At least one special character (!@#$%^&*)
          </div>
        </div>
      )}
    </div>
  );
};
```

---

## Email Validation

Emails are now validated server-side. Frontend should also validate:

```typescript
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Usage
const [emailError, setEmailError] = useState('');

const handleEmailChange = (e) => {
  const email = e.target.value;
  setFormData({ ...formData, email });
  
  if (email && !validateEmail(email)) {
    setEmailError('Please enter a valid email address.');
  } else {
    setEmailError('');
  }
};
```

---

## Token Management

### Access Token Refresh
When access token expires (401 response):

```typescript
const refreshAccessToken = async () => {
  try {
    const response = await apiCall('/api/auth/token/refresh', {
      method: 'POST',
      body: {
        refresh: localStorage.getItem('refreshToken')
      }
    });

    localStorage.setItem('accessToken', response.tokens.access);
    return true;
  } catch (error) {
    // Refresh failed - redirect to login
    logout();
    return false;
  }
};

// Add retry logic to API calls
const apiCallWithRetry = async (endpoint, options) => {
  try {
    return await apiCall(endpoint, options);
  } catch (error) {
    if (error.status === 401) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        return apiCall(endpoint, options); // Retry
      }
    }
    throw error;
  }
};
```

---

## Testing Your Integration

### Test Checklist

- [ ] Registration with valid data succeeds
- [ ] Registration shows field errors for invalid inputs
- [ ] Registration prevents weak passwords
- [ ] Login works with correct credentials
- [ ] Login rejects wrong password
- [ ] Profile update shows field errors
- [ ] Password change validation works
- [ ] Field errors highlight correct input
- [ ] Success toasts show meaningful messages
- [ ] Error messages are user-friendly
- [ ] Token refresh works on 401

### Example Test Data

```typescript
const testAccounts = {
  valid: {
    email: 'test@example.com',
    password: 'TestPass123!',
    username: 'testuser'
  },
  invalid: {
    password: 'weak', // Missing numbers and special chars
    email: 'not-an-email',
    otp: '123' // Should be 6 digits
  }
};

// In your test
test('shows field error for invalid email', async () => {
  const { getByText, getByRole } = render(<RegisterForm />);
  
  const submitButton = getByRole('button', { name: /register/i });
  fireEvent.click(submitButton);
  
  // Should show error on email field
  expect(getByText('Please enter a valid email address.')).toBeInTheDocument();
});
```

---

## Troubleshooting

### Issue: "Token expired" errors
**Solution:** Implement token refresh as shown above. Check that refresh token is being stored.

### Issue: Field errors not showing
**Solution:** Make sure you're checking `response.field` after failed requests and mapping errors to the correct field names.

### Issue: Users see generic "Failed" messages
**Solution:** Always use `response.error` string from backend instead of hardcoded messages.

### Issue: Password validation keeps failing
**Solution:** Ensure password has:
- 8+ characters
- At least one digit (0-9)
- At least one special character (!@#$%^&*()_+...)

### Issue: CORS errors
**Solution:** Make sure API_URL in your frontend config is `http://localhost:5000` (or correct server URL).

---

## Performance Tips

1. **Debounce email checks** - Don't check if email exists on every keystroke
2. **Cache user data** - Store user profile in Redux/Context to avoid repeated GET /me calls
3. **Use React Query or SWR** - For automatic caching and refetching
4. **Implement error boundaries** - Catch authentication errors globally

---

## Support

For questions about the new error handling:
1. Check [ERROR_HANDLING_GUIDE.md](./ERROR_HANDLING_GUIDE.md) for detailed endpoint documentation
2. See [API_TEST_CASES.md](./API_TEST_CASES.md) for test examples
3. Review the controller files in `src/controllers/` for implementation details

