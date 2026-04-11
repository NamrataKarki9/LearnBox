/**
 * Super Admin Settings Page — Paper & Ink Theme
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { User, Lock, Palette, Camera, Save, Eye, EyeOff, AlertCircle, Sun, Moon } from 'lucide-react';
import { authAPI } from '../../services/api';
import { toast } from 'sonner';
import { applyAdminTheme, getStoredAdminTheme, saveAdminTheme, type AdminTheme } from '../../utils/theme';

import { P } from '../../constants/theme';

export default function SuperAdminSettingsPage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences'>('profile');
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState({ currentPassword: false, newPassword: false, confirmPassword: false });
  const [themeMode, setThemeMode] = useState<AdminTheme>(() => getStoredAdminTheme());

  const [profile, setProfile] = useState({ first_name: (user as any)?.first_name || '', last_name: (user as any)?.last_name || '', username: user?.username || '', email: user?.email || '', phone: (user as any)?.phone || '', bio: (user as any)?.bio || '', avatar: (user as any)?.avatar || '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [preferences, setPreferences] = useState({ theme: 'system', language: 'en' });

  // Apply saved admin theme on mount
  useEffect(() => {
    const savedTheme = getStoredAdminTheme();
    applyAdminTheme(savedTheme);
  }, []);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [meRes, settingsRes] = await Promise.all([authAPI.getMe(), authAPI.getSettings()]);
        const mU = meRes.data.user || meRes.data;
        setProfile(p => ({ ...p, first_name: mU?.first_name||'', last_name: mU?.last_name||'', username: mU?.username||'', email: mU?.email||'', phone: mU?.phone||'', bio: mU?.bio||'', avatar: mU?.avatar||'' }));
        const s = settingsRes.data?.data;
        if (s?.preferences) setPreferences(s.preferences);
      } catch (error: any) { toast.error(error.response?.data?.error || 'Failed to load settings'); }
    };
    loadSettings();
  }, []);

  const getInitials = () => { if (profile.first_name && profile.last_name) return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase(); return (profile.username || profile.email || 'SA').substring(0, 2).toUpperCase(); };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    if (f.size > 5 * 1024 * 1024) { toast.error('Max 5MB'); return; }
    if (!f.type.startsWith('image/')) { toast.error('Images only'); return; }
    const r = new FileReader(); r.onloadend = () => { setProfile(p => ({ ...p, avatar: r.result as string })); setHasChanges(true); }; r.readAsDataURL(f);
  };

  const handleProfileUpdate = async () => {
    setIsSaving(true);
    try {
      const u: any = {};
      if (profile.first_name) u.first_name = profile.first_name;
      if (profile.last_name) u.last_name = profile.last_name;
      if (profile.username) u.username = profile.username;
      if (profile.email) u.email = profile.email;
      if (profile.phone) u.phone = profile.phone;
      if (profile.bio) u.bio = profile.bio;
      if (profile.avatar?.startsWith('data:')) u.avatar = profile.avatar; else if (profile.avatar === '') u.avatar = null;

      const r = await authAPI.updateProfile(u);
      const updatedUser = r.data.user as any;
      updateUser(updatedUser);
      setProfile(p => ({ ...p, first_name: updatedUser?.first_name||'', last_name: updatedUser?.last_name||'', username: updatedUser?.username||'', email: updatedUser?.email||'', phone: updatedUser?.phone||'', bio: updatedUser?.bio||'', avatar: profile.avatar?.startsWith('data:')?profile.avatar:updatedUser?.avatar }));
      setHasChanges(false);
      toast.success('Profile updated');
    } catch (e: any) { toast.error(e.response?.data?.error || 'Update failed'); } finally { setIsSaving(false); }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { toast.error('Passwords do not match'); return; }
    if (passwordForm.newPassword.length < 6) { toast.error('Min 6 chars'); return; }
    setIsSaving(true);
    try {
      await authAPI.changePassword({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
      toast.success('Password changed'); setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (e: any) { toast.error(e.response?.data?.error || 'Change failed'); } finally { setIsSaving(false); }
  };

  const handlePreferencesUpdate = async () => {
    setIsSaving(true);
    try {
      saveAdminTheme(themeMode);
      applyAdminTheme(themeMode);
      setHasChanges(false);
      toast.success('Theme preferences saved and applied');
    } catch {
      toast.error('Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'profile' as const, label: 'Identity', icon: User },
    { id: 'security' as const, label: 'Security', icon: Lock },
    { id: 'preferences' as const, label: 'System Defaults', icon: Palette },
  ];

  const iS: React.CSSProperties = { width: '100%', padding: '9px 12px', fontFamily: "'Lora', Georgia, serif", fontSize: 13.5, color: P.ink, background: P.parchment, border: 'none', boxShadow: `inset 0 0 0 1px ${P.sandLight}`, outline: 'none', boxSizing: 'border-box' };
  const iL: React.CSSProperties = { fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: P.inkSecondary, display: 'block', marginBottom: 2 };
  const softPanel = `inset 0 0 0 1px ${P.sandLight}, 0 12px 28px rgba(28,18,8,0.05)`;
  const themeCardStyle = (active: boolean): React.CSSProperties => ({
    padding: '18px 18px 16px',
    background: active ? P.parchmentLight : P.parchmentDark,
    color: P.ink,
    border: 'none',
    boxShadow: active
      ? `inset 0 0 0 1px ${P.sand}, 0 10px 24px rgba(28,18,8,0.08)`
      : `inset 0 0 0 1px ${P.sandLight}`,
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease',
  });

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', minHeight: '80vh' }}>
      
      <div style={{ marginBottom: 32, paddingBottom: 20, borderBottom: `1px solid ${P.sand}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: P.purple, marginBottom: 6 }}>Global Preferences</div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 800, color: P.ink, margin: 0 }}>System Configuration</h1>
        </div>
        <div>
          {hasChanges && <span style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 10, fontWeight: 700, color: P.vermillion, textTransform: 'uppercase', letterSpacing: '0.06em', boxShadow: `inset 0 0 0 1px ${P.vermillion}`, padding: '4px 8px', marginRight: 16 }}>Unsaved Changes</span>}
          <button onClick={() => navigate('/superadmin')} style={{ padding: '8px 16px', background: 'transparent', border: 'none', boxShadow: `inset 0 0 0 1px ${P.sand}`, fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer' }}>Back to Operations</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) 4fr', gap: 40, flex: 1 }}>
        <div>
          <nav style={{ display: 'flex', flexDirection: 'column' }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ padding: '12px 16px', background: activeTab === t.id ? P.parchmentDark : 'transparent', color: activeTab === t.id ? P.ink : P.ink, border: 'none', borderLeft: activeTab === t.id ? `3px solid ${P.purple}` : `3px solid transparent`, boxShadow: activeTab === t.id ? `inset 0 0 0 1px ${P.sandLight}` : 'none', fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.1s', textAlign: 'left', marginBottom: -1 }}>
                <t.icon size={16} /> {t.label}
              </button>
            ))}
          </nav>
        </div>

        <div style={{ background: P.parchmentLight, boxShadow: softPanel, padding: 32 }}>
          {activeTab === 'profile' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
              <section>
                <div style={{ marginBottom: 24 }}>
                  <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 800, color: P.ink, margin: '0 0 4px', borderBottom: `1px solid ${P.sand}`, paddingBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}><User size={18} color={P.purple}/> Global Identity</h2>
                </div>

                <div style={{ display: 'flex', gap: 24, marginBottom: 32, alignItems: 'center' }}>
                  <div style={{ width: 80, height: 80, background: P.parchmentDark, boxShadow: `inset 0 0 0 1px ${P.sand}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {profile.avatar ? <img src={profile.avatar} alt="Avatar" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 800, color: P.inkMuted }}>{getInitials()}</span>}
                  </div>
                  <div>
                    <input id="aup" type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
                    <button onClick={() => document.getElementById('aup')?.click()} style={{ padding: '6px 12px', background: 'transparent', border: 'none', boxShadow: `inset 0 0 0 1px ${P.sand}`, fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}><Camera size={12}/> Change Portrait</button>
                    {profile.avatar && <button onClick={() => {setProfile({...profile, avatar: ''}); setHasChanges(true);}} style={{ background: 'none', border: 'none', color: P.vermillion, fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 10, fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer' }}>Remove</button>}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 20 }}>
                  <div><label style={iL}>First Name</label><input style={iS} value={profile.first_name} onChange={e=>{setProfile({...profile,first_name:e.target.value});setHasChanges(true);}} /></div>
                  <div><label style={iL}>Last Name</label><input style={iS} value={profile.last_name} onChange={e=>{setProfile({...profile,last_name:e.target.value});setHasChanges(true);}} /></div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 24 }}>
                  <div><label style={iL}>Username <span style={{ color: P.vermillion }}>*</span></label><input style={iS} value={profile.username} onChange={e=>{setProfile({...profile,username:e.target.value});setHasChanges(true);}} /></div>
                  <div><label style={iL}>Email <span style={{ color: P.vermillion }}>*</span></label><input type="email" style={iS} value={profile.email} onChange={e=>{setProfile({...profile,email:e.target.value});setHasChanges(true);}} /></div>
                  <div><label style={iL}>Phone</label><input type="tel" style={iS} value={profile.phone} onChange={e=>{setProfile({...profile,phone:e.target.value});setHasChanges(true);}} /></div>
                  <div><label style={iL}>Administrative Bio</label><textarea style={{...iS, resize:'vertical'}} rows={2} value={profile.bio} onChange={e=>{setProfile({...profile,bio:e.target.value});setHasChanges(true);}} /></div>
                </div>

                <button onClick={handleProfileUpdate} disabled={isSaving} style={{ padding: '10px 20px', background: P.inkMuted, color: '#fff', border: 'none', fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', cursor: isSaving?'default':'pointer', display: 'flex', alignItems: 'center', gap: 8 }}><Save size={14}/> {isSaving?'Saving...':'Save '}</button>
              </section>
            </div>
          )}

          {activeTab === 'security' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
              <section>
                <div style={{ marginBottom: 24 }}>
                  <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 800, color: P.ink, margin: '0 0 4px', borderBottom: `1px solid ${P.sand}`, paddingBottom: 8 }}>Cryptographic Keys</h2>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 24, maxWidth: 400 }}>
                  {['currentPassword','newPassword','confirmPassword'].map((pf) => (
                    <div key={pf} style={{ position: 'relative' }}>
                      <label style={iL}>{pf.replace(/([A-Z])/g, ' $1').trim()}</label>
                      <input type={(showPasswordFields as any)[pf] ? 'text' : 'password'} style={{...iS, paddingRight: 32}} value={(passwordForm as any)[pf]} onChange={e=>setPasswordForm({...passwordForm, [pf]: e.target.value})} />
                      <button onClick={()=>setShowPasswordFields({...showPasswordFields, [pf]: !(showPasswordFields as any)[pf]})} style={{ position: 'absolute', right: 0, bottom: 8, background: 'none', border: 'none', cursor: 'pointer', color: P.inkMuted }}>
                        {(showPasswordFields as any)[pf] ? <EyeOff size={14}/> : <Eye size={14}/>}
                      </button>
                    </div>
                  ))}
                </div>
                
                <button onClick={handlePasswordChange} disabled={isSaving} style={{ padding: '10px 20px', background: 'transparent', color: P.ink, border: 'none', boxShadow: `inset 0 0 0 1px ${P.sand}`, fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', cursor: isSaving?'default':'pointer' }}>{isSaving?'Enacting...':'Re-key Credentials'}</button>
              </section>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 800, color: P.ink, margin: '0 0 24px', borderBottom: `1px solid ${P.sand}`, paddingBottom: 8 }}>System Preferences</h2>
              <div style={{ background: P.parchmentDark, boxShadow: `inset 0 0 0 1px ${P.sandLight}`, padding: 24, display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 640 }}>
                <div>
                  <label style={iL}>Active Language</label>
                  <select style={iS} value={preferences.language} onChange={async(e)=>{const nv=e.target.value; setPreferences({...preferences,language:nv}); await authAPI.updatePreferences({...preferences,language:nv}); toast.success('Language updated');}}>
                    <option value="en">English (US)</option><option value="es">Español</option><option value="fr">Français</option><option value="de">Deutsch</option>
                  </select>
                </div>

                <div>
                  <label style={{ ...iL, marginBottom: 12 }}>Interface Theme</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <button
                      onClick={() => { setThemeMode('light'); setHasChanges(true); }}
                      style={themeCardStyle(themeMode === 'light')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <Sun size={16} color={P.ink} />
                        <span style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Light</span>
                      </div>
                      <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 12, color: P.inkSecondary, margin: 0, lineHeight: 1.5 }}>Bright, editorial styling for the default admin experience.</p>
                    </button>
                    <button
                      onClick={() => { setThemeMode('dark'); setHasChanges(true); }}
                      style={themeCardStyle(themeMode === 'dark')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <Moon size={16} color={P.ink} />
                        <span style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Dark</span>
                      </div>
                      <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 12, color: P.inkSecondary, margin: 0, lineHeight: 1.5 }}>Lower-glare contrast for longer admin sessions and evening work.</p>
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 10, fontWeight: 700, color: P.inkSecondary, textTransform: 'uppercase' }}>Current Theme: <span style={{ color: P.ink, fontWeight: 800 }}>{themeMode === 'light' ? 'Light' : 'Dark'}</span></div>
                  <button onClick={handlePreferencesUpdate} disabled={isSaving} style={{ padding: '10px 20px', background: P.inkMuted, color: '#fff', border: 'none', fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', cursor: isSaving?'default':'pointer', display: 'flex', alignItems: 'center', gap: 8 }}><Save size={14}/> {isSaving?'Saving...':'Save Preferences'}</button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
