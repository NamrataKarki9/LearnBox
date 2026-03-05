import { useState } from 'react';
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
import { ArrowLeft, Bell, Camera, CheckCircle, FileText, Globe, Lock, LogOut, Mail, Monitor, Moon, Palette, Phone, Save, Settings, Shield, Sun, User } from 'lucide-react';
import { authAPI } from '../../services/api';
import { toast } from 'sonner';

type ThemeMode = 'light' | 'dark' | 'system';

const applyTheme = (theme: ThemeMode) => {
  const root = document.documentElement;
  if (theme === 'dark') return root.classList.add('dark');
  if (theme === 'light') return root.classList.remove('dark');
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) root.classList.add('dark');
  else root.classList.remove('dark');
};

export default function SuperAdminSettingsPage() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'preferences'>('profile');
  const [isSaving, setIsSaving] = useState(false);

  const [profile, setProfile] = useState({
    first_name: (user as any)?.first_name || '',
    last_name: (user as any)?.last_name || '',
    username: user?.username || '',
    email: user?.email || '',
    phone: (user as any)?.phone || '',
    bio: (user as any)?.bio || '',
    avatar: (user as any)?.avatar || '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('adminNotificationSettings');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      emailNotifications: true,
      collegeUpdates: true,
      userRegistrations: true,
      systemAnnouncements: true,
      weeklyReport: false,
    };
  });

  const [preferences, setPreferences] = useState<{ theme: ThemeMode; language: string }>(() => {
    try {
      const saved = localStorage.getItem('adminPreferences');
      if (saved) return JSON.parse(saved);
    } catch {}
    return { theme: 'system', language: 'en' };
  });

  const getInitials = () => {
    if (profile.first_name && profile.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }
    return (profile.username || profile.email || 'SA').substring(0, 2).toUpperCase();
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image size must be less than 5MB'); return; }
    if (!file.type.startsWith('image/')) { toast.error('Please upload an image file'); return; }
    const reader = new FileReader();
    reader.onloadend = () => setProfile(p => ({ ...p, avatar: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const handleProfileUpdate = async () => {
    setIsSaving(true);
    try {
      const response = await authAPI.updateProfile({
        username: profile.username,
        email: profile.email,
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone: profile.phone,
        bio: profile.bio,
        avatar: profile.avatar,
      });
      const updatedUser = response.data.user as any;
      updateUser(updatedUser);
      setProfile(p => ({ ...p, ...updatedUser }));
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    setIsSaving(true);
    try {
      await authAPI.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to change password');
    } finally {
      setIsSaving(false);
    }
  };

  const handleNotificationSave = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem('adminNotificationSettings', JSON.stringify(notifications));
      await new Promise(r => setTimeout(r, 300));
      toast.success('Notification preferences saved');
    } catch {
      toast.error('Failed to save notification preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreferencesSave = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem('adminPreferences', JSON.stringify(preferences));
      applyTheme(preferences.theme);
      await new Promise(r => setTimeout(r, 300));
      toast.success('Preferences saved');
    } catch {
      toast.error('Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'security' as const, label: 'Security', icon: Lock },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'preferences' as const, label: 'Preferences', icon: Palette },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Settings className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Account Settings</h1>
            </div>
            <Button variant="outline" onClick={() => navigate('/superadmin')}>
              <ArrowLeft className="h-4 w-4 mr-2" />Back to Dashboard
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* Sidebar Navigation */}
          <div className="hidden lg:block lg:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="p-4">
                <nav className="space-y-1">
                  {tabs.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setActiveTab(t.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeTab === t.id
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      <t.icon className="h-5 w-5" />
                      <span>{t.label}</span>
                    </button>
                  ))}
                  <Separator className="my-2" />
                  <button
                    onClick={logout}
                    className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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
            <Card>
              <CardContent className="p-2 flex gap-1 overflow-x-auto">
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                      activeTab === t.id
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <t.icon className="h-4 w-4" />
                    <span>{t.label}</span>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <User className="h-5 w-5" />
                      <span>Profile Information</span>
                    </CardTitle>
                    <CardDescription>Update your personal information and profile picture</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Avatar */}
                    <div className="flex items-center space-x-6">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={profile.avatar} />
                        <AvatarFallback className="text-2xl">{getInitials()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-foreground mb-2">Profile Picture</h3>
                        <p className="text-sm text-muted-foreground mb-3">JPG, PNG or GIF. Max size 5MB.</p>
                        <div className="flex items-center space-x-3">
                          <Button variant="outline" size="sm" onClick={() => document.getElementById('sa-avatar-upload')?.click()}>
                            <Camera className="h-4 w-4 mr-2" />Upload New
                          </Button>
                          {profile.avatar && (
                            <Button variant="ghost" size="sm" onClick={() => setProfile(p => ({ ...p, avatar: '' }))}>Remove</Button>
                          )}
                          <input id="sa-avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="sa-first-name">First Name</Label>
                        <Input id="sa-first-name" value={profile.first_name} onChange={(e) => setProfile(p => ({ ...p, first_name: e.target.value }))} placeholder="Enter your first name" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sa-last-name">Last Name</Label>
                        <Input id="sa-last-name" value={profile.last_name} onChange={(e) => setProfile(p => ({ ...p, last_name: e.target.value }))} placeholder="Enter your last name" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sa-username">Username</Label>
                      <Input id="sa-username" value={profile.username} onChange={(e) => setProfile(p => ({ ...p, username: e.target.value }))} placeholder="Enter your username" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sa-email">Email Address</Label>
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <Input id="sa-email" type="email" value={profile.email} onChange={(e) => setProfile(p => ({ ...p, email: e.target.value }))} placeholder="Enter your email" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sa-phone">Phone Number (Optional)</Label>
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <Input id="sa-phone" type="tel" value={profile.phone} onChange={(e) => setProfile(p => ({ ...p, phone: e.target.value }))} placeholder="+1 (555) 000-0000" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sa-bio">Bio</Label>
                      <Textarea id="sa-bio" value={profile.bio} onChange={(e) => setProfile(p => ({ ...p, bio: e.target.value }))} placeholder="Tell us a bit about yourself..." rows={4} maxLength={500} />
                      <p className="text-xs text-muted-foreground">{profile.bio?.length || 0}/500 characters</p>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-foreground">Account Information</h3>
                      <div className="bg-muted rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Role</span>
                          <Badge variant="outline">Super Admin</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Account Status</span>
                          <Badge variant="outline">Active</Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button onClick={handleProfileUpdate} disabled={isSaving}>
                        {isSaving ? 'Saving...' : <><Save className="h-4 w-4 mr-2" />Save Changes</>}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Lock className="h-5 w-5" />
                    <span>Password & Security</span>
                  </CardTitle>
                  <CardDescription>Manage your password and security settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-foreground">Change Password</h3>
                    <div className="space-y-2">
                      <Label>Current Password</Label>
                      <Input type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm(p => ({ ...p, currentPassword: e.target.value }))} placeholder="Enter current password" />
                    </div>
                    <div className="space-y-2">
                      <Label>New Password</Label>
                      <Input type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))} placeholder="Enter new password (min 6 characters)" />
                    </div>
                    <div className="space-y-2">
                      <Label>Confirm New Password</Label>
                      <Input type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))} placeholder="Confirm new password" />
                    </div>
                    <div className="flex justify-end">
                      <Button variant="outline" onClick={handlePasswordChange} disabled={isSaving}>
                        {isSaving ? 'Updating...' : 'Update Password'}
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-foreground">Two-Factor Authentication</h3>
                      <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                    </div>
                    <Badge variant="secondary">Coming Soon</Badge>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-foreground">Active Sessions</h3>
                    <div className="bg-muted rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Monitor className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium text-foreground">Current Session</p>
                            <p className="text-xs text-muted-foreground">Active now</p>
                          </div>
                        </div>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Bell className="h-5 w-5" />
                    <span>Notification Preferences</span>
                  </CardTitle>
                  <CardDescription>Choose what notifications you want to receive</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="sa-email-notif" className="text-base">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                    </div>
                    <Switch id="sa-email-notif" checked={notifications.emailNotifications} onCheckedChange={(c) => setNotifications((n: typeof notifications) => ({ ...n, emailNotifications: c }))} />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-foreground">Email Preferences</h3>
                    <div className="space-y-4">
                      {[
                        { key: 'collegeUpdates', label: 'College Updates', desc: 'New college registrations and changes' },
                        { key: 'userRegistrations', label: 'User Registrations', desc: 'New user sign-ups across all colleges' },
                        { key: 'systemAnnouncements', label: 'System Announcements', desc: 'Important platform updates and maintenance' },
                        { key: 'weeklyReport', label: 'Weekly Report', desc: 'Summary of platform activity and stats' },
                      ].map(({ key, label, desc }) => (
                        <div key={key} className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>{label}</Label>
                            <p className="text-sm text-muted-foreground">{desc}</p>
                          </div>
                          <Switch
                            checked={notifications[key as keyof typeof notifications] as boolean}
                            onCheckedChange={(c) => setNotifications((n: typeof notifications) => ({ ...n, [key]: c }))}
                            disabled={!notifications.emailNotifications}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleNotificationSave} disabled={isSaving}>
                      {isSaving ? 'Saving...' : <><Save className="h-4 w-4 mr-2" />Save Preferences</>}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Palette className="h-5 w-5" />
                      <span>Appearance & Preferences</span>
                    </CardTitle>
                    <CardDescription>Customize your dashboard experience</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      <div>
                        <Label className="text-base">Theme</Label>
                        <p className="text-sm text-muted-foreground mb-3">Choose your preferred color theme</p>
                      </div>
                      <Select value={preferences.theme} onValueChange={(v: ThemeMode) => setPreferences(p => ({ ...p, theme: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select theme" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light"><div className="flex items-center gap-2"><Sun className="h-4 w-4" /><span>Light</span></div></SelectItem>
                          <SelectItem value="dark"><div className="flex items-center gap-2"><Moon className="h-4 w-4" /><span>Dark</span></div></SelectItem>
                          <SelectItem value="system"><div className="flex items-center gap-2"><Monitor className="h-4 w-4" /><span>System</span></div></SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <div>
                        <Label className="text-base">Language</Label>
                        <p className="text-sm text-muted-foreground mb-3">Select your preferred language</p>
                      </div>
                      <Select value={preferences.language} onValueChange={(v) => setPreferences(p => ({ ...p, language: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select language" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en"><div className="flex items-center gap-2"><Globe className="h-4 w-4" /><span>English</span></div></SelectItem>
                          <SelectItem value="es"><div className="flex items-center gap-2"><Globe className="h-4 w-4" /><span>Español</span></div></SelectItem>
                          <SelectItem value="fr"><div className="flex items-center gap-2"><Globe className="h-4 w-4" /><span>Français</span></div></SelectItem>
                          <SelectItem value="de"><div className="flex items-center gap-2"><Globe className="h-4 w-4" /><span>Deutsch</span></div></SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex justify-end">
                      <Button onClick={handlePreferencesSave} disabled={isSaving}>
                        {isSaving ? 'Saving...' : <><Save className="h-4 w-4 mr-2" />Save Preferences</>}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

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
                      <span className="text-sm text-muted-foreground">Last Updated</span>
                      <span className="text-sm font-medium text-foreground">March 2026</span>
                    </div>
                    <Separator />
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm"><FileText className="h-4 w-4 mr-2" />Terms of Service</Button>
                      <Button variant="outline" size="sm"><Shield className="h-4 w-4 mr-2" />Privacy Policy</Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
