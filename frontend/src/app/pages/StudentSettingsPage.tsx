/**
 * Student Settings Page
 * Industry-aligned settings interface for online learning platform
 * Inspired by Coursera, Udemy, LinkedIn Learning
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Switch } from '../components/ui/switch';
import { Separator } from '../components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  User,
  Lock,
  Bell,
  Shield,
  Palette,
  Settings,
  Camera,
  Save,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Globe,
  Moon,
  Sun,
  Monitor,
  Languages,
  HelpCircle,
  FileText,
  LogOut,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';
import { authAPI } from '../../services/api';
import { FieldError } from '../components/FieldValidation';
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

interface UserProfile {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  bio?: string;
  phone?: string;
  avatar?: string;
  dateJoined?: string;
  college?: {
    id: number;
    name: string;
    code: string;
  };
}

interface NotificationSettings {
  emailNotifications: boolean;
  courseUpdates: boolean;
  newResources: boolean;
  mcqResults: boolean;
  systemAnnouncements: boolean;
  weeklyDigest: boolean;
  pushNotifications: boolean;
}

interface PreferenceSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  defaultView: 'grid' | 'list';
  resourcesPerPage: number;
}

export default function StudentSettingsPage() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  // State for user profile
  const [profile, setProfile] = useState<UserProfile>({
    id: user?.id || 0,
    username: user?.username || '',
    email: user?.email || '',
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    bio: user?.bio || '',
    phone: user?.phone || '',
    avatar: user?.avatar || '',
    college: user?.college,
  });

  // Profile field errors and touched states
  const [profileErrors, setProfileErrors] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    phone: '',
  });

  const [profileTouched, setProfileTouched] = useState({
    first_name: false,
    last_name: false,
    username: false,
    email: false,
    phone: false,
  });

  // State for password change
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
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

  // State for password visibility
  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  // State for notifications
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    courseUpdates: true,
    newResources: true,
    mcqResults: true,
    systemAnnouncements: true,
    weeklyDigest: false,
    pushNotifications: false,
  });

  // State for preferences
  const [preferences, setPreferences] = useState<PreferenceSettings>({
    theme: 'system',
    language: 'en',
    defaultView: 'grid',
    resourcesPerPage: 20,
  });

  // Loading states
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  // Load user settings on mount
  useEffect(() => {
    loadUserSettings();
  }, []);

  const loadUserSettings = async () => {
    try {
      // In a real app, fetch these from the backend
      const savedSettings = localStorage.getItem('userSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setNotifications(settings.notifications || notifications);
        setPreferences(settings.preferences || preferences);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleProfileUpdate = async () => {
    // Validate only required fields
    const newErrors = {
      first_name: '',
      last_name: '',
      username: '',
      email: '',
      phone: '',
    };

    // Validate first name (optional, but if provided must be letters only)
    if (profile.first_name && profile.first_name.trim()) {
      const firstNameValidation = validateFirstName(profile.first_name);
      if (!firstNameValidation.valid) {
        newErrors.first_name = firstNameValidation.error || '';
      }
    }

    // Validate last name (optional, but if provided must be letters only)
    if (profile.last_name && profile.last_name.trim()) {
      const lastNameValidation = validateLastName(profile.last_name);
      if (!lastNameValidation.valid) {
        newErrors.last_name = lastNameValidation.error || '';
      }
    }

    // Validate username (required)
    if (profile.username && profile.username.trim()) {
      const usernameValidation = validateUsername(profile.username);
      if (!usernameValidation.valid) {
        newErrors.username = usernameValidation.error || '';
      }
    }

    // Validate email (required)
    if (profile.email && profile.email.trim()) {
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
      // Prepare update data - only send fields that have values
      const updateData: any = {};
      
      // Always include username and email if they exist
      if (profile.username?.trim()) updateData.username = profile.username.trim();
      if (profile.email?.trim()) updateData.email = profile.email.trim();
      
      // Only add optional fields if they have values
      if (profile.first_name?.trim()) updateData.first_name = profile.first_name.trim();
      if (profile.last_name?.trim()) updateData.last_name = profile.last_name.trim();
      if (profile.phone?.trim()) updateData.phone = profile.phone.trim();
      if (profile.bio?.trim()) updateData.bio = profile.bio.trim();
      
      // Send avatar if user uploaded a new one (base64 format)
      // Or explicitly send empty string if user clicked remove
      if (profile.avatar?.startsWith('data:')) {
        // New avatar was uploaded
        updateData.avatar = profile.avatar;
      } else if (profile.avatar === '') {
        // User explicitly removed the avatar
        updateData.avatar = null;
      }
      // Otherwise, don't include avatar field to keep existing avatar

      console.log('Sending profile update:', { ...updateData, avatar: updateData.avatar ? `[base64 image, size: ${updateData.avatar.length} bytes]` : updateData.avatar });
      
      // Call backend API to update profile
      const response = await authAPI.updateProfile(updateData);
      
      // Update session storage and AuthContext with the updated user data
      const updatedUser = response.data.user as any;
      updateUser(updatedUser);
      
      // Update local profile state
      // Preserve locally-set avatar if it's a new upload (base64 format)
      const avatarToUse = profile.avatar?.startsWith('data:') ? profile.avatar : updatedUser.avatar;
      setProfile({
        ...profile,
        ...updatedUser,
        avatar: avatarToUse, // Use new avatar if uploaded, otherwise server's avatar
        college: user?.college, // Preserve college data
      });
      
      toast.success('Profile updated successfully');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to update profile';
      toast.error(errorMessage);
      console.error('Error updating profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    // Validate all password fields
    const newErrors = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    };

    if (!passwordForm.currentPassword) {
      newErrors.currentPassword = 'Current password is required.';
    }

    if (!passwordForm.newPassword) {
      newErrors.newPassword = 'New password is required.';
    } else {
      const passwordValidation = validatePassword(passwordForm.newPassword);
      if (!passwordValidation.valid) {
        newErrors.newPassword = passwordValidation.errors[0] || 'Invalid password';
      }
    }

    if (!passwordForm.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password.';
    } else {
      const passwordMatchValidation = validatePasswordMatch(passwordForm.newPassword, passwordForm.confirmPassword);
      if (!passwordMatchValidation.valid) {
        newErrors.confirmPassword = passwordMatchValidation.error || '';
      }
    }

    setPasswordErrors(newErrors);

    // Check if there are any format validation errors
    if (Object.values(newErrors).some(err => err !== '')) {
      const firstError = Object.values(newErrors).find(err => err !== '');
      toast.error(firstError || 'Please fix validation errors');
      return;
    }

    setIsSaving(true);
    try {
      // First verify the current password is correct
      try {
        await authAPI.verifyPassword({
          currentPassword: passwordForm.currentPassword,
        });
      } catch (error: any) {
        // Current password is invalid
        setPasswordErrors({ ...newErrors, currentPassword: 'Invalid current password.' });
        toast.error('Invalid current password.');
        setIsSaving(false);
        return;
      }

      // If current password is valid, proceed with password change
      await authAPI.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      
      toast.success('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordErrors({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordTouched({ currentPassword: false, newPassword: false, confirmPassword: false });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to change password';
      toast.error(errorMessage);
      console.error('Error changing password:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Profile field validation helpers
  const handleProfileFieldChange = (field: keyof typeof profile, value: string) => {
    let sanitizedValue = value;

    // Sanitize based on field type
    if (field === 'first_name') {
      sanitizedValue = sanitizeFirstName(value);
    } else if (field === 'last_name') {
      sanitizedValue = sanitizeLastName(value);
    } else if (field === 'username') {
      sanitizedValue = sanitizeUsername(value);
    } else if (field === 'phone') {
      sanitizedValue = sanitizePhone(value);
    }

    setProfile({ ...profile, [field]: sanitizedValue });

    // Validate in real-time if field was touched
    if (profileTouched[field as keyof typeof profileTouched]) {
      validateProfileField(field as keyof typeof profileTouched, sanitizedValue);
    }
  };

  const validateProfileField = (fieldName: keyof typeof profileTouched, value: string) => {
    let error = '';

    switch (fieldName) {
      case 'first_name':
        if (value && value.trim()) {
          const validation = validateFirstName(value);
          if (!validation.valid) error = validation.error || '';
        }
        break;
      case 'last_name':
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

  // Password field validation helpers
  const handlePasswordFieldChange = (field: keyof typeof passwordForm, value: string) => {
    setPasswordForm({ ...passwordForm, [field]: value });

    // Validate in real-time if field was touched
    if (passwordTouched[field as keyof typeof passwordTouched]) {
      validatePasswordField(field as keyof typeof passwordTouched, value);
    }
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
        } else if (value !== passwordForm.newPassword) {
          error = 'Passwords do not match.';
        }
        break;
    }

    setPasswordErrors({ ...passwordErrors, [fieldName]: error });
  };

  const handlePasswordFieldBlur = (fieldName: keyof typeof passwordTouched) => {
    setPasswordTouched({ ...passwordTouched, [fieldName]: true });
    validatePasswordField(fieldName, passwordForm[fieldName]);
  };

  const handleNotificationUpdate = async () => {
    setIsSaving(true);
    try {
      const settings = {
        notifications,
        preferences,
      };
      localStorage.setItem('userSettings', JSON.stringify(settings));
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast.success('Notification preferences saved');
    } catch (error) {
      toast.error('Failed to update notifications');
      console.error('Error updating notifications:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreferencesUpdate = async () => {
    setIsSaving(true);
    try {
      const settings = {
        notifications,
        preferences,
      };
      localStorage.setItem('userSettings', JSON.stringify(settings));
      
      // Apply theme
      const root = document.documentElement;
      if (preferences.theme === 'dark') {
        root.classList.add('dark');
      } else if (preferences.theme === 'light') {
        root.classList.remove('dark');
      } else {
        // System preference
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast.success('Preferences saved');
    } catch (error) {
      toast.error('Failed to update preferences');
      console.error('Error updating preferences:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (max 3MB to account for base64 encoding overhead)
      // Base64 encoding increases size by ~33%, so 3MB becomes ~4MB
      if (file.size > 3 * 1024 * 1024) {
        toast.error('Image size must be less than 3MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile({ ...profile, avatar: reader.result as string });
        toast.success('Avatar updated. Click Save to confirm changes.');
      };
      reader.readAsDataURL(file);
    }
  };

  const getInitials = () => {
    if (profile.first_name && profile.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }
    return profile.username.substring(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Settings className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Settings</h1>
            </div>
            <Button variant="outline" onClick={() => navigate('/student-dashboard')}>
              Back to Dashboard
            </Button>
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
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === 'profile'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <User className="h-5 w-5" />
                    <span>Profile</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('security')}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === 'security'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <Lock className="h-5 w-5" />
                    <span>Security</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('notifications')}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === 'notifications'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <Bell className="h-5 w-5" />
                    <span>Notifications</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('preferences')}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === 'preferences'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <Palette className="h-5 w-5" />
                    <span>Preferences</span>
                  </button>
                  <Separator className="my-2" />
                  <button
                    onClick={() => navigate('/student-dashboard')}
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

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {/* Mobile Tabs */}
            <div className="lg:hidden mb-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full grid grid-cols-4">
                  <TabsTrigger value="profile">
                    <User className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger value="security">
                    <Lock className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger value="notifications">
                    <Bell className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger value="preferences">
                    <Palette className="h-4 w-4" />
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Profile Section */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <User className="h-5 w-5" />
                      <span>Profile Information</span>
                    </CardTitle>
                    <CardDescription>
                      Update your personal information and profile picture
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Avatar Section */}
                    <div className="flex items-center space-x-6">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={profile.avatar} />
                        <AvatarFallback className="text-2xl">{getInitials()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-foreground mb-2">
                          Profile Picture
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          JPG, PNG or GIF. Max size 3MB.
                        </p>
                        <div className="flex items-center space-x-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById('avatar-upload')?.click()}
                          >
                            <Camera className="h-4 w-4 mr-2" />
                            Upload New
                          </Button>
                          {profile.avatar && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setProfile({ ...profile, avatar: '' })}
                            >
                              Remove
                            </Button>
                          )}
                          <input
                            id="avatar-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarUpload}
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first_name">First Name</Label>
                        <Input
                          id="first_name"
                          value={profile.first_name}
                          onChange={(e) =>
                            handleProfileFieldChange('first_name', e.target.value)
                          }
                          onBlur={() => handleProfileFieldBlur('first_name')}
                          placeholder="Enter your first name"
                          className={profileTouched.first_name && profileErrors.first_name ? "border-2 border-red-500" : ""}
                        />
                        {profileTouched.first_name && profileErrors.first_name && (
                          <FieldError error={profileErrors.first_name} />
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last_name">Last Name</Label>
                        <Input
                          id="last_name"
                          value={profile.last_name}
                          onChange={(e) =>
                            handleProfileFieldChange('last_name', e.target.value)
                          }
                          onBlur={() => handleProfileFieldBlur('last_name')}
                          placeholder="Enter your last name"
                          className={profileTouched.last_name && profileErrors.last_name ? "border-2 border-red-500" : ""}
                        />
                        {profileTouched.last_name && profileErrors.last_name && (
                          <FieldError error={profileErrors.last_name} />
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={profile.username}
                        onChange={(e) =>
                          handleProfileFieldChange('username', e.target.value)
                        }
                        onBlur={() => handleProfileFieldBlur('username')}
                        placeholder="Letters and underscores only (e.g., john_doe)"
                        className={profileTouched.username && profileErrors.username ? "border-2 border-red-500" : ""}
                      />
                      {profileTouched.username && profileErrors.username && (
                        <FieldError error={profileErrors.username} />
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <Input
                          id="email"
                          type="email"
                          value={profile.email}
                          onChange={(e) =>
                            handleProfileFieldChange('email', e.target.value)
                          }
                          onBlur={() => handleProfileFieldBlur('email')}
                          placeholder="Enter your email"
                          className={profileTouched.email && profileErrors.email ? "border-2 border-red-500" : ""}
                        />
                      </div>
                      {profileTouched.email && profileErrors.email && (
                        <FieldError error={profileErrors.email} />
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number (Optional)</Label>
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <Input
                          id="phone"
                          type="tel"
                          value={profile.phone}
                          onChange={(e) =>
                            handleProfileFieldChange('phone', e.target.value)
                          }
                          onBlur={() => handleProfileFieldBlur('phone')}
                          placeholder="+977 .........."
                          className={profileTouched.phone && profileErrors.phone ? "border-2 border-red-500" : ""}
                        />
                      </div>
                      {profileTouched.phone && profileErrors.phone && (
                        <FieldError error={profileErrors.phone} />
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={profile.bio}
                        onChange={(e) =>
                          setProfile({ ...profile, bio: e.target.value })
                        }
                        placeholder="Tell us a bit about yourself..."
                        rows={4}
                        maxLength={500}
                      />
                      <p className="text-xs text-muted-foreground">
                        {profile.bio?.length || 0}/500 characters
                      </p>
                    </div>

                    <Separator />

                    {/* College Information (Read-only) */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-foreground">
                        College Information
                      </h3>
                      <div className="bg-muted rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            College
                          </span>
                          <span className="text-sm font-medium text-foreground">
                            {profile.college?.name || 'Not specified'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            College Code
                          </span>
                          <Badge variant="outline">
                            {profile.college?.code || 'N/A'}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button onClick={handleProfileUpdate} disabled={isSaving}>
                        {isSaving ? (
                          <>Saving...</>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Security Section */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Lock className="h-5 w-5" />
                      <span>Password & Security</span>
                    </CardTitle>
                    <CardDescription>
                      Manage your password and security settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Change Password */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-foreground">
                        Change Password
                      </h3>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="current_password">Current Password</Label>
                          <div className="relative">
                            <Input
                              id="current_password"
                              type={showPasswords.currentPassword ? "text" : "password"}
                              value={passwordForm.currentPassword}
                              onChange={(e) =>
                                handlePasswordFieldChange('currentPassword', e.target.value)
                              }
                              onBlur={() => handlePasswordFieldBlur('currentPassword')}
                              placeholder="Enter current password"
                              className={passwordTouched.currentPassword && passwordErrors.currentPassword ? "border-2 border-red-500 pr-10" : "pr-10"}
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowPasswords({
                                  ...showPasswords,
                                  currentPassword: !showPasswords.currentPassword,
                                })
                              }
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              {showPasswords.currentPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                          {passwordTouched.currentPassword && passwordErrors.currentPassword && (
                            <FieldError error={passwordErrors.currentPassword} />
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="new_password">New Password</Label>
                          <div className="relative">
                            <Input
                              id="new_password"
                              type={showPasswords.newPassword ? "text" : "password"}
                              value={passwordForm.newPassword}
                              onChange={(e) =>
                                handlePasswordFieldChange('newPassword', e.target.value)
                              }
                              onBlur={() => handlePasswordFieldBlur('newPassword')}
                              placeholder="Enter new password (min 8 characters, must include number and special character)"
                              className={passwordTouched.newPassword && passwordErrors.newPassword ? "border-2 border-red-500 pr-10" : "pr-10"}
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowPasswords({
                                  ...showPasswords,
                                  newPassword: !showPasswords.newPassword,
                                })
                              }
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              {showPasswords.newPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                          {passwordTouched.newPassword && passwordErrors.newPassword && (
                            <FieldError error={passwordErrors.newPassword} />
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirm_password">Confirm New Password</Label>
                          <div className="relative">
                            <Input
                              id="confirm_password"
                              type={showPasswords.confirmPassword ? "text" : "password"}
                              value={passwordForm.confirmPassword}
                              onChange={(e) =>
                                handlePasswordFieldChange('confirmPassword', e.target.value)
                              }
                              onBlur={() => handlePasswordFieldBlur('confirmPassword')}
                              placeholder="Confirm new password"
                              className={passwordTouched.confirmPassword && passwordErrors.confirmPassword ? "border-2 border-red-500 pr-10" : "pr-10"}
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowPasswords({
                                  ...showPasswords,
                                  confirmPassword: !showPasswords.confirmPassword,
                                })
                              }
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              {showPasswords.confirmPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                          {passwordTouched.confirmPassword && passwordErrors.confirmPassword && (
                            <FieldError error={passwordErrors.confirmPassword} />
                          )}
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button onClick={handlePasswordChange} disabled={isSaving}>
                          {isSaving ? 'Updating...' : 'Update Password'}
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    {/* Two-Factor Authentication */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-foreground">
                            Two-Factor Authentication
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Add an extra layer of security to your account
                          </p>
                        </div>
                        <Badge variant="secondary">Coming Soon</Badge>
                      </div>
                    </div>

                    <Separator />

                    {/* Active Sessions */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-foreground">
                        Active Sessions
                      </h3>
                      <div className="bg-muted rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Monitor className="h-5 w-5 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                Current Session
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Active now
                              </p>
                            </div>
                          </div>
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Notifications Section */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Bell className="h-5 w-5" />
                      <span>Notification Preferences</span>
                    </CardTitle>
                    <CardDescription>
                      Choose what notifications you want to receive
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Email Notifications */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="email-notifications" className="text-base">
                            Email Notifications
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Receive notifications via email
                          </p>
                        </div>
                        <Switch
                          id="email-notifications"
                          checked={notifications.emailNotifications}
                          onCheckedChange={(checked) =>
                            setNotifications({ ...notifications, emailNotifications: checked })
                          }
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Specific Notifications */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-foreground">
                        Email Preferences
                      </h3>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="course-updates">Course Updates</Label>
                            <p className="text-sm text-muted-foreground">
                              New modules, assignments, and course announcements
                            </p>
                          </div>
                          <Switch
                            id="course-updates"
                            checked={notifications.courseUpdates}
                            onCheckedChange={(checked) =>
                              setNotifications({ ...notifications, courseUpdates: checked })
                            }
                            disabled={!notifications.emailNotifications}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="new-resources">New Resources</Label>
                            <p className="text-sm text-muted-foreground">
                              When new study materials are uploaded
                            </p>
                          </div>
                          <Switch
                            id="new-resources"
                            checked={notifications.newResources}
                            onCheckedChange={(checked) =>
                              setNotifications({ ...notifications, newResources: checked })
                            }
                            disabled={!notifications.emailNotifications}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="mcq-results">MCQ Results</Label>
                            <p className="text-sm text-muted-foreground">
                              Quiz completions and score updates
                            </p>
                          </div>
                          <Switch
                            id="mcq-results"
                            checked={notifications.mcqResults}
                            onCheckedChange={(checked) =>
                              setNotifications({ ...notifications, mcqResults: checked })
                            }
                            disabled={!notifications.emailNotifications}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="system-announcements">System Announcements</Label>
                            <p className="text-sm text-muted-foreground">
                              Important updates and maintenance notifications
                            </p>
                          </div>
                          <Switch
                            id="system-announcements"
                            checked={notifications.systemAnnouncements}
                            onCheckedChange={(checked) =>
                              setNotifications({ ...notifications, systemAnnouncements: checked })
                            }
                            disabled={!notifications.emailNotifications}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="weekly-digest">Weekly Digest</Label>
                            <p className="text-sm text-muted-foreground">
                              Summary of your learning activity and progress
                            </p>
                          </div>
                          <Switch
                            id="weekly-digest"
                            checked={notifications.weeklyDigest}
                            onCheckedChange={(checked) =>
                              setNotifications({ ...notifications, weeklyDigest: checked })
                            }
                            disabled={!notifications.emailNotifications}
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Push Notifications */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="push-notifications" className="text-base">
                            Push Notifications
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Receive browser push notifications
                          </p>
                        </div>
                        <Badge variant="secondary">Coming Soon</Badge>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button onClick={handleNotificationUpdate} disabled={isSaving}>
                        {isSaving ? (
                          'Saving...'
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Preferences
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Preferences Section */}
            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Palette className="h-5 w-5" />
                      <span>Appearance & Preferences</span>
                    </CardTitle>
                    <CardDescription>
                      Customize your learning experience
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Theme Selection */}
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="theme" className="text-base">
                          Theme
                        </Label>
                        <p className="text-sm text-muted-foreground mb-3">
                          Choose your preferred color theme
                        </p>
                      </div>
                      <Select
                        value={preferences.theme}
                        onValueChange={(value: 'light' | 'dark' | 'system') =>
                          setPreferences({ ...preferences, theme: value })
                        }
                      >
                        <SelectTrigger id="theme">
                          <SelectValue placeholder="Select theme" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">
                            <div className="flex items-center space-x-2">
                              <Sun className="h-4 w-4" />
                              <span>Light</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="dark">
                            <div className="flex items-center space-x-2">
                              <Moon className="h-4 w-4" />
                              <span>Dark</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="system">
                            <div className="flex items-center space-x-2">
                              <Monitor className="h-4 w-4" />
                              <span>System</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    {/* Language */}
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="language" className="text-base">
                          Language
                        </Label>
                        <p className="text-sm text-muted-foreground mb-3">
                          Select your preferred language
                        </p>
                      </div>
                      <Select
                        value={preferences.language}
                        onValueChange={(value) =>
                          setPreferences({ ...preferences, language: value })
                        }
                      >
                        <SelectTrigger id="language">
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">
                            <div className="flex items-center space-x-2">
                              <Globe className="h-4 w-4" />
                              <span>English</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="es">
                            <div className="flex items-center space-x-2">
                              <Globe className="h-4 w-4" />
                              <span>Español</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="fr">
                            <div className="flex items-center space-x-2">
                              <Globe className="h-4 w-4" />
                              <span>Français</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="de">
                            <div className="flex items-center space-x-2">
                              <Globe className="h-4 w-4" />
                              <span>Deutsch</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    {/* Display Preferences */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-foreground">
                        Display Options
                      </h3>
                      
                      <div>
                        <Label htmlFor="default-view" className="text-sm mb-2 block">
                          Default Resource View
                        </Label>
                        <Select
                          value={preferences.defaultView}
                          onValueChange={(value: 'grid' | 'list') =>
                            setPreferences({ ...preferences, defaultView: value })
                          }
                        >
                          <SelectTrigger id="default-view">
                            <SelectValue placeholder="Select view" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="grid">Grid View</SelectItem>
                            <SelectItem value="list">List View</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="resources-per-page" className="text-sm mb-2 block">
                          Resources Per Page
                        </Label>
                        <Select
                          value={preferences.resourcesPerPage.toString()}
                          onValueChange={(value) =>
                            setPreferences({ ...preferences, resourcesPerPage: parseInt(value) })
                          }
                        >
                          <SelectTrigger id="resources-per-page">
                            <SelectValue placeholder="Select number" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10 items</SelectItem>
                            <SelectItem value="20">20 items</SelectItem>
                            <SelectItem value="30">30 items</SelectItem>
                            <SelectItem value="50">50 items</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button onClick={handlePreferencesUpdate} disabled={isSaving}>
                        {isSaving ? (
                          'Saving...'
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Preferences
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* About Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>About LearnBox</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Version</span>
                      <Badge variant="outline">1.0.0</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Last Updated
                      </span>
                      <span className="text-sm font-medium text-foreground">
                        February 2026
                      </span>
                    </div>
                    <Separator />
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm">
                        <FileText className="h-4 w-4 mr-2" />
                        Terms of Service
                      </Button>
                      <Button variant="outline" size="sm">
                        <Shield className="h-4 w-4 mr-2" />
                        Privacy Policy
                      </Button>
                      <Button variant="outline" size="sm">
                        <HelpCircle className="h-4 w-4 mr-2" />
                        Help Center
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
