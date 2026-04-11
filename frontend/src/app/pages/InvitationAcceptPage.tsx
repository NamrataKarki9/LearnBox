import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { invitationAPI } from '../../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle, Lock, User, Mail, Building2, Eye, EyeOff } from 'lucide-react';

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
  const [passwordStrength, setPasswordStrength] = useState<
    'weak' | 'medium' | 'strong'
  >('weak');

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

  const checkPasswordStrength = (password: string) => {
    if (password.length < 8) {
      setPasswordStrength('weak');
    } else if (password.length < 12 || !/\d/.test(password) || !/[A-Z]/.test(password)) {
      setPasswordStrength('medium');
    } else {
      setPasswordStrength('strong');
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else {
      if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      }
      if (!/\d/.test(formData.password)) {
        newErrors.password = 'Password must contain at least one number';
      }
      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password)) {
        newErrors.password = 'Password must contain at least one special character';
      }
    }

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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

      if (response.success) {
        setValidationState('success');
        toast.success('Registration completed! Redirecting to login...');
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setValidationState('valid');
        toast.error(response.error || 'Registration failed');
      }
    } catch (error: any) {
      console.error('Error registering:', error);
      setValidationState('valid');
      toast.error(
        error?.response?.data?.error || 
        'Failed to complete registration. Please try again.'
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#7C9E9E]/10 to-[#A8C5B5]/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="bg-[#7C9E9E]/10 p-3">
              <Building2 className="h-8 w-8 text-[#7C9E9E]" />
            </div>
          </div>
          <CardTitle className="text-2xl">College Admin Registration</CardTitle>
          <CardDescription>
            Complete your registration to become a College Admin
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Loading State */}
          {validationState === 'loading' && (
            <div className="space-y-4 text-center py-8">
              <div className="inline-block">
                <div className="w-8 h-8 border-4 border-[#7C9E9E]/20 border-t-[#7C9E9E] animate-spin" />
              </div>
              <p className="text-ink-secondary">Validating your invitation...</p>
            </div>
          )}

          {/* Invalid State */}
          {validationState === 'invalid' && (
            <div className="space-y-4 py-8">
              <div className="bg-red-50 border border-red-200 p-4 space-y-2">
                <div className="flex gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-red-900">Invalid Invitation</p>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => navigate('/login')}
                className="w-full"
              >
                Back to Login
              </Button>
            </div>
          )}

          {/* Registration Form State */}
          {validationState === 'valid' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Invitation Info */}
              <div className="bg-blue-50 border border-blue-200 p-3 space-y-2">
                <p className="text-sm text-blue-700 font-semibold">Invitation Details:</p>
                <div className="space-y-1 text-sm text-blue-600">
                  <p>
                    <span className="font-medium">To:</span> {invitation?.inviteeEmail}
                  </p>
                  <p>
                    <span className="font-medium">College:</span> {invitation?.college?.name}
                  </p>
                  <p className="text-xs text-blue-500">
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
                  onChange={(e) => {
                    setFormData({ ...formData, username: e.target.value });
                    if (formErrors.username) {
                      setFormErrors({ ...formErrors, username: '' });
                    }
                  }}
                  className={formErrors.username ? 'border-red-500' : ''}
                />
                {formErrors.username && (
                  <p className="text-sm text-red-500">{formErrors.username}</p>
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
                    placeholder="Enter a strong password"
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value });
                      checkPasswordStrength(e.target.value);
                      if (formErrors.password) {
                        setFormErrors({ ...formErrors, password: '' });
                      }
                    }}
                    className={formErrors.password ? 'border-red-500 pr-10' : 'pr-10'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink-secondary"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* Password Strength */}
                {formData.password && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1  transition-colors ${
                            i <= (passwordStrength === 'weak' ? 1 : passwordStrength === 'medium' ? 2 : 3)
                              ? i === 1
                                ? 'bg-red-500'
                                : i === 2
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                              : 'bg-parchment-dark'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-ink-muted">
                      Strength:{' '}
                      <span
                        className={
                          passwordStrength === 'weak'
                            ? 'text-red-600 font-semibold'
                            : passwordStrength === 'medium'
                            ? 'text-yellow-600 font-semibold'
                            : 'text-green-600 font-semibold'
                        }
                      >
                        {passwordStrength}
                      </span>
                    </p>
                  </div>
                )}

                {formErrors.password && (
                  <p className="text-sm text-red-500">{formErrors.password}</p>
                )}

                <p className="text-xs text-ink-muted">
                  Must contain at least 8 characters, one number and one special character
                </p>
              </div>

              {/* First Name */}
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name (Optional)</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>

              {/* Last Name */}
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name (Optional)</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={validationState === 'registering'}
                className="w-full bg-[#7C9E9E] hover:bg-[#6B8D8D] text-white"
              >
                {validationState === 'registering'
                  ? 'Creating Account...'
                  : 'Complete Registration'}
              </Button>

              <div className="text-center text-sm text-ink-secondary">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-[#7C9E9E] hover:underline font-semibold"
                >
                  Login here
                </button>
              </div>
            </form>
          )}

          {/* Success State */}
          {validationState === 'success' && (
            <div className="space-y-4 py-8 text-center">
              <div className="bg-green-50 w-16 h-16 flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-lg text-gray-900">Registration Successful!</p>
                <p className="text-sm text-ink-secondary">
                  Your College Admin account has been created successfully.
                </p>
                <p className="text-xs text-ink-muted">
                  You will be redirected to login shortly...
                </p>
              </div>
              <Button
                onClick={() => navigate('/login')}
                className="w-full bg-[#7C9E9E] hover:bg-[#6B8D8D] text-white"
              >
                Go to Login
              </Button>
            </div>
          )}

          {/* Registering State */}
          {validationState === 'registering' && (
            <div className="space-y-4 text-center py-8">
              <div className="inline-block">
                <div className="w-8 h-8 border-4 border-[#7C9E9E]/20 border-t-[#7C9E9E] animate-spin" />
              </div>
              <p className="text-ink-secondary">Creating your account...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
