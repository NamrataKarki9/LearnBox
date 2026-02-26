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
} from 'lucide-react';
import { toast } from 'sonner';
import { userAPI } from '../../services/api';

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

interface PrivacySettings {
  profileVisibility: 'public' | 'college' | 'private';
  showProgress: boolean;
  showActivity: boolean;
}

interface PreferenceSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  defaultView: 'grid' | 'list';
  resourcesPerPage: number;
}

export default function StudentSettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // State for user profile
  const [profile, setProfile] = useState<UserProfile>({
    id: user?.id || 0,
    username: user?.username || '',
    email: user?.email || '',
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    bio: '',
    phone: '',
    avatar: '',
    college: user?.college,
  });

  // State for password change
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
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

  // State for privacy
  const [privacy, setPrivacy] = useState<PrivacySettings>({
    profileVisibility: 'college',
    showProgress: true,
    showActivity: true,
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
        setPrivacy(settings.privacy || privacy);
        setPreferences(settings.preferences || preferences);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleProfileUpdate = async () => {
    setIsSaving(true);
    try {
      // TODO: Implement actual API call when backend endpoint is available
      // await userAPI.updateProfile(profile);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update session storage
      const storedUser = JSON.parse(sessionStorage.getItem('user') || '{}');
      const updatedUser = { ...storedUser, ...profile };
      sessionStorage.setItem('user', JSON.stringify(updatedUser));
      
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
      console.error('Error updating profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setIsSaving(true);
    try {
      // TODO: Implement actual API call when backend endpoint is available
      // await userAPI.changePassword({
      //   currentPassword: passwordForm.currentPassword,
      //   newPassword: passwordForm.newPassword,
      // });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error('Failed to change password');
      console.error('Error changing password:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleNotificationUpdate = async () => {
    setIsSaving(true);
    try {
      const settings = {
        notifications,
        privacy,
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

  const handlePrivacyUpdate = async () => {
    setIsSaving(true);
    try {
      const settings = {
        notifications,
        privacy,
        preferences,
      };
      localStorage.setItem('userSettings', JSON.stringify(settings));
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast.success('Privacy settings saved');
    } catch (error) {
      toast.error('Failed to update privacy settings');
      console.error('Error updating privacy:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreferencesUpdate = async () => {
    setIsSaving(true);
    try {
      const settings = {
        notifications,
        privacy,
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
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Settings className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
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
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
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
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
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
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Bell className="h-5 w-5" />
                    <span>Notifications</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('privacy')}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === 'privacy'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Shield className="h-5 w-5" />
                    <span>Privacy</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('preferences')}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === 'preferences'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Palette className="h-5 w-5" />
                    <span>Preferences</span>
                  </button>
                  <Separator className="my-2" />
                  <button
                    onClick={() => navigate('/student-dashboard')}
                    className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
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
                <TabsList className="w-full grid grid-cols-5">
                  <TabsTrigger value="profile">
                    <User className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger value="security">
                    <Lock className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger value="notifications">
                    <Bell className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger value="privacy">
                    <Shield className="h-4 w-4" />
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
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                          Profile Picture
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                          JPG, PNG or GIF. Max size 5MB.
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
                            setProfile({ ...profile, first_name: e.target.value })
                          }
                          placeholder="Enter your first name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last_name">Last Name</Label>
                        <Input
                          id="last_name"
                          value={profile.last_name}
                          onChange={(e) =>
                            setProfile({ ...profile, last_name: e.target.value })
                          }
                          placeholder="Enter your last name"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={profile.username}
                        onChange={(e) =>
                          setProfile({ ...profile, username: e.target.value })
                        }
                        placeholder="Enter your username"
                      />
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
                            setProfile({ ...profile, email: e.target.value })
                          }
                          placeholder="Enter your email"
                        />
                      </div>
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
                            setProfile({ ...profile, phone: e.target.value })
                          }
                          placeholder="+1 (555) 000-0000"
                        />
                      </div>
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
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {profile.bio?.length || 0}/500 characters
                      </p>
                    </div>

                    <Separator />

                    {/* College Information (Read-only) */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        College Information
                      </h3>
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            College
                          </span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {profile.college?.name || 'Not specified'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
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
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        Change Password
                      </h3>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="current_password">Current Password</Label>
                          <Input
                            id="current_password"
                            type="password"
                            value={passwordForm.currentPassword}
                            onChange={(e) =>
                              setPasswordForm({
                                ...passwordForm,
                                currentPassword: e.target.value,
                              })
                            }
                            placeholder="Enter current password"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="new_password">New Password</Label>
                          <Input
                            id="new_password"
                            type="password"
                            value={passwordForm.newPassword}
                            onChange={(e) =>
                              setPasswordForm({
                                ...passwordForm,
                                newPassword: e.target.value,
                              })
                            }
                            placeholder="Enter new password (min 8 characters)"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirm_password">Confirm New Password</Label>
                          <Input
                            id="confirm_password"
                            type="password"
                            value={passwordForm.confirmPassword}
                            onChange={(e) =>
                              setPasswordForm({
                                ...passwordForm,
                                confirmPassword: e.target.value,
                              })
                            }
                            placeholder="Confirm new password"
                          />
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
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                            Two-Factor Authentication
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Add an extra layer of security to your account
                          </p>
                        </div>
                        <Badge variant="secondary">Coming Soon</Badge>
                      </div>
                    </div>

                    <Separator />

                    {/* Active Sessions */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        Active Sessions
                      </h3>
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Monitor className="h-5 w-5 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                Current Session
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
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
                          <p className="text-sm text-gray-500 dark:text-gray-400">
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
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        Email Preferences
                      </h3>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="course-updates">Course Updates</Label>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
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
                            <p className="text-sm text-gray-500 dark:text-gray-400">
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
                            <p className="text-sm text-gray-500 dark:text-gray-400">
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
                            <p className="text-sm text-gray-500 dark:text-gray-400">
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
                            <p className="text-sm text-gray-500 dark:text-gray-400">
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
                          <p className="text-sm text-gray-500 dark:text-gray-400">
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

            {/* Privacy Section */}
            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Shield className="h-5 w-5" />
                      <span>Privacy Settings</span>
                    </CardTitle>
                    <CardDescription>
                      Control who can see your profile and activity
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Profile Visibility */}
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="profile-visibility" className="text-base">
                          Profile Visibility
                        </Label>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                          Who can see your profile information
                        </p>
                      </div>
                      <Select
                        value={privacy.profileVisibility}
                        onValueChange={(value: 'public' | 'college' | 'private') =>
                          setPrivacy({ ...privacy, profileVisibility: value })
                        }
                      >
                        <SelectTrigger id="profile-visibility">
                          <SelectValue placeholder="Select visibility" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">
                            <div className="flex flex-col items-start">
                              <span className="font-medium">Public</span>
                              <span className="text-xs text-gray-500">
                                Anyone can see your profile
                              </span>
                            </div>
                          </SelectItem>
                          <SelectItem value="college">
                            <div className="flex flex-col items-start">
                              <span className="font-medium">College Only</span>
                              <span className="text-xs text-gray-500">
                                Only students from your college
                              </span>
                            </div>
                          </SelectItem>
                          <SelectItem value="private">
                            <div className="flex flex-col items-start">
                              <span className="font-medium">Private</span>
                              <span className="text-xs text-gray-500">
                                Only you can see your profile
                              </span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    {/* Activity Settings */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        Activity & Progress
                      </h3>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="show-progress">Show Learning Progress</Label>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Display your course completion and quiz scores
                            </p>
                          </div>
                          <Switch
                            id="show-progress"
                            checked={privacy.showProgress}
                            onCheckedChange={(checked) =>
                              setPrivacy({ ...privacy, showProgress: checked })
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="show-activity">Show Recent Activity</Label>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Display your recent learning activities
                            </p>
                          </div>
                          <Switch
                            id="show-activity"
                            checked={privacy.showActivity}
                            onCheckedChange={(checked) =>
                              setPrivacy({ ...privacy, showActivity: checked })
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Data & Privacy */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        Data & Privacy
                      </h3>
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                              Your Privacy Matters
                            </h4>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                              We are committed to protecting your privacy. Your data is encrypted
                              and never shared with third parties without your consent.
                            </p>
                            <Button variant="link" className="text-blue-600 dark:text-blue-400 p-0 h-auto mt-2">
                              <FileText className="h-4 w-4 mr-1" />
                              Read Privacy Policy
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button onClick={handlePrivacyUpdate} disabled={isSaving}>
                        {isSaving ? (
                          'Saving...'
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Settings
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
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
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
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
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
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
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
                      <span className="text-sm text-gray-600 dark:text-gray-400">Version</span>
                      <Badge variant="outline">1.0.0</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Last Updated
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
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
