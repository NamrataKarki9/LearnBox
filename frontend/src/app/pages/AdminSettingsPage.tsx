import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Switch } from '../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Alert, AlertDescription } from '../components/ui/alert';
import { ArrowLeft, Bell, BookOpen, Building2, Camera, HelpCircle, Lock, LogOut, Mail, Moon, Palette, Phone, Save, Settings, Sun, User, Monitor, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { authAPI } from '../../services/api';
import {
  validateFirstName,
  validateLastName,
  validateEmail,
  validateUsername,
  validatePhone,
  validatePassword,
  validatePasswordMatch,
  sanitizeFirstName,
  sanitizeLastName,
  sanitizePhone,
  sanitizeUsername,
} from '../../utils/validators';

type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'adminSettingsV2';

const applyTheme = (theme: ThemeMode) => {
  const root = document.documentElement;
  if (theme === 'dark') return root.classList.add('dark');
  if (theme === 'light') return root.classList.remove('dark');
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) root.classList.add('dark');
  else root.classList.remove('dark');
};

export default function AdminSettingsPage() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('profile');
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const [profile, setProfile] = useState({
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    username: user?.username || '',
    email: user?.email || '',
    phone: user?.phone || '',
    avatar: user?.avatar || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Profile field errors and touched states
  const [profileErrors, setProfileErrors] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    phone: '',
  });

  const [profileTouched, setProfileTouched] = useState({
    firstName: false,
    lastName: false,
    username: false,
    email: false,
    phone: false,
  });

  // Password field errors and touched states
  const [passwordErrors, setPasswordErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [passwordTouched, setPasswordTouched] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const getInitials = () => {
    if (profile.firstName && profile.lastName) {
      return `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase();
    }
    return (profile.username || profile.email || 'AD').substring(0, 2).toUpperCase();
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image size must be less than 5MB'); return; }
    if (!file.type.startsWith('image/')) { toast.error('Please upload an image file'); return; }
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfile({ ...profile, avatar: reader.result as string });
      setHasChanges(true);
    };
    reader.readAsDataURL(file);
  };

  // Profile field validation helpers
  const handleProfileFieldChange = (field: keyof Omit<typeof profile, 'currentPassword' | 'newPassword' | 'confirmPassword' | 'avatar'>, value: string) => {
    let sanitizedValue = value;

    // Sanitize based on field type
    if (field === 'firstName') {
      sanitizedValue = sanitizeFirstName(value);
    } else if (field === 'lastName') {
      sanitizedValue = sanitizeLastName(value);
    } else if (field === 'username') {
      sanitizedValue = sanitizeUsername(value);
    } else if (field === 'phone') {
      sanitizedValue = sanitizePhone(value);
    }

    setProfile({ ...profile, [field]: sanitizedValue });
    setHasChanges(true);
  };

  const validateProfileField = (fieldName: keyof typeof profileTouched, value: string) => {
    let error = '';

    switch (fieldName) {
      case 'firstName':
        if (value && value.trim()) {
          const validation = validateFirstName(value);
          if (!validation.valid) error = validation.error || '';
        }
        break;
      case 'lastName':
        if (value && value.trim()) {
          const validation = validateLastName(value);
          if (!validation.valid) error = validation.error || '';
        }
        break;
      case 'username':
        if (value && value.trim()) {
          const usernameVal = validateUsername(value);
          if (!usernameVal.valid) error = usernameVal.error || '';
        }
        break;
      case 'email':
        if (value && value.trim()) {
          const emailVal = validateEmail(value);
          if (!emailVal.valid) error = emailVal.error || '';
        }
        break;
      case 'phone':
        if (value && value.trim()) {
          const phoneVal = validatePhone(value);
          if (!phoneVal.valid) error = phoneVal.error || '';
        }
        break;
    }

    setProfileErrors({ ...profileErrors, [fieldName]: error });
  };

  const handleProfileFieldBlur = (fieldName: keyof typeof profileTouched) => {
    setProfileTouched({ ...profileTouched, [fieldName]: true });
    const value = profile[fieldName as keyof typeof profile];
    validateProfileField(fieldName, typeof value === 'string' ? value : '');
  };

  const handleProfileUpdate = async () => {
    // Validate all fields
    const newErrors = {
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      phone: '',
    };

    // Validate first name (optional, but if provided must be valid)
    if (profile.firstName && profile.firstName.trim()) {
      const firstNameValidation = validateFirstName(profile.firstName);
      if (!firstNameValidation.valid) {
        newErrors.firstName = firstNameValidation.error || '';
      }
    }

    // Validate last name (optional, but if provided must be valid)
    if (profile.lastName && profile.lastName.trim()) {
      const lastNameValidation = validateLastName(profile.lastName);
      if (!lastNameValidation.valid) {
        newErrors.lastName = lastNameValidation.error || '';
      }
    }

    // Validate username (required)
    if (!profile.username || !profile.username.trim()) {
      newErrors.username = 'Username is required.';
    } else {
      const usernameValidation = validateUsername(profile.username);
      if (!usernameValidation.valid) {
        newErrors.username = usernameValidation.error || '';
      }
    }

    // Validate email (required)
    if (!profile.email || !profile.email.trim()) {
      newErrors.email = 'Email is required.';
    } else {
      const emailValidation = validateEmail(profile.email);
      if (!emailValidation.valid) {
        newErrors.email = emailValidation.error || '';
      }
    }

    // Validate phone (optional)
    if (profile.phone && profile.phone.trim()) {
      const phoneValidation = validatePhone(profile.phone);
      if (!phoneValidation.valid) {
        newErrors.phone = phoneValidation.error || '';
      }
    }

    setProfileErrors(newErrors);

    // Check if there are any validation errors
    const hasErrors = Object.values(newErrors).some(err => err !== '');
    if (hasErrors) {
      toast.error('Please fix validation errors marked in red.');
      return;
    }

    setIsSaving(true);
    try {
      // Prepare update data
      const updateData: any = {};
      
      if (profile.firstName?.trim()) updateData.first_name = profile.firstName.trim();
      if (profile.lastName?.trim()) updateData.last_name = profile.lastName.trim();
      if (profile.username?.trim()) updateData.username = profile.username.trim();
      if (profile.email?.trim()) updateData.email = profile.email.trim();
      if (profile.phone?.trim()) updateData.phone = profile.phone.trim();

      if (profile.avatar?.startsWith('data:')) {
        updateData.avatar = profile.avatar;
      } else if (profile.avatar === '') {
        updateData.avatar = null;
      }

      const response = await authAPI.updateProfile(updateData);
      
      const updatedUser = response.data.user as any;
      updateUser(updatedUser);
      
      const avatarToUse = profile.avatar?.startsWith('data:') ? profile.avatar : updatedUser.avatar;
      setProfile({
        firstName: updatedUser.first_name || '',
        lastName: updatedUser.last_name || '',
        username: updatedUser.username || '',
        email: updatedUser.email || '',
        phone: updatedUser.phone || '',
        avatar: avatarToUse,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      setHasChanges(false);
      toast.success('Profile updated successfully');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to update profile';
      toast.error(errorMessage);
      console.error('Error updating profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Password field validation helpers
  const handlePasswordFieldChange = (field: 'currentPassword' | 'newPassword' | 'confirmPassword', value: string) => {
    setProfile({ ...profile, [field]: value });
  };

  const validatePasswordField = (fieldName: keyof typeof passwordTouched, value: string) => {
    let error = '';

    switch (fieldName) {
      case 'currentPassword':
        if (!value) error = 'Current password is required.';
        break;
      case 'newPassword':
        if (!value) {
          error = 'New password is required.';
        } else {
          const validation = validatePassword(value);
          if (!validation.valid) error = validation.errors[0] || '';
        }
        break;
      case 'confirmPassword':
        if (!value) {
          error = 'Please confirm your new password.';
        } else if (value !== profile.newPassword) {
          error = 'Passwords do not match.';
        }
        break;
    }

    setPasswordErrors({ ...passwordErrors, [fieldName]: error });
  };

  const handlePasswordFieldBlur = (fieldName: keyof typeof passwordTouched) => {
    setPasswordTouched({ ...passwordTouched, [fieldName]: true });
    // Don't validate on blur - only validate when button is clicked
  };

  const handlePasswordChange = async () => {
    // Validate all password fields
    const newErrors = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    };

    if (!profile.currentPassword) {
      newErrors.currentPassword = 'Current password is required.';
    }

    if (!profile.newPassword) {
      newErrors.newPassword = 'New password is required.';
    } else {
      const passwordValidation = validatePassword(profile.newPassword);
      if (!passwordValidation.valid) {
        newErrors.newPassword = passwordValidation.errors[0] || 'Invalid password';
      }
    }

    if (!profile.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password.';
    } else {
      const passwordMatchValidation = validatePasswordMatch(profile.newPassword, profile.confirmPassword);
      if (!passwordMatchValidation.valid) {
        newErrors.confirmPassword = passwordMatchValidation.error || '';
      }
    }

    setPasswordErrors(newErrors);

    // Check if there are any errors
    if (Object.values(newErrors).some(err => err !== '')) {
      toast.error('Please fix all validation errors before changing password.');
      return;
    }

    setIsSaving(true);
    try {
      await authAPI.changePassword({
        currentPassword: profile.currentPassword,
        newPassword: profile.newPassword,
      });
      
      toast.success('Password changed successfully');
      setProfile({ ...profile, currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordErrors({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordTouched({ currentPassword: false, newPassword: false, confirmPassword: false });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to change password';
      toast.error(errorMessage);
      console.error('Error changing password:', error);
    } finally {
      setIsSaving(false);
    }
  }

  const college = useMemo(() => ({
    name: user?.college?.name || 'College Name',
    code: user?.college?.code || 'N/A',
  }), [user?.college?.name, user?.college?.code]);

  const [resourcePrefs, setResourcePrefs] = useState({ defaultYear: '1', requireDescription: true, autoFillModule: true });
  const [notificationPrefs, setNotificationPrefs] = useState({ emailNotifications: true, resourceUploadAlerts: true, weeklyDigest: false });
  const [preferences, setPreferences] = useState({ theme: 'system' as ThemeMode, defaultView: 'table', compactMode: false });

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'college', label: 'College', icon: Building2 },
    { id: 'resources', label: 'Resources', icon: BookOpen },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'preferences', label: 'Preferences', icon: Palette },
  ];

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const saved = JSON.parse(raw);
      if (saved.profile) setProfile((p: any) => ({ ...p, ...saved.profile }));
      if (saved.resourcePrefs) setResourcePrefs((p: any) => ({ ...p, ...saved.resourcePrefs }));
      if (saved.notificationPrefs) setNotificationPrefs((p: any) => ({ ...p, ...saved.notificationPrefs }));
      if (saved.preferences) setPreferences((p: any) => ({ ...p, ...saved.preferences }));
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Sync profile with user data when user object changes
  useEffect(() => {
    if (user) {
      setProfile((p) => ({
        ...p,
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        username: user.username || '',
        email: user.email || '',
        phone: user.phone || '',
        avatar: user.avatar || '',
      }));
    }
  }, [user?.id, user?.first_name, user?.last_name, user?.username, user?.email, user?.phone, user?.avatar]);

  // Clear password errors and touched state when switching tabs
  useEffect(() => {
    setPasswordErrors({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setPasswordTouched({ currentPassword: false, newPassword: false, confirmPassword: false });
  }, [activeTab]);

  useEffect(() => applyTheme(preferences.theme), [preferences.theme]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Settings className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Admin Settings</h1>
            </div>
            <div className="flex items-center gap-2">
              {hasChanges ? <Badge variant="secondary" className="hidden sm:inline-flex">Unsaved changes</Badge> : null}
              <Button variant="outline" onClick={() => navigate('/admin/dashboard')}><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation (Desktop) */}
          <div className="hidden lg:block lg:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="p-4">
                <nav className="space-y-1">
                  {tabs.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setActiveTab(t.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeTab === t.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      <t.icon className="h-5 w-5" />
                      <span>{t.label}</span>
                    </button>
                  ))}
                  <Separator className="my-2" />
                  <button
                    onClick={() => navigate('/admin/dashboard')}
                    className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted"
                  >
                    <HelpCircle className="h-5 w-5" />
                    <span>Help & Support</span>
                  </button>
                  <button
                    onClick={logout}
                    className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Sign Out</span>
                  </button>
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Mobile Tab Bar */}
          <div className="lg:hidden mb-2">
            <Card><CardContent className="p-2 flex gap-1 overflow-x-auto">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === t.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <t.icon className="h-4 w-4" />
                  <span>{t.label}</span>
                </button>
              ))}
            </CardContent></Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">

            {activeTab === 'profile' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <User className="h-5 w-5" />
                      <span>Profile Information</span>
                    </CardTitle>
                    <CardDescription>Update your personal information and profile picture</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Avatar Section */}
                    <div className="flex items-center space-x-6">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={profile.avatar} />
                        <AvatarFallback className="text-2xl">{getInitials()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-foreground mb-2">Profile Picture</h3>
                        <p className="text-sm text-muted-foreground mb-3">JPG, PNG or GIF. Max size 5MB.</p>
                        <div className="flex items-center space-x-3">
                          <Button variant="outline" size="sm" onClick={() => document.getElementById('admin-avatar-upload')?.click()}>
                            <Camera className="h-4 w-4 mr-2" />Upload New
                          </Button>
                          {profile.avatar && (
                            <Button variant="ghost" size="sm" onClick={() => { setProfile({ ...profile, avatar: '' }); setHasChanges(true); }}>Remove</Button>
                          )}
                          <input id="admin-avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="admin-first-name">First Name</Label>
                        <Input 
                          id="admin-first-name" 
                          value={profile.firstName} 
                          onChange={(e) => handleProfileFieldChange('firstName', e.target.value)}
                          onBlur={() => handleProfileFieldBlur('firstName')}
                          placeholder="Enter your first name"
                          className={profileErrors.firstName ? 'border-red-500 focus-visible:ring-red-500' : ''}
                        />
                        {profileErrors.firstName && (
                          <p className="text-sm text-red-600 flex items-center gap-1">
                            <AlertCircle className="h-4 w-4" />
                            {profileErrors.firstName}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="admin-last-name">Last Name</Label>
                        <Input 
                          id="admin-last-name" 
                          value={profile.lastName} 
                          onChange={(e) => handleProfileFieldChange('lastName', e.target.value)}
                          onBlur={() => handleProfileFieldBlur('lastName')}
                          placeholder="Enter your last name"
                          className={profileErrors.lastName ? 'border-red-500 focus-visible:ring-red-500' : ''}
                        />
                        {profileErrors.lastName && (
                          <p className="text-sm text-red-600 flex items-center gap-1">
                            <AlertCircle className="h-4 w-4" />
                            {profileErrors.lastName}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="admin-username">Username</Label>
                      <Input 
                        id="admin-username" 
                        value={profile.username} 
                        onChange={(e) => handleProfileFieldChange('username', e.target.value)}
                        onBlur={() => handleProfileFieldBlur('username')}
                        placeholder="Enter your username"
                        className={profileErrors.username ? 'border-red-500 focus-visible:ring-red-500' : ''}
                      />
                      {profileErrors.username && (
                        <p className="text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          {profileErrors.username}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="admin-email">Email Address</Label>
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <Input 
                          id="admin-email" 
                          type="email" 
                          value={profile.email} 
                          onChange={(e) => handleProfileFieldChange('email', e.target.value)}
                          onBlur={() => handleProfileFieldBlur('email')}
                          placeholder="Enter your email"
                          className={profileErrors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}
                        />
                      </div>
                      {profileErrors.email && (
                        <p className="text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          {profileErrors.email}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="admin-phone">Phone Number (Optional)</Label>
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <Input 
                          id="admin-phone" 
                          type="tel" 
                          value={profile.phone} 
                          onChange={(e) => handleProfileFieldChange('phone', e.target.value)}
                          onBlur={() => handleProfileFieldBlur('phone')}
                          placeholder="+977 .........."
                          className={profileErrors.phone ? 'border-red-500 focus-visible:ring-red-500' : ''}
                        />
                      </div>
                      {profileErrors.phone && (
                        <p className="text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          {profileErrors.phone}
                        </p>
                      )}
                    </div>

                    <div className="flex justify-end">
                      <Button onClick={handleProfileUpdate} disabled={isSaving}>
                        <Save className="h-4 w-4 mr-2" />{isSaving ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Lock className="h-5 w-5" />
                      <span>Password</span>
                    </CardTitle>
                    <CardDescription>Change your account password</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <div className="relative">
                        <Input 
                          id="current-password"
                          type={showPasswordFields.currentPassword ? 'text' : 'password'} 
                          value={profile.currentPassword} 
                          onChange={(e) => handlePasswordFieldChange('currentPassword', e.target.value)}
                          onBlur={() => handlePasswordFieldBlur('currentPassword')}
                          className={`pr-10 ${passwordErrors.currentPassword ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                          placeholder="Enter your current password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswordFields({ ...showPasswordFields, currentPassword: !showPasswordFields.currentPassword })}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPasswordFields.currentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {passwordErrors.currentPassword && (
                        <p className="text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          {passwordErrors.currentPassword}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <div className="relative">
                        <Input 
                          id="new-password"
                          type={showPasswordFields.newPassword ? 'text' : 'password'} 
                          value={profile.newPassword} 
                          onChange={(e) => handlePasswordFieldChange('newPassword', e.target.value)}
                          onBlur={() => handlePasswordFieldBlur('newPassword')}
                          className={`pr-10 ${passwordErrors.newPassword ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                          placeholder="Enter your new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswordFields({ ...showPasswordFields, newPassword: !showPasswordFields.newPassword })}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPasswordFields.newPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {passwordErrors.newPassword && (
                        <p className="text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          {passwordErrors.newPassword}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <div className="relative">
                        <Input 
                          id="confirm-password"
                          type={showPasswordFields.confirmPassword ? 'text' : 'password'} 
                          value={profile.confirmPassword} 
                          onChange={(e) => handlePasswordFieldChange('confirmPassword', e.target.value)}
                          onBlur={() => handlePasswordFieldBlur('confirmPassword')}
                          className={`pr-10 ${passwordErrors.confirmPassword ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                          placeholder="Confirm your new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswordFields({ ...showPasswordFields, confirmPassword: !showPasswordFields.confirmPassword })}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPasswordFields.confirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {passwordErrors.confirmPassword && (
                        <p className="text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          {passwordErrors.confirmPassword}
                        </p>
                      )}
                    </div>

                    <div className="flex justify-end">
                      <Button onClick={handlePasswordChange} disabled={isSaving}>
                        {isSaving ? 'Updating...' : 'Update Password'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'college' && <Card><CardHeader><CardTitle>College Information</CardTitle><CardDescription>Managed by Super Admin.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><Label>Name</Label><Input disabled value={college.name} /></div><div className="space-y-2"><Label>Code</Label><Input disabled value={college.code} /></div><div className="space-y-2"><Label>Notes</Label><Textarea disabled value="Contact Super Admin to update institution details." /></div></CardContent></Card>}

            {activeTab === 'resources' && <Card><CardHeader><CardTitle>Resource Preferences</CardTitle></CardHeader><CardContent className="space-y-6"><div className="space-y-2"><Label>Default Year</Label><Select value={resourcePrefs.defaultYear} onValueChange={(v) => { setResourcePrefs({ ...resourcePrefs, defaultYear: v }); setHasChanges(true); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1">Year 1</SelectItem><SelectItem value="2">Year 2</SelectItem><SelectItem value="3">Year 3</SelectItem><SelectItem value="4">Year 4</SelectItem></SelectContent></Select></div><div className="flex items-center justify-between"><span className="text-sm text-foreground">Auto-fill module info</span><Switch checked={resourcePrefs.autoFillModule} onCheckedChange={(c) => { setResourcePrefs({ ...resourcePrefs, autoFillModule: c }); setHasChanges(true); }} /></div><div className="flex items-center justify-between"><span className="text-sm text-foreground">Require description</span><Switch checked={resourcePrefs.requireDescription} onCheckedChange={(c) => { setResourcePrefs({ ...resourcePrefs, requireDescription: c }); setHasChanges(true); }} /></div><div className="flex justify-end"><Button onClick={async () => { setIsSaving(true); localStorage.setItem(STORAGE_KEY, JSON.stringify({ profile, resourcePrefs, notificationPrefs, preferences })); await new Promise((r) => setTimeout(r, 350)); setIsSaving(false); setHasChanges(false); toast.success('Resource preferences saved'); }} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</Button></div></CardContent></Card>}

            {activeTab === 'notifications' && <Card><CardHeader><CardTitle>Notifications</CardTitle></CardHeader><CardContent className="space-y-5"><div className="flex items-center justify-between"><span className="text-sm text-foreground">Email notifications</span><Switch checked={notificationPrefs.emailNotifications} onCheckedChange={(c) => { setNotificationPrefs({ ...notificationPrefs, emailNotifications: c }); setHasChanges(true); }} /></div><div className="flex items-center justify-between"><span className="text-sm text-foreground">Resource upload alerts</span><Switch checked={notificationPrefs.resourceUploadAlerts} onCheckedChange={(c) => { setNotificationPrefs({ ...notificationPrefs, resourceUploadAlerts: c }); setHasChanges(true); }} /></div><div className="flex items-center justify-between"><span className="text-sm text-foreground">Weekly digest</span><Switch checked={notificationPrefs.weeklyDigest} onCheckedChange={(c) => { setNotificationPrefs({ ...notificationPrefs, weeklyDigest: c }); setHasChanges(true); }} /></div><div className="flex justify-end"><Button onClick={async () => { setIsSaving(true); localStorage.setItem(STORAGE_KEY, JSON.stringify({ profile, resourcePrefs, notificationPrefs, preferences })); await new Promise((r) => setTimeout(r, 350)); setIsSaving(false); setHasChanges(false); toast.success('Notification settings saved'); }} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</Button></div></CardContent></Card>}

            {activeTab === 'preferences' && <Card><CardHeader><CardTitle>Appearance & Preferences</CardTitle><CardDescription>Theme support added for college admin dashboard.</CardDescription></CardHeader><CardContent className="space-y-6"><div className="space-y-2"><Label>Theme</Label><Select value={preferences.theme} onValueChange={(v: ThemeMode) => { setPreferences({ ...preferences, theme: v }); setHasChanges(true); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="light"><div className="flex items-center gap-2"><Sun className="h-4 w-4" />Light</div></SelectItem><SelectItem value="dark"><div className="flex items-center gap-2"><Moon className="h-4 w-4" />Dark</div></SelectItem><SelectItem value="system"><div className="flex items-center gap-2"><Monitor className="h-4 w-4" />System</div></SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>Default View</Label><Select value={preferences.defaultView} onValueChange={(v) => { setPreferences({ ...preferences, defaultView: v }); setHasChanges(true); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="table">Table</SelectItem><SelectItem value="grid">Grid</SelectItem><SelectItem value="list">List</SelectItem></SelectContent></Select></div><div className="flex items-center justify-between"><span className="text-sm text-foreground">Compact mode</span><Switch checked={preferences.compactMode} onCheckedChange={(c) => { setPreferences({ ...preferences, compactMode: c }); setHasChanges(true); }} /></div><div className="flex justify-end"><Button onClick={async () => { setIsSaving(true); localStorage.setItem(STORAGE_KEY, JSON.stringify({ profile, resourcePrefs, notificationPrefs, preferences })); await new Promise((r) => setTimeout(r, 350)); setIsSaving(false); setHasChanges(false); toast.success('Preferences saved'); }} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</Button></div></CardContent></Card>}

        </div>
        </div>
      </div>
    </div>
  );
}
