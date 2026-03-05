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
import { ArrowLeft, Bell, BookOpen, Building2, Camera, HelpCircle, Lock, LogOut, Mail, Moon, Palette, Phone, Save, Settings, Sun, User, Monitor } from 'lucide-react';
import { toast } from 'sonner';

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
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('profile');
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [profile, setProfile] = useState({
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    username: user?.username || '',
    email: user?.email || '',
    phone: '',
    avatar: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
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

  useEffect(() => applyTheme(preferences.theme), [preferences.theme]);

  const save = async (msg: string) => {
    setIsSaving(true);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ profile, resourcePrefs, notificationPrefs, preferences }));
    await new Promise((r) => setTimeout(r, 350));
    setIsSaving(false);
    setHasChanges(false);
    toast.success(msg);
  };

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
                        <Input id="admin-first-name" value={profile.firstName} onChange={(e) => { setProfile({ ...profile, firstName: e.target.value }); setHasChanges(true); }} placeholder="Enter your first name" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="admin-last-name">Last Name</Label>
                        <Input id="admin-last-name" value={profile.lastName} onChange={(e) => { setProfile({ ...profile, lastName: e.target.value }); setHasChanges(true); }} placeholder="Enter your last name" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="admin-username">Username</Label>
                      <Input id="admin-username" value={profile.username} onChange={(e) => { setProfile({ ...profile, username: e.target.value }); setHasChanges(true); }} placeholder="Enter your username" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="admin-email">Email Address</Label>
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <Input id="admin-email" type="email" value={profile.email} onChange={(e) => { setProfile({ ...profile, email: e.target.value }); setHasChanges(true); }} placeholder="Enter your email" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="admin-phone">Phone Number (Optional)</Label>
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <Input id="admin-phone" type="tel" value={profile.phone} onChange={(e) => { setProfile({ ...profile, phone: e.target.value }); setHasChanges(true); }} placeholder="+1 (555) 000-0000" />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button onClick={() => save('Profile saved')} disabled={isSaving}>
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
                    <div className="space-y-2"><Label>Current Password</Label><Input type="password" value={profile.currentPassword} onChange={(e) => setProfile({ ...profile, currentPassword: e.target.value })} /></div>
                    <div className="space-y-2"><Label>New Password</Label><Input type="password" value={profile.newPassword} onChange={(e) => setProfile({ ...profile, newPassword: e.target.value })} /></div>
                    <div className="space-y-2"><Label>Confirm New Password</Label><Input type="password" value={profile.confirmPassword} onChange={(e) => setProfile({ ...profile, confirmPassword: e.target.value })} /></div>
                    <div className="flex justify-end"><Button variant="outline" onClick={() => save('Password updated')} disabled={isSaving}>{isSaving ? 'Saving...' : 'Update Password'}</Button></div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'college' && <Card><CardHeader><CardTitle>College Information</CardTitle><CardDescription>Managed by Super Admin.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><Label>Name</Label><Input disabled value={college.name} /></div><div className="space-y-2"><Label>Code</Label><Input disabled value={college.code} /></div><div className="space-y-2"><Label>Notes</Label><Textarea disabled value="Contact Super Admin to update institution details." /></div></CardContent></Card>}

            {activeTab === 'resources' && <Card><CardHeader><CardTitle>Resource Preferences</CardTitle></CardHeader><CardContent className="space-y-6"><div className="space-y-2"><Label>Default Year</Label><Select value={resourcePrefs.defaultYear} onValueChange={(v) => { setResourcePrefs({ ...resourcePrefs, defaultYear: v }); setHasChanges(true); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1">Year 1</SelectItem><SelectItem value="2">Year 2</SelectItem><SelectItem value="3">Year 3</SelectItem><SelectItem value="4">Year 4</SelectItem></SelectContent></Select></div><div className="flex items-center justify-between"><span className="text-sm text-foreground">Auto-fill module info</span><Switch checked={resourcePrefs.autoFillModule} onCheckedChange={(c) => { setResourcePrefs({ ...resourcePrefs, autoFillModule: c }); setHasChanges(true); }} /></div><div className="flex items-center justify-between"><span className="text-sm text-foreground">Require description</span><Switch checked={resourcePrefs.requireDescription} onCheckedChange={(c) => { setResourcePrefs({ ...resourcePrefs, requireDescription: c }); setHasChanges(true); }} /></div><div className="flex justify-end"><Button onClick={() => save('Resource preferences saved')} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</Button></div></CardContent></Card>}

            {activeTab === 'notifications' && <Card><CardHeader><CardTitle>Notifications</CardTitle></CardHeader><CardContent className="space-y-5"><div className="flex items-center justify-between"><span className="text-sm text-foreground">Email notifications</span><Switch checked={notificationPrefs.emailNotifications} onCheckedChange={(c) => { setNotificationPrefs({ ...notificationPrefs, emailNotifications: c }); setHasChanges(true); }} /></div><div className="flex items-center justify-between"><span className="text-sm text-foreground">Resource upload alerts</span><Switch checked={notificationPrefs.resourceUploadAlerts} onCheckedChange={(c) => { setNotificationPrefs({ ...notificationPrefs, resourceUploadAlerts: c }); setHasChanges(true); }} /></div><div className="flex items-center justify-between"><span className="text-sm text-foreground">Weekly digest</span><Switch checked={notificationPrefs.weeklyDigest} onCheckedChange={(c) => { setNotificationPrefs({ ...notificationPrefs, weeklyDigest: c }); setHasChanges(true); }} /></div><div className="flex justify-end"><Button onClick={() => save('Notification settings saved')} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</Button></div></CardContent></Card>}

            {activeTab === 'preferences' && <Card><CardHeader><CardTitle>Appearance & Preferences</CardTitle><CardDescription>Theme support added for college admin dashboard.</CardDescription></CardHeader><CardContent className="space-y-6"><div className="space-y-2"><Label>Theme</Label><Select value={preferences.theme} onValueChange={(v: ThemeMode) => { setPreferences({ ...preferences, theme: v }); setHasChanges(true); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="light"><div className="flex items-center gap-2"><Sun className="h-4 w-4" />Light</div></SelectItem><SelectItem value="dark"><div className="flex items-center gap-2"><Moon className="h-4 w-4" />Dark</div></SelectItem><SelectItem value="system"><div className="flex items-center gap-2"><Monitor className="h-4 w-4" />System</div></SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>Default View</Label><Select value={preferences.defaultView} onValueChange={(v) => { setPreferences({ ...preferences, defaultView: v }); setHasChanges(true); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="table">Table</SelectItem><SelectItem value="grid">Grid</SelectItem><SelectItem value="list">List</SelectItem></SelectContent></Select></div><div className="flex items-center justify-between"><span className="text-sm text-foreground">Compact mode</span><Switch checked={preferences.compactMode} onCheckedChange={(c) => { setPreferences({ ...preferences, compactMode: c }); setHasChanges(true); }} /></div><div className="flex justify-end"><Button onClick={() => save('Preferences saved')} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</Button></div></CardContent></Card>}

        </div>
        </div>
      </div>
    </div>
  );
}
