/**
 * Admin Settings Page — Paper & Ink Theme
 */

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { User, Building2, BookOpen, Bell, Palette, Camera, Save, Eye, EyeOff, AlertCircle, Sun, Moon, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { authAPI } from '../../services/api';
import { validateFirstName, validateLastName, validateEmail, validateUsername, validatePhone, validatePassword, validatePasswordMatch, sanitizeFirstName, sanitizeLastName, sanitizePhone, sanitizeUsername } from '../../utils/validators';
import { applyAdminTheme, getStoredAdminTheme, saveAdminTheme, type AdminTheme } from '../../utils/theme';

import { P } from '../../constants/theme';

export default function AdminSettingsPage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('profile');
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState({ currentPassword: false, newPassword: false, confirmPassword: false });
  const [themeMode, setThemeMode] = useState<AdminTheme>(() => getStoredAdminTheme());

  const [profile, setProfile] = useState({ firstName: user?.first_name || '', lastName: user?.last_name || '', username: user?.username || '', email: user?.email || '', phone: user?.phone || '', avatar: user?.avatar || '', currentPassword: '', newPassword: '', confirmPassword: '' });
  const [profileErrors, setProfileErrors] = useState({ firstName: '', lastName: '', username: '', email: '', phone: '' });
  const [passwordErrors, setPasswordErrors] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const getInitials = () => { if (profile.firstName && profile.lastName) return `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase(); return (profile.username || profile.email || 'AD').substring(0, 2).toUpperCase(); };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Max 5MB'); return; }
    if (!file.type.startsWith('image/')) { toast.error('Images only'); return; }
    const r = new FileReader(); r.onloadend = () => { setProfile({ ...profile, avatar: r.result as string }); setHasChanges(true); }; r.readAsDataURL(file);
  };

  const handlePFC = (f: 'firstName'|'lastName'|'username'|'phone'|'email', v: string) => {
    let sv = v;
    if (f === 'firstName') sv = sanitizeFirstName(v); else if (f === 'lastName') sv = sanitizeLastName(v); else if (f === 'username') sv = sanitizeUsername(v); else if (f === 'phone') sv = sanitizePhone(v);
    setProfile({ ...profile, [f]: sv }); setHasChanges(true);
  };

  const handlePBlur = (f: 'firstName'|'lastName'|'username'|'phone'|'email') => {
    let e = ''; const v = profile[f];
    if (f === 'firstName' && v) e = validateFirstName(v).error || '';
    if (f === 'lastName' && v) e = validateLastName(v).error || '';
    if (f === 'username' && v) e = validateUsername(v).error || '';
    if (f === 'email' && v) e = validateEmail(v).error || '';
    if (f === 'phone' && v) e = validatePhone(v).error || '';
    setProfileErrors({ ...profileErrors, [f]: e });
  };

  const handleProfileUpdate = async () => {
    const n = { firstName: '', lastName: '', username: '', email: '', phone: '' };
    if (profile.firstName) n.firstName = validateFirstName(profile.firstName).error || '';
    if (profile.lastName) n.lastName = validateLastName(profile.lastName).error || '';
    if (!profile.username) n.username = 'Required'; else n.username = validateUsername(profile.username).error || '';
    if (!profile.email) n.email = 'Required'; else n.email = validateEmail(profile.email).error || '';
    if (profile.phone) n.phone = validatePhone(profile.phone).error || '';
    setProfileErrors(n);
    if (Object.values(n).some(e => e)) { toast.error('Fix errors'); return; }

    setIsSaving(true);
    try {
      const u: any = {};
      if (profile.firstName) u.first_name = profile.firstName; if (profile.lastName) u.last_name = profile.lastName;
      if (profile.username) u.username = profile.username; if (profile.email) u.email = profile.email; if (profile.phone) u.phone = profile.phone;
      if (profile.avatar?.startsWith('data:')) u.avatar = profile.avatar; else if (profile.avatar === '') u.avatar = null;

      const r = await authAPI.updateProfile(u); const uu = r.data.user as any; updateUser(uu);
      setProfile(p => ({ ...p, firstName: uu.first_name||'', lastName: uu.last_name||'', username: uu.username||'', email: uu.email||'', phone: uu.phone||'', avatar: uu.avatar||'', currentPassword: '', newPassword: '', confirmPassword: '' }));
      setHasChanges(false); toast.success('Profile updated');
    } catch { toast.error('Update failed'); } finally { setIsSaving(false); }
  };

  const handlePasswordChange = async () => {
    const n = { currentPassword: '', newPassword: '', confirmPassword: '' };
    if (!profile.currentPassword) n.currentPassword = 'Required';
    if (!profile.newPassword) n.newPassword = 'Required'; else n.newPassword = validatePassword(profile.newPassword).errors[0] || '';
    if (!profile.confirmPassword) n.confirmPassword = 'Required'; else n.confirmPassword = validatePasswordMatch(profile.newPassword, profile.confirmPassword).error || '';
    setPasswordErrors(n);
    if (Object.values(n).some(e => e)) { toast.error('Fix errors'); return; }

    setIsSaving(true);
    try {
      await authAPI.changePassword({ currentPassword: profile.currentPassword, newPassword: profile.newPassword });
      toast.success('Password changed');
      setProfile({ ...profile, currentPassword: '', newPassword: '', confirmPassword: '' }); setPasswordErrors({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch { toast.error('Failed to change password'); } finally { setIsSaving(false); }
  };

  const college = useMemo(() => ({ name: user?.college?.name || 'College', code: user?.college?.code || 'N/A' }), [user?.college]);

  const handlePreferencesUpdate = async () => {
    setIsSaving(true);
    try {
      saveAdminTheme(themeMode);
      applyAdminTheme(themeMode);
      setHasChanges(false);
      toast.success('Preferences saved');
    } catch {
      toast.error('Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'college', label: 'College', icon: Building2 },
    { id: 'resources', label: 'Resources', icon: BookOpen },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'preferences', label: 'Preferences', icon: Palette },
  ];

  const iS: React.CSSProperties = { width: '100%', padding: '9px 12px', fontFamily: "'Lora', Georgia, serif", fontSize: 13.5, color: P.ink, background: 'transparent', border: 'none', borderBottom: `2px solid ${P.ink}`, outline: 'none', boxSizing: 'border-box' };
  const iL: React.CSSProperties = { fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: P.inkSecondary, display: 'block', marginBottom: 2 };
  const softPanel: React.CSSProperties = { background: P.parchmentLight, boxShadow: `inset 0 0 0 1px ${P.sandLight}, 0 12px 28px rgba(28,18,8,0.04)` };
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
  const errorMsg = (m: string) => <p style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 10, color: P.vermillion, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={10}/> {m}</p>;

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', minHeight: '80vh' }}>
      
      <div style={{ marginBottom: 32, paddingBottom: 20, borderBottom: `1px solid ${P.sandLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: P.vermillion, marginBottom: 6 }}>Configuration</div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 800, color: P.ink, margin: 0 }}>Admin Settings</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>{hasChanges && <span style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 10, fontWeight: 700, color: P.vermillion, textTransform: 'uppercase', letterSpacing: '0.06em', border: `1px solid ${P.vermillion}`, padding: '4px 8px' }}>Unsaved Changes</span>}<button onClick={() => navigate('/admin/dashboard')} style={{ padding: '8px 12px', background: 'transparent', border: `1px solid ${P.sand}`, fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: P.ink, transition: 'all 0.1s' }} onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${P.ink}`; }} onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}><ArrowLeft size={14}/> Dashboard</button></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) 4fr', gap: 40, flex: 1 }}>
        {/* Navigation */}
        <div>
          <nav style={{ display: 'flex', flexDirection: 'column' }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ padding: '12px 16px', background: activeTab === t.id ? P.ink : 'transparent', color: activeTab === t.id ? P.parchmentLight : P.ink, border: 'none', borderLeft: activeTab === t.id ? `3px solid ${P.vermillion}` : `1px solid ${P.sand}`, fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.1s', textAlign: 'left', marginBottom: -1 }}>
                <t.icon size={16} /> {t.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div style={{ ...softPanel, padding: 32 }}>
          {activeTab === 'profile' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
              
              {/* Profile Sec */}
              <section>
                <div style={{ marginBottom: 24 }}>
                  <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 800, color: P.ink, margin: '0 0 4px', borderBottom: `1px solid ${P.sand}`, paddingBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}><User size={18} color={P.vermillion}/> Identity</h2>
                </div>

                <div style={{ display: 'flex', gap: 24, marginBottom: 32, alignItems: 'center' }}>
                  <div style={{ width: 80, height: 80, border: `2px solid ${P.ink}`, background: P.parchmentDark, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {profile.avatar ? <img src={profile.avatar} alt="Avatar" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 800, color: P.inkMuted }}>{getInitials()}</span>}
                  </div>
                  <div>
                    <input id="aup" type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
                    <button onClick={() => document.getElementById('aup')?.click()} style={{ padding: '6px 12px', background: 'transparent', border: `1px solid ${P.ink}`, fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}><Camera size={12}/> Change Portrait</button>
                    {profile.avatar && <button onClick={() => {setProfile({...profile, avatar: ''}); setHasChanges(true);}} style={{ background: 'none', border: 'none', color: P.vermillion, fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 10, fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer' }}>Remove</button>}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 20 }}>
                  <div><label style={iL}>First Name</label><input style={{...iS, borderBottomColor: profileErrors.firstName?P.vermillion:P.ink}} value={profile.firstName} onChange={e=>handlePFC('firstName',e.target.value)} onBlur={()=>handlePBlur('firstName')} />{profileErrors.firstName && errorMsg(profileErrors.firstName)}</div>
                  <div><label style={iL}>Last Name</label><input style={{...iS, borderBottomColor: profileErrors.lastName?P.vermillion:P.ink}} value={profile.lastName} onChange={e=>handlePFC('lastName',e.target.value)} onBlur={()=>handlePBlur('lastName')} />{profileErrors.lastName && errorMsg(profileErrors.lastName)}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 24 }}>
                  <div><label style={iL}>Username <span style={{ color: P.vermillion }}>*</span></label><input style={{...iS, borderBottomColor: profileErrors.username?P.vermillion:P.ink}} value={profile.username} onChange={e=>handlePFC('username',e.target.value)} onBlur={()=>handlePBlur('username')} />{profileErrors.username && errorMsg(profileErrors.username)}</div>
                  <div><label style={iL}>Email <span style={{ color: P.vermillion }}>*</span></label><input type="email" style={{...iS, borderBottomColor: profileErrors.email?P.vermillion:P.ink}} value={profile.email} onChange={e=>handlePFC('email',e.target.value)} onBlur={()=>handlePBlur('email')} />{profileErrors.email && errorMsg(profileErrors.email)}</div>
                  <div><label style={iL}>Phone</label><input type="tel" style={{...iS, borderBottomColor: profileErrors.phone?P.vermillion:P.ink}} value={profile.phone} onChange={e=>handlePFC('phone',e.target.value)} onBlur={()=>handlePBlur('phone')} />{profileErrors.phone && errorMsg(profileErrors.phone)}</div>
                </div>

                <button onClick={handleProfileUpdate} disabled={isSaving} style={{ padding: '10px 20px', background: P.inkMuted, color: '#fff', border: 'none', fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', cursor: isSaving?'default':'pointer', display: 'flex', alignItems: 'center', gap: 8 }}><Save size={14}/> {isSaving?'Saving...':'Save Profile'}</button>
              </section>

              {/* Password Sec */}
              <section>
                <div style={{ marginBottom: 24 }}>
                  <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 800, color: P.ink, margin: '0 0 4px', borderBottom: `1px solid ${P.sand}`, paddingBottom: 8 }}>Security</h2>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 24, maxWidth: 400 }}>
                  {['currentPassword','newPassword','confirmPassword'].map((pf, i) => (
                    <div key={pf} style={{ position: 'relative' }}>
                      <label style={iL}>{pf.replace(/([A-Z])/g, ' $1').trim()}</label>
                      <input type={(showPasswordFields as any)[pf] ? 'text' : 'password'} style={{...iS, borderBottomColor: (passwordErrors as any)[pf]?P.vermillion:P.ink, paddingRight: 32}} value={(profile as any)[pf]} onChange={e=>setProfile({...profile, [pf]: e.target.value})} />
                      <button onClick={()=>setShowPasswordFields({...showPasswordFields, [pf]: !(showPasswordFields as any)[pf]})} style={{ position: 'absolute', right: 0, bottom: 8, background: 'none', border: 'none', cursor: 'pointer', color: P.inkMuted }}>
                        {(showPasswordFields as any)[pf] ? <EyeOff size={14}/> : <Eye size={14}/>}
                      </button>
                      {(passwordErrors as any)[pf] && errorMsg((passwordErrors as any)[pf])}
                    </div>
                  ))}
                </div>
                
                <button onClick={handlePasswordChange} disabled={isSaving} style={{ padding: '10px 20px', background: 'transparent', color: P.ink, border: `2px solid ${P.ink}`, fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', cursor: isSaving?'default':'pointer' }}>{isSaving?'Changing...':'Update Password'}</button>
              </section>

            </div>
          )}

          {activeTab === 'college' && (
            <div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 800, color: P.ink, margin: '0 0 24px', borderBottom: `1px solid ${P.sand}`, paddingBottom: 8 }}>College Affiliation</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 400 }}>
                <div><label style={iL}>College Name</label><div style={{ ...iS, color: P.inkMuted, borderBottomColor: P.sand }}>{college.name}</div></div>
                <div><label style={iL}>College Code</label><div style={{ ...iS, color: P.inkMuted, borderBottomColor: P.sand }}>{college.code}</div></div>
                <div style={{ marginTop: 24, padding: 16, background: P.parchmentDark, borderLeft: `3px solid ${P.ink}`, fontFamily: "'Lora', Georgia, serif", fontSize: 13, color: P.inkSecondary, lineHeight: 1.5 }}>If these details are incorrect, please contact the Super Administrator to update your college's official record.</div>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 800, color: P.ink, margin: '0 0 24px', borderBottom: `1px solid ${P.sand}`, paddingBottom: 8 }}>System Preferences</h2>
              <div style={{ background: P.parchmentDark, boxShadow: `inset 0 0 0 1px ${P.sandLight}`, padding: 24, display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 640 }}>
                <div>
                  <label style={iL}>Theme</label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <button
                    onClick={() => { setThemeMode('light'); setHasChanges(true); }}
                    style={themeCardStyle(themeMode === 'light')}
                    onMouseEnter={e => {
                      if (themeMode !== 'light') {
                        (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                        (e.currentTarget as HTMLElement).style.boxShadow = `inset 0 0 0 1px ${P.sand}, 0 10px 24px rgba(28,18,8,0.06)`;
                      }
                    }}
                    onMouseLeave={e => {
                      if (themeMode !== 'light') {
                        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                        (e.currentTarget as HTMLElement).style.boxShadow = `inset 0 0 0 1px ${P.sandLight}`;
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <Sun size={16} color={P.vermillion} />
                      <span style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Light</span>
                    </div>
                    <p style={{ margin: 0, fontFamily: "'Lora', Georgia, serif", fontSize: 13, color: P.inkMuted, lineHeight: 1.5 }}>
                      Bright, editorial styling for the default admin experience.
                    </p>
                  </button>

                  <button
                    onClick={() => { setThemeMode('dark'); setHasChanges(true); }}
                    style={themeCardStyle(themeMode === 'dark')}
                    onMouseEnter={e => {
                      if (themeMode !== 'dark') {
                        (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                        (e.currentTarget as HTMLElement).style.boxShadow = `inset 0 0 0 1px ${P.sand}, 0 10px 24px rgba(28,18,8,0.06)`;
                      }
                    }}
                    onMouseLeave={e => {
                      if (themeMode !== 'dark') {
                        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                        (e.currentTarget as HTMLElement).style.boxShadow = `inset 0 0 0 1px ${P.sandLight}`;
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <Moon size={16} color={P.vermillion} />
                      <span style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Dark</span>
                    </div>
                    <p style={{ margin: 0, fontFamily: "'Lora', Georgia, serif", fontSize: 13, color: P.inkMuted, lineHeight: 1.5 }}>
                      Lower-glare contrast for longer admin sessions and evening work.
                    </p>
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                  <p style={{ margin: 0, fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, color: P.inkMuted, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    Current theme: {themeMode}
                  </p>
                  <button onClick={handlePreferencesUpdate} disabled={isSaving} style={{ padding: '10px 20px', background: P.inkMuted, color: P.parchmentLight, border: 'none', fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', cursor: isSaving ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Save size={14}/> {isSaving ? 'Saving...' : 'Save Preferences'}
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {(activeTab === 'resources' || activeTab === 'notifications') && (
            <div style={{ padding: 40, textAlign: 'center', background: P.parchmentDark, boxShadow: `inset 0 0 0 1px ${P.sandLight}` }}>
              <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 14, color: P.inkMuted }}>These settings are currently managed globally by the Super Administrator.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
