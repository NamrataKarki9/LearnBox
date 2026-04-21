import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { invitationAPI } from '../../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle, Lock, User, Building2, Eye, EyeOff } from 'lucide-react';
import { validateUsername, validatePassword } from '../../utils/validators';

export default function InvitationAcceptPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [validationState, setValidationState] = useState<
    'loading' | 'valid' | 'invalid' | 'registering' | 'success'
  >('loading');
  const [invitation, setInvitation] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    firstName: '',
    lastName: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const nameRegex = /^[a-zA-Z\s'-]+$/;

  // Validate invitation token on mount
  useEffect(() => {
    const validateToken = async () => {
      console.log('\n========== INVITATION VALIDATION START ==========');
      console.log('Token from URL:', token);
      
      if (!token) {
        console.log('❌ No token provided in URL');
        setValidationState('invalid');
        setError('No invitation token provided');
        return;
      }

      try {
        console.log('🔗 Step 1: Calling validateToken API with token:', token?.substring(0, 16) + '...');
        const response = await invitationAPI.validateToken(token);
        
        console.log('📦 Step 2: Got response object:', {
          status: response.status,
          statusText: response.statusText,
          hasData: !!response.data,
          dataKeys: response.data ? Object.keys(response.data) : 'N/A'
        });
        
        const responseData = response.data || response;
        console.log('📦 Step 3: Response data after extraction:', responseData);
        console.log('📦 Step 4: Checking success and invitation:', {
          success: responseData?.success,
          hasInvitation: !!responseData?.invitation,
          invitationKeys: responseData?.invitation ? Object.keys(responseData.invitation) : 'N/A'
        });

        if (responseData?.success === true && responseData?.invitation) {
          console.log('✅ Validation PASSED! Setting valid state');
          setInvitation(responseData.invitation);
          setValidationState('valid');
        } else {
          console.log('❌ Validation FAILED:');
          console.log('   - success:', responseData?.success);
          console.log('   - error:', responseData?.error);
          console.log('   - message:', responseData?.message);
          setValidationState('invalid');
          setError(responseData?.error || responseData?.message || 'Invalid or expired invitation');
        }
      } catch (error: any) {
        console.error('❌ Exception during validation:');
        console.error('   - Error type:', error.constructor.name);
        console.error('   - Error message:', error?.message);
        console.error('   - Response status:', error?.response?.status);
        console.error('   - Response data:', error?.response?.data);
        
        setValidationState('invalid');
        const errorMsg = error?.response?.data?.error || 
                        error?.response?.data?.message ||
                        error?.message ||
                        'Failed to validate invitation. Check browser console for details.';
        setError(errorMsg);
      } finally {
        console.log('========== INVITATION VALIDATION END ==========\n');
      }
    };

    validateToken();
  }, [token]);

  const validateNameField = (value: string, label: string) => {
    if (!value.trim()) {
      return '';
    }

    if (!nameRegex.test(value.trim())) {
      return `${label} looks invalid.`;
    }

    return '';
  };

  const validateField = (field: string, value: string) => {
    switch (field) {
      case 'username': {
        const validation = validateUsername(value);
        if (!validation.valid) {
          return value.trim()
            ? 'Choose a valid username.'
            : 'Enter your username.';
        }
        return '';
      }
      case 'password': {
        const validation = validatePassword(value);
        if (!validation.valid) {
          if (!value) return 'Enter your password.';
          return validation.errors[0] || 'Use a stronger password.';
        }
        return '';
      }
      case 'firstName':
        return validateNameField(value, 'First name');
      case 'lastName':
        return validateNameField(value, 'Last name');
      default:
        return '';
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {
      username: validateField('username', formData.username),
      password: validateField('password', formData.password),
      firstName: validateField('firstName', formData.firstName),
      lastName: validateField('lastName', formData.lastName),
    };

    Object.keys(newErrors).forEach((key) => {
      if (!newErrors[key]) {
        delete newErrors[key];
      }
    });

    setFormErrors(newErrors);

    const firstError = Object.values(newErrors)[0];
    if (firstError) {
      toast.error(firstError);
      return false;
    }

    return true;
  };

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (formErrors[field]) {
      const nextError = validateField(field, value);
      setFormErrors((prev) => ({ ...prev, [field]: nextError }));
    }
  };

  const handleFieldBlur = (field: keyof typeof formData) => {
    const nextError = validateField(field, formData[field]);
    setFormErrors((prev) => ({ ...prev, [field]: nextError }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setValidationState('registering');

    try {
      const response = await invitationAPI.acceptAndRegister({
        token: token!,
        username: formData.username.trim(),
        password: formData.password,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim()
      });

      const responseData = response.data || response;

      if (responseData.success) {
        setValidationState('success');
        toast.success(responseData.message || 'Registration completed! Redirecting to login...');
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setValidationState('valid');
        toast.error(responseData.error || 'Registration failed');
      }
    } catch (error: any) {
      console.error('Error registering:', error);
      setValidationState('valid');
      const field = error?.response?.data?.field;
      const errorMessage =
        error?.response?.data?.error ||
        'Could not complete registration.';

      if (field && field !== 'token' && field !== 'server') {
        setFormErrors((prev) => ({ ...prev, [field]: errorMessage }));
      }

      toast.error(
        errorMessage
      );
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6">
      <Card className="w-full max-w-md border-border shadow-sm">
        <CardHeader className="space-y-3 border-b text-center">
          <div className="flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border bg-muted/40">
              <Building2 className="h-6 w-6 text-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-semibold tracking-tight">College Admin Registration</CardTitle>
          <CardDescription className="text-sm">
            Complete your registration to become a College Admin
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          {/* Loading State */}
          {validationState === 'loading' && (
            <div className="space-y-4 text-center py-8">
              <div className="inline-block">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">Validating your invitation...</p>
            </div>
          )}

          {/* Invalid State */}
          {validationState === 'invalid' && (
            <div className="space-y-4 py-8">
              <div className="space-y-2 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                <div className="flex gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground">Invalid Invitation</p>
                    <p className="mt-1 text-sm text-muted-foreground">{error}</p>
                  </div>
                </div>
              </div>
              <Button onClick={() => navigate('/login')} className="w-full">
                Back to Login
              </Button>
            </div>
          )}

          {/* Registration Form State */}
          {validationState === 'valid' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Invitation Info */}
              <div className="space-y-2 rounded-lg border bg-muted/30 p-4">
                <p className="text-sm font-semibold text-foreground">Invitation Details</p>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>
                    <span className="font-medium">To:</span> {invitation?.inviteeEmail}
                  </p>
                  <p>
                    <span className="font-medium">College:</span> {invitation?.college?.name}
                  </p>
                  <p className="text-xs">
                    Expires: {new Date(invitation?.expiresAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Username *
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Choose your username"
                  value={formData.username}
                  onChange={(e) => updateField('username', e.target.value)}
                  onBlur={() => handleFieldBlur('username')}
                  autoComplete="username"
                  aria-invalid={!!formErrors.username}
                />
                {formErrors.username && (
                  <p className="text-sm text-destructive">{formErrors.username}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Password *
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create your password"
                    value={formData.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    onBlur={() => handleFieldBlur('password')}
                    autoComplete="new-password"
                    aria-invalid={!!formErrors.password}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {formErrors.password && (
                  <p className="text-sm text-destructive">{formErrors.password}</p>
                )}

                <p className="text-xs text-muted-foreground">
                  Use 8+ characters with uppercase, lowercase, a number, and a symbol.
                </p>
              </div>

              {/* First Name */}
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name (Optional)</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="First name"
                  value={formData.firstName}
                  onChange={(e) => updateField('firstName', e.target.value)}
                  onBlur={() => handleFieldBlur('firstName')}
                  autoComplete="given-name"
                  aria-invalid={!!formErrors.firstName}
                />
                {formErrors.firstName && (
                  <p className="text-sm text-destructive">{formErrors.firstName}</p>
                )}
              </div>

              {/* Last Name */}
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name (Optional)</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Last name"
                  value={formData.lastName}
                  onChange={(e) => updateField('lastName', e.target.value)}
                  onBlur={() => handleFieldBlur('lastName')}
                  autoComplete="family-name"
                  aria-invalid={!!formErrors.lastName}
                />
                {formErrors.lastName && (
                  <p className="text-sm text-destructive">{formErrors.lastName}</p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={validationState === 'registering'}
                className="w-full"
              >
                {validationState === 'registering'
                  ? 'Creating Account...'
                  : 'Complete Registration'}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Login here
                </button>
              </div>
            </form>
          )}

          {/* Success State */}
          {validationState === 'success' && (
            <div className="space-y-4 py-8 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border bg-muted/30">
                <CheckCircle className="h-8 w-8 text-foreground" />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-semibold text-foreground">Registration Successful</p>
                <p className="text-sm text-muted-foreground">
                  Your College Admin account has been created successfully.
                </p>
                <p className="text-xs text-muted-foreground">
                  You will be redirected to login shortly...
                </p>
              </div>
              <Button onClick={() => navigate('/login')} className="w-full">
                Go to Login
              </Button>
            </div>
          )}

          {/* Registering State */}
          {validationState === 'registering' && (
            <div className="space-y-4 text-center py-8">
              <div className="inline-block">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">Creating your account...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
