/**
 * Super Admin Dashboard 
 * Full platform access - manage colleges and create college admins
 */

import { useState, useEffect, ReactNode, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI, collegeAPI, userAPI, llmConfigAPI, College, UserData, LLMConfig, CreateLLMConfigData } from '../../services/api';
import { toast } from 'sonner';
import { Plus, Building2, Users, BookOpen, GraduationCap, Edit, Trash2, X, Check, Search, Settings, CheckCircle, Circle, User, Shield, LogOut, FileText, Mail, Activity } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { LogoutConfirmDialog } from '../components/LogoutConfirmDialog';
import { useLogoutConfirm } from '../../hooks/useLogoutConfirm';
import { InviteCollegeAdminModal } from '../components/InviteCollegeAdminModal';
import AuditLogPage from './AuditLogPage';
import { applyAdminTheme, getStoredAdminTheme } from '../../utils/theme';

import { P } from '../../constants/theme';

interface Stats { totalColleges: number; totalUsers: number; totalStudents: number; totalAdmins: number; activeColleges: number; }

interface DashboardModalProps {
  open: boolean;
  title: string;
  topColor: string;
  onClose: () => void;
  children: ReactNode;
  actions?: ReactNode;
  width?: number;
}

function DashboardModal({ open, title, topColor, onClose, children, actions, width = 500 }: DashboardModalProps) {
  if (!open) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(28,18,8,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }} onClick={onClose}>
      <div style={{ background: P.parchmentLight, boxShadow: `inset 0 0 0 1px ${P.sandLight}, 0 24px 60px rgba(28,18,8,0.18)`, borderTop: `3px solid ${topColor}`, padding: '28px 32px', maxWidth: width, width: '90%', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 800, color: P.ink, margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: P.inkMuted }}><X size={18} /></button>
        </div>
        {children}
        {actions && <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20, paddingTop: 16, borderTop: `1px solid ${P.sandLight}` }}>{actions}</div>}
      </div>
    </div>
  );
}

export default function SuperAdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const logoutConfirm = useLogoutConfirm();
  
  const [activeTab, setActiveTab] = useState<'overview'|'colleges'|'users'|'llm-config'|'audit-logs'>('overview');
  const [colleges, setColleges] = useState<College[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [llmConfigs, setLlmConfigs] = useState<LLMConfig[]>([]);
  const [stats, setStats] = useState<Stats>({ totalColleges: 0, totalUsers: 0, totalStudents: 0, totalAdmins: 0, activeColleges: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);

  const [showCollegeModal, setShowCollegeModal] = useState(false);
  const [editingCollege, setEditingCollege] = useState<College|null>(null);
  const [collegeView, setCollegeView] = useState<'all'|'active'|'inactive'>('active');
  const [collegeForm, setCollegeForm] = useState({ name: '', code: '', location: '', description: '', address: '', email: '', contactNumber: '', isActive: true });

  const [showLLMModal, setShowLLMModal] = useState(false);
  const [editingLLM, setEditingLLM] = useState<LLMConfig|null>(null);
  const [llmForm, setLlmForm] = useState<CreateLLMConfigData>({ name: '', provider: 'OLLAMA', isActive: false, ollamaUrl: 'http://localhost:11434', ollamaModel: 'gemma3:1b', groqApiKey: '', groqModel: '', temperature: 0.7, maxTokens: 1000, topP: 0.9 });

  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData|null>(null);
  const [userForm, setUserForm] = useState({ username: '', email: '', first_name: '', last_name: '', roles: ['STUDENT'], collegeId: '' });
  
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [deleteConf, setDeleteConf] = useState<{ open: boolean, type: 'college'|'user'|'llm', id: number|null, name: string }>({ open: false, type: 'college', id: null, name: '' });
  const [activateLLMConfirmOpen, setActivateLLMConfirmOpen] = useState(false);
  const [activateLLMId, setActivateLLMId] = useState<number|null>(null);
  const [activateLLMName, setActivateLLMName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const retryCountRef = useRef(0);
  const maxRetriesRef = useRef(3);

  // Apply saved admin theme on mount
  useEffect(() => {
    const savedTheme = getStoredAdminTheme();
    applyAdminTheme(savedTheme);
  }, []);

  useEffect(() => { fetchAllData(); }, [user?.id]);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Use allSettled so if one fails, others still complete
      const results = await Promise.allSettled([
        collegeAPI.getAll(true),
        userAPI.getAll(),
        llmConfigAPI.getAll()
      ]);

      const cR = results[0].status === 'fulfilled' ? results[0].value : null;
      const uR = results[1].status === 'fulfilled' ? results[1].value : null;
      const lR = results[2].status === 'fulfilled' ? results[2].value : null;

      // Track if any failed
      const allSucceeded = results.every(r => r.status === 'fulfilled');

      const cd = (cR as any)?.data?.data || (cR as any)?.data || [];
      const ud = (uR as any)?.data?.data || (uR as any)?.data || [];
      const ld = (lR as any)?.data?.data || (lR as any)?.data || [];

      setColleges(cd);
      setUsers(ud);
      setLlmConfigs(ld);
      setStats({
        totalColleges: cd.length,
        activeColleges: cd.filter((c: any) => c.isActive).length,
        totalUsers: ud.length,
        totalStudents: ud.filter((u: any) => u.roles?.includes('STUDENT')).length,
        totalAdmins: ud.filter((u: any) => u.roles?.includes('COLLEGE_ADMIN') || u.roles?.includes('SUPER_ADMIN')).length
      });

      retryCountRef.current = 0; // Reset retry count on success

      // Only show error if ALL results failed
      if (!allSucceeded && results.every(r => r.status === 'rejected')) {
        const failedMsg = 'Failed to load dashboard data. Retrying...';
        setError(failedMsg);
        // Auto-retry if not at max retries
        if (retryCountRef.current < maxRetriesRef.current) {
          retryCountRef.current++;
          setTimeout(() => fetchAllData(), 2000 + (retryCountRef.current * 1000)); // Exponential backoff
        } else {
          toast.error('Failed to load dashboard data. Please refresh.');
        }
      }
    } catch (e: any) {
      const m = e.response?.data?.error || e.message || 'Failed to load dashboard data';
      setError(m);
      // Retry on first load errors
      if (retryCountRef.current < maxRetriesRef.current) {
        retryCountRef.current++;
        setTimeout(() => fetchAllData(), 2000 + (retryCountRef.current * 1000));
      } else {
        toast.error(m);
      }
    } finally {
      setLoading(false);
    }
  };

  const validateCollegeForm = () => {
    // Name validation: Must contain at least one letter, no numbers only
    if (!collegeForm.name.trim()) {
      toast.error('College name is required');
      return false;
    }
    if (/^\d+$/.test(collegeForm.name.trim())) {
      toast.error('College name cannot be only numbers');
      return false;
    }
    if (!/[a-zA-Z]/.test(collegeForm.name)) {
      toast.error('College name must contain at least one letter');
      return false;
    }
    if (collegeForm.name.trim().length < 2) {
      toast.error('College name must be at least 2 characters');
      return false;
    }

    // Code validation: Letters and numbers only, no spaces or special chars
    if (!collegeForm.code.trim()) {
      toast.error('College code is required');
      return false;
    }
    if (!/^[a-zA-Z0-9]+$/.test(collegeForm.code)) {
      toast.error('College code must contain only letters and numbers (no spaces or special characters)');
      return false;
    }
    if (collegeForm.code.length < 2) {
      toast.error('College code must be at least 2 characters');
      return false;
    }

    // Location validation: Required
    if (!collegeForm.location.trim()) {
      toast.error('Location is required');
      return false;
    }

    // Description validation: Required
    if (!collegeForm.description.trim()) {
      toast.error('Description is required');
      return false;
    }

    // Address validation: Required
    if (!collegeForm.address.trim()) {
      toast.error('Address is required');
      return false;
    }

    // Email validation: Required and valid email format
    if (!collegeForm.email.trim()) {
      toast.error('Email address is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(collegeForm.email)) {
      toast.error('Please enter a valid email address');
      return false;
    }

    // Contact number validation: Required, valid format, and minimum digits
    if (!collegeForm.contactNumber.trim()) {
      toast.error('Contact number is required');
      return false;
    }
    if (!/^[0-9\-+\s()]+$/.test(collegeForm.contactNumber)) {
      toast.error('Please enter a valid contact number');
      return false;
    }
    if (collegeForm.contactNumber.replace(/\D/g, '').length < 7) {
      toast.error('Contact number must have at least 7 digits');
      return false;
    }

    return true;
  };

  const handleSaveCollege = async () => {
    if (!validateCollegeForm()) return;
    try {
      if (editingCollege) { await collegeAPI.update(editingCollege.id, collegeForm); toast.success('College updated.'); }
      else { await collegeAPI.create(collegeForm); toast.success('College created.'); }
      setShowCollegeModal(false); setEditingCollege(null); setCollegeForm({name:'',code:'',location:'',description:'',address:'',email:'',contactNumber:'',isActive:true}); fetchAllData();
    } catch { toast.error('Could not save college.'); }
  };

  const confirmDelete = async () => {
    if (!deleteConf.id) return; setIsDeleting(true);
    try {
      if (deleteConf.type === 'college') await collegeAPI.delete(deleteConf.id, true);
      else if (deleteConf.type === 'user') await userAPI.delete(deleteConf.id);
      else await llmConfigAPI.delete(deleteConf.id);
      toast.success(
        deleteConf.type === 'college'
          ? 'College deleted.'
          : deleteConf.type === 'user'
          ? 'User deleted.'
          : 'LLM configuration deleted.'
      ); fetchAllData();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Delete failed';
      toast.error(errorMessage);
    }
    finally { setIsDeleting(false); setDeleteConf({ open: false, type: 'college', id: null, name: '' }); }
  };

  const handleToggleCollegeStatus = async (c: College) => { try { await collegeAPI.update(c.id, { isActive: !c.isActive }); toast.success(c.isActive ? 'College deactivated.' : 'College activated.'); fetchAllData(); } catch { toast.error('Could not update college status.'); } };

  const validateUserForm = () => {
    // Username validation: Required, at least 3 characters, alphanumeric with underscores/hyphens
    if (!userForm.username.trim()) {
      toast.error('Username is required');
      return false;
    }
    if (userForm.username.trim().length < 3) {
      toast.error('Username must be at least 3 characters');
      return false;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(userForm.username)) {
      toast.error('Username can only contain letters, numbers, underscores, and hyphens');
      return false;
    }

    // Email validation: Required, valid email format
    if (!userForm.email.trim()) {
      toast.error('Email is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userForm.email)) {
      toast.error('Please enter a valid email address');
      return false;
    }

    // First Name & Last Name: Letters, spaces, and hyphens only (optional)
    if (userForm.first_name.trim() && !/^[a-zA-Z\s-]+$/.test(userForm.first_name)) {
      toast.error('First name can only contain letters, spaces, and hyphens');
      return false;
    }
    if (userForm.last_name.trim() && !/^[a-zA-Z\s-]+$/.test(userForm.last_name)) {
      toast.error('Last name can only contain letters, spaces, and hyphens');
      return false;
    }

    // College Affiliation: Required if not SUPER_ADMIN
    if (!userForm.roles.includes('SUPER_ADMIN') && !userForm.collegeId) {
      toast.error('Select a college for this user.');
      return false;
    }

    return true;
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    if (!validateUserForm()) return;
    try {
      await userAPI.update(editingUser.id, { ...userForm, collegeId: userForm.roles.includes('SUPER_ADMIN')?null:(userForm.collegeId?parseInt(userForm.collegeId):null) });
      toast.success('User updated.'); setShowUserModal(false); setEditingUser(null); fetchAllData();
    } catch { toast.error('Could not update user.'); }
  };

  const handleToggleUserStatus = async (u: UserData) => {
    if (u.id === user?.id) { toast.error('You cannot deactivate your own account.'); return; }
    try { await userAPI.update(u.id, { isActive: !(u.isActive ?? true) }); toast.success((u.isActive ?? true) ? 'User deactivated.' : 'User activated.'); fetchAllData(); } catch { toast.error('Could not update user status.'); }
  };

  const handleSaveLLM = async () => {
    if (!llmForm.name || !llmForm.provider) { toast.error('Enter all required fields.'); return; }
    try {
      if (editingLLM) { await llmConfigAPI.update(editingLLM.id, llmForm); toast.success('LLM configuration updated.'); }
      else { await llmConfigAPI.create(llmForm); toast.success('LLM configuration created.'); }
      setShowLLMModal(false); setEditingLLM(null);
      setLlmForm({ name: '', provider: 'OLLAMA', isActive: false, ollamaUrl: 'http://localhost:11434', ollamaModel: 'gemma3:1b', groqApiKey: '', groqModel: '', temperature: 0.7, maxTokens: 1000, topP: 0.9 });
      fetchAllData();
    } catch { toast.error('Could not save LLM configuration.'); }
  };

  const confirmActivateLLM = async () => {
    if(!activateLLMId) return; setIsActivating(true);
    try { await llmConfigAPI.activate(activateLLMId); toast.success('LLM configuration activated.'); fetchAllData(); } catch { toast.error('Could not activate LLM configuration.'); }
    finally { setIsActivating(false); setActivateLLMConfirmOpen(false); setActivateLLMId(null); setActivateLLMName(''); }
  };

  const filteredUsers = users.filter(u => {
    const rm = filterRole==='all'||u.roles.includes(filterRole);
    const sm = filterStatus==='all'||(filterStatus==='Active'?(u.isActive??true):!(u.isActive??true));
    const tm = !searchTerm||u.username.toLowerCase().includes(searchTerm.toLowerCase())||u.email.toLowerCase().includes(searchTerm.toLowerCase());
    return rm && sm && tm;
  });

  const visibleColleges = colleges.filter(c => collegeView==='all' || (collegeView==='active'?c.isActive:!c.isActive));

  const roleText = (r:string[]) => r.includes('SUPER_ADMIN')?'Super Admin':r.includes('COLLEGE_ADMIN')?'College Admin':'Student';
  const roleColor = (r:string[]) => r.includes('SUPER_ADMIN')?P.purple:r.includes('COLLEGE_ADMIN')?P.inkSecondary:P.moss;

  const iS: React.CSSProperties = { width: '100%', padding: '9px 12px', fontFamily: "'Lora', Georgia, serif", fontSize: 13.5, color: P.ink, background: P.parchment, border: 'none', boxShadow: `inset 0 0 0 1px ${P.sandLight}`, outline: 'none', boxSizing: 'border-box' };
  const iL: React.CSSProperties = { fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: P.inkSecondary, display: 'block', marginBottom: 6 };
  const softPanel = `inset 0 0 0 1px ${P.sandLight}, 0 12px 28px rgba(28,18,8,0.05)`;
  const softOutline = `inset 0 0 0 1px ${P.sand}`;

  if (!user || user.role !== 'SUPER_ADMIN') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: P.parchmentDark }}>
        <div style={{ textAlign: 'center' }}>
          <Shield size={64} color={P.vermillion} style={{ margin: '0 auto 16px' }} />
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, color: P.ink, fontWeight: 800 }}>Access Denied</h1>
          <p style={{ fontFamily: "'Lora', Georgia, serif", color: P.inkMuted, marginTop: 8 }}>This dashboard is restricted to System Administrators.</p>
          <button onClick={() => navigate('/student/dashboard')} style={{ marginTop: 24, padding: '10px 20px', background: P.inkMuted, color: P.parchmentLight, border: 'none', fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer' }}>Return to Portal</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: P.parchmentDark }}>
      <aside style={{ width: 260, flexShrink: 0, minHeight: '100vh', background: P.parchmentLight, boxShadow: `inset -1px 0 0 ${P.sandLight}`, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '32px 24px', borderBottom: `1px solid ${P.sandLight}`, textAlign: 'center' }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 900, color: P.ink, letterSpacing: '-0.02em' }}>LearnBox</div>
          <div style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: P.vermillion, marginTop: 4 }}>System Administration</div>
        </div>
        <nav style={{ padding: '24px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[{i:'overview', icon:BookOpen, l:'Overview'}, {i:'colleges', icon:Building2, l:'Colleges'}, {i:'users', icon:Users, l:'Users'}, {i:'llm-config', icon:Settings, l:'LLM Configuration'}, {i:'audit-logs', icon:Activity, l:'Audit Log'}].map(t => (
            <button key={t.i} onClick={() => setActiveTab(t.i as any)} style={{ padding: '12px 16px', background: activeTab===t.i?P.parchmentDark:'transparent', color: activeTab===t.i?P.ink:P.inkMuted, border: 'none', borderLeft: activeTab===t.i?`3px solid ${P.vermillion}`:'3px solid transparent', boxShadow: activeTab===t.i ? `inset 0 0 0 1px ${P.sandLight}` : 'none', fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.1s', textAlign: 'left' }}>
              <t.icon size={16} /> {t.l}
            </button>
          ))}
          <div style={{ margin: '16px 0', borderTop: `1px solid ${P.sandLight}` }} />
          <button onClick={() => navigate('/superadmin/settings')} style={{ padding: '12px 16px', background: 'transparent', color: P.inkMuted, border: 'none', fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}><User size={16}/> Settings</button>
        </nav>
        <div style={{ padding: 24, borderTop: `1px solid ${P.sandLight}` }}>
          <div style={{ background: P.parchment, boxShadow: `inset 0 0 0 1px ${P.sandLight}`, padding: 12, marginBottom: 12 }}>
            <p style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 10, color: P.inkMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Logged in as</p>
            <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 14, fontWeight: 700, color: P.ink }}>{user.username}</p>
          </div>
          <button onClick={() => logoutConfirm.openConfirm(logout)} style={{ width: '100%', padding: '10px', background: P.vermillionBg, color: '#7A1C10', border: 'none', boxShadow: `inset 0 0 0 1px ${P.vermillion}`, fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer' }}>Sign Out</button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: '32px 48px', overflowY: 'auto' }}>
        <header style={{ marginBottom: 32, paddingBottom: 24, borderBottom: `1px solid ${P.sand}` }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 800, color: P.ink, margin: '0 0 8px' }}>
            {activeTab === 'overview' && 'Dashboard Overview'}
            {activeTab === 'colleges' && 'College Registry'}
            {activeTab === 'users' && 'User Directory'}
            {activeTab === 'llm-config' && 'AI Model Configuration'}
            {activeTab === 'audit-logs' && 'Activity Audit Log'}
          </h1>
          <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 14, color: P.inkMuted, margin: 0 }}>
            {activeTab === 'overview' && 'System-wide metrics and status monitor'}
            {activeTab === 'colleges' && 'Manage participating institutions and sub-tenants'}
            {activeTab === 'users' && 'Global user management and role assignment'}
            {activeTab === 'llm-config' && 'Manage language models and inference endpoints'}
            {activeTab === 'audit-logs' && 'Monitor all college admin actions across the platform'}
          </p>
        </header>

        {loading ? <div style={{ padding: 60, textAlign: 'center', fontFamily: "'Lora', Georgia, serif", color: P.inkMuted }}>Loading system data...</div> : (
          <>
            {activeTab === 'overview' && (
              <div style={{ display: 'grid', gap: 32 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', background: P.parchmentLight, boxShadow: softPanel }}>
                  {[
                    ['Total Colleges', stats.totalColleges, P.ink, `${stats.activeColleges} Active`],
                    ['Total Users', stats.totalUsers, P.moss, 'System-wide'],
                    ['Students', stats.totalStudents, P.purple, 'Enrolled Learners'],
                    ['Administrators', stats.totalAdmins, P.vermillion, 'College & System']
                  ].map(([l, v, c, s], i) => (
                    <div key={l as string} style={{ padding: '24px', borderRight: i<3?`1px solid ${P.sandLight}`:'none' }}>
                      <p style={{ fontFamily: "var(--font-numeric)", fontSize: 42, fontWeight: 800, color: c as string, margin: '0 0 4px', lineHeight: 1 }}>{v}</p>
                      <p style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 12, fontWeight: 700, color: P.inkSecondary, margin: '0 0 8px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{l as string}</p>
                      <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 11, color: P.inkMuted, margin: 0 }}>{s as string}</p>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                  <div style={{ background: P.parchmentLight, boxShadow: softPanel }}>
                    <div style={{ padding: '16px 20px', borderBottom: `1px solid ${P.sandLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: P.ink, margin: 0 }}>Latest Institutions</h3>
                      <button onClick={()=>setActiveTab('colleges')} style={{ background: 'none', border: 'none', boxShadow: softOutline, padding: '4px 8px', fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 10, textTransform: 'uppercase', cursor: 'pointer' }}>View All</button>
                    </div>
                    <div>
                      {colleges.slice(0, 5).map((c, i) => (
                        <div key={c.id} style={{ padding: '12px 20px', borderBottom: i<Math.min(colleges.length,5)-1?`1px solid ${P.sandLight}`:'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 14, fontWeight: 700, color: P.ink }}>{c.name}</div>
                            <div style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, color: P.inkMuted }}>{c.code}</div>
                          </div>
                          <span style={{ fontSize: 10, fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, textTransform: 'uppercase', padding: '2px 6px', border: 'none', boxShadow: `inset 0 0 0 1px ${c.isActive?P.moss:P.sand}`, background: c.isActive?P.mossBg:P.parchment, color: c.isActive?P.moss:P.inkMuted }}>{c.isActive?'Active':'Inactive'}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ background: P.parchmentLight, boxShadow: softPanel }}>
                    <div style={{ padding: '16px 20px', borderBottom: `1px solid ${P.sandLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: P.ink, margin: 0 }}>Recent Registrations</h3>
                      <button onClick={()=>setActiveTab('users')} style={{ background: 'none', border: 'none', boxShadow: softOutline, padding: '4px 8px', fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 10, textTransform: 'uppercase', cursor: 'pointer' }}>View All</button>
                    </div>
                    <div>
                      {users.slice(0, 5).map((u, i) => (
                        <div key={u.id} style={{ padding: '12px 20px', borderBottom: i<Math.min(users.length,5)-1?`1px solid ${P.sandLight}`:'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 14, fontWeight: 700, color: P.ink }}>{u.username}</div>
                            <div style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, color: P.inkMuted }}>{u.email}</div>
                          </div>
                          <span style={{ fontSize: 10, fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, textTransform: 'uppercase', padding: '2px 6px', border: `1px solid ${roleColor(u.roles)}`, color: roleColor(u.roles) }}>{roleText(u.roles)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'colleges' && (
              <div>
                <div style={{ background: P.parchmentLight, boxShadow: softPanel, padding: '16px 20px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 0, boxShadow: softOutline }}>
                    {['active','inactive','all'].map(v => (
                      <button key={v} onClick={()=>setCollegeView(v as any)} style={{ padding: '6px 16px', background: collegeView===v?P.parchmentDark:'transparent', color: collegeView===v?P.ink:P.ink, border: 'none', boxShadow: v!=='all'?`inset -1px 0 0 ${P.sandLight}`:'none', fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer' }}>{v}</button>
                    ))}
                  </div>
                  <button onClick={()=>{setEditingCollege(null);setCollegeForm({name:'',code:'',location:'',description:'',address:'',email:'',contactNumber:'',isActive:true});setShowCollegeModal(true);}} style={{ padding: '8px 16px', background: P.inkMuted, color: '#fff', border: 'none', boxShadow: `0 10px 18px rgba(28,18,8,0.08)`, fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 12, fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}><Plus size={14}/> Register College</button>
                </div>
                
                <div style={{ background: P.parchmentLight, boxShadow: softPanel, overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1200 }}>
                    <thead>
                      <tr>{['Name & Code','Location','Description','Address','Email','Contact','Status','Actions'].map(l=><th key={l} style={{ padding:'12px 16px', background:P.parchmentDark, borderBottom:`1px solid ${P.sandLight}`, fontFamily:"'Barlow Semi Condensed', sans-serif", fontSize:11, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', color:P.inkSecondary, textAlign:'left' }}>{l}</th>)}</tr>
                    </thead>
                    <tbody>
                      {visibleColleges.map((c, i) => (
                        <tr key={c.id} style={{ borderBottom: `1px solid ${P.sandLight}` }}>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 14, fontWeight: 700, color: P.ink }}>{c.name}</div>
                            <div style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, color: P.inkMuted }}>{c.code}</div>
                          </td>
                          <td style={{ padding: '12px 16px', fontFamily: "'Lora', Georgia, serif", fontSize: 13, color: P.inkSecondary }}>{c.location || '—'}</td>
                          <td style={{ padding: '12px 16px', fontFamily: "'Lora', Georgia, serif", fontSize: 13, color: P.inkSecondary, maxWidth: 120, wordBreak: 'break-word' }}>{c.description || '—'}</td>
                          <td style={{ padding: '12px 16px', fontFamily: "'Lora', Georgia, serif", fontSize: 13, color: P.inkSecondary, maxWidth: 120, wordBreak: 'break-word' }}>{c.address || '—'}</td>
                          <td style={{ padding: '12px 16px', fontFamily: "'Lora', Georgia, serif", fontSize: 13, color: P.inkSecondary, maxWidth: 130, wordBreak: 'break-word' }}>{c.email || '—'}</td>
                          <td style={{ padding: '12px 16px', fontFamily: "'Lora', Georgia, serif", fontSize: 13, color: P.inkSecondary }}>{c.contactNumber || '—'}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <button onClick={()=>handleToggleCollegeStatus(c)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}>
                              <span style={{ fontSize: 10, fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, textTransform: 'uppercase', padding: '4px 8px', border: `1px solid ${c.isActive?P.moss:P.sand}`, background: c.isActive?P.mossBg:P.parchment, color: c.isActive?P.moss:P.inkMuted, display: 'inline-flex', alignItems: 'center', gap: 4 }}>{c.isActive?<CheckCircle size={10}/>:<Circle size={10}/>} {c.isActive?'Active':'Inactive'}</span>
                            </button>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button onClick={()=>{setEditingCollege(c);setCollegeForm({name:c.name,code:c.code,location:c.location||'',description:c.description||'',address:c.address||'',email:c.email||'',contactNumber:c.contactNumber||'',isActive:c.isActive});setShowCollegeModal(true);}} style={{ padding: '4px 8px', background: 'transparent', border: `1px solid ${P.ink}`, color: P.ink, fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 10, textTransform: 'uppercase', cursor: 'pointer' }}>Edit</button>
                              <button onClick={()=>setDeleteConf({open:true,type:'college',id:c.id,name:c.name})} style={{ padding: '4px 8px', background: 'transparent', border: `1px solid ${P.vermillion}`, color: P.vermillion, fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 10, textTransform: 'uppercase', cursor: 'pointer' }}><Trash2 size={10} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div>
                <div style={{ background: P.parchmentLight, boxShadow: softPanel, padding: '16px 20px', marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                  <div style={{ flex: '1 1 200px', position: 'relative' }}>
                    <Search size={14} color={P.inkMuted} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    <input type="text" placeholder="Search users…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ ...iS, paddingLeft: 36 }} />
                  </div>
                  <Select value={filterRole} onValueChange={setFilterRole}>
                    <SelectTrigger style={{ ...iS, flex: '0 0 160px' }}>
                      <SelectValue placeholder="All Roles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="SUPER_ADMIN">Super Admins</SelectItem>
                      <SelectItem value="COLLEGE_ADMIN">College Admins</SelectItem>
                      <SelectItem value="STUDENT">Students</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger style={{ ...iS, flex: '0 0 120px' }}>
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <button onClick={()=>setShowInviteModal(true)} style={{ flex: '0 0 auto', padding: '0 20px', height: 38, background: P.vermillion, color: '#fff', border: 'none', boxShadow: `0 10px 18px rgba(192,57,43,0.16)`, fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 12, textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}><Mail size={14} /> Invite Admin</button>
                </div>

                <div style={{ background: P.parchmentLight, boxShadow: softPanel, overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
                    <thead>
                      <tr>{['User / Email','Role','College','Status','Actions'].map(l=><th key={l} style={{ padding:'12px 16px', background:P.parchmentDark, borderBottom:`1px solid ${P.sandLight}`, fontFamily:"'Barlow Semi Condensed', sans-serif", fontSize:11, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', color:P.inkSecondary, textAlign:'left' }}>{l}</th>)}</tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u, i) => (
                        <tr key={u.id} style={{ borderBottom: `1px solid ${P.sandLight}` }}>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 14, fontWeight: 700, color: P.ink }}>{u.username}</div>
                            <div style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, color: P.inkMuted }}>{u.email}</div>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ fontSize: 10, fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, textTransform: 'uppercase', padding: '2px 6px', border: `1px solid ${roleColor(u.roles)}`, color: roleColor(u.roles) }}>{roleText(u.roles)}</span>
                          </td>
                          <td style={{ padding: '12px 16px', fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 12, color: P.inkSecondary }}>{u.roles.includes('SUPER_ADMIN') ? 'Global' : (u.college?.name || '—')}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <button onClick={()=>handleToggleUserStatus(u)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}>
                              <span style={{ fontSize: 10, fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, textTransform: 'uppercase', padding: '4px 8px', border: `1px solid ${u.isActive!==false?P.moss:P.sand}`, background: u.isActive!==false?P.mossBg:P.parchment, color: u.isActive!==false?P.moss:P.inkMuted }}>{u.isActive!==false?'Active':'Inactive'}</span>
                            </button>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button onClick={()=>{setEditingUser(u);setUserForm({username:u.username,email:u.email,first_name:u.first_name||'',last_name:u.last_name||'',roles:u.roles,collegeId:u.collegeId?.toString()||''});setShowUserModal(true);}} style={{ padding: '4px 8px', background: 'transparent', border: `1px solid ${P.ink}`, color: P.ink, fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 10, textTransform: 'uppercase', cursor: 'pointer' }}>Edit</button>
                              {u.id !== user.id && <button onClick={()=>setDeleteConf({open:true,type:'user',id:u.id,name:u.username})} style={{ padding: '4px 8px', background: 'transparent', border: `1px solid ${P.vermillion}`, color: P.vermillion, fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 10, textTransform: 'uppercase', cursor: 'pointer' }}><Trash2 size={10} /></button>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'llm-config' && (
              <div>
                 <div style={{ background: P.parchmentLight, boxShadow: softPanel, padding: '16px 20px', marginBottom: 20, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                  <button onClick={()=>{setEditingLLM(null);setLlmForm({name:'',provider:'OLLAMA',isActive:false,ollamaUrl:'http://localhost:11434',ollamaModel:'gemma3:1b',groqApiKey:'',groqModel:'',temperature:0.7,maxTokens:1000,topP:0.9});setShowLLMModal(true);}} style={{ padding: '8px 16px', background: P.inkMuted, color: '#fff', border: 'none', boxShadow: `0 10px 18px rgba(28,18,8,0.08)`, fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 12, fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}><Plus size={14}/> Add Configuration</button>
                </div>

                <div style={{ background: P.parchmentLight, boxShadow: softPanel, overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
                    <thead>
                      <tr>{['Config Name','Provider','Model','Status','Actions'].map(l=><th key={l} style={{ padding:'12px 16px', background:P.parchmentDark, borderBottom:`1px solid ${P.sandLight}`, fontFamily:"'Barlow Semi Condensed', sans-serif", fontSize:11, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', color:P.inkSecondary, textAlign:'left' }}>{l}</th>)}</tr>
                    </thead>
                    <tbody>
                      {llmConfigs.map((c, i) => (
                        <tr key={c.id} style={{ borderBottom: `1px solid ${P.sandLight}` }}>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 14, fontWeight: 700, color: P.ink }}>{c.name}</div>
                            <div style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, color: P.inkMuted }}>T: {c.temperature}</div>
                          </td>
                          <td style={{ padding: '12px 16px' }}><span style={{ border: `1px solid ${P.ink}`, padding: '2px 6px', fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>{c.provider}</span></td>
                          <td style={{ padding: '12px 16px', fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 12, color: P.inkSecondary }}>{c.provider==='GROQ'?c.groqModel:c.ollamaModel}</td>
                          <td style={{ padding: '12px 16px' }}>
                            {c.isActive ? <span style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 10, fontWeight: 700, textTransform: 'uppercase', padding: '4px 8px', background: P.mossBg, color: P.moss, border: `1px solid ${P.moss}` }}>Active Model</span> : <button onClick={()=>{setActivateLLMId(c.id);setActivateLLMName(c.name);setActivateLLMConfirmOpen(true);}} style={{ padding: '4px 8px', background: 'transparent', border: `1px solid ${P.sand}`, color: P.inkSecondary, fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 10, textTransform: 'uppercase', cursor: 'pointer' }}>Set Active</button>}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button onClick={()=>{setEditingLLM(c);setLlmForm({name:c.name,provider:c.provider,isActive:c.isActive,ollamaUrl:c.ollamaUrl||'',ollamaModel:c.ollamaModel||'',groqApiKey:c.groqApiKey||'',groqModel:c.groqModel||'',temperature:c.temperature,maxTokens:c.maxTokens,topP:c.topP});setShowLLMModal(true);}} style={{ padding: '4px 8px', background: 'transparent', border: `1px solid ${P.ink}`, color: P.ink, fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 10, textTransform: 'uppercase', cursor: 'pointer' }}>Edit</button>
                              {!c.isActive && <button onClick={()=>setDeleteConf({open:true,type:'llm',id:c.id,name:c.name})} style={{ padding: '4px 8px', background: 'transparent', border: `1px solid ${P.vermillion}`, color: P.vermillion, fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 10, textTransform: 'uppercase', cursor: 'pointer' }}><Trash2 size={10} /></button>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'audit-logs' && (
              <AuditLogPage />
            )}
          </>
        )}
      </main>

      {/* College Modal */}
      <DashboardModal open={showCollegeModal} title={editingCollege ? "Edit College" : "Register College"} topColor={P.ink} onClose={()=>setShowCollegeModal(false)} actions={<><button onClick={()=>setShowCollegeModal(false)} style={{ padding: '9px 18px', background: 'transparent', border: `1px solid ${P.sand}`, fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 600, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', color: P.inkMuted, cursor: 'pointer' }}>Cancel</button><button onClick={handleSaveCollege} style={{ padding: '9px 18px', background: P.inkMuted, border: 'none', fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#fff', cursor: 'pointer' }}>{editingCollege?'Update':'Register'}</button></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={iL}>Name <span style={{ color: P.vermillion }}>*</span></label>
            <input style={iS} value={collegeForm.name} onChange={e=>setCollegeForm({...collegeForm,name:e.target.value})} placeholder="e.g. Acme University" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={iL}>Code <span style={{ color: P.vermillion }}>*</span></label>
              <input style={iS} value={collegeForm.code} onChange={e=>setCollegeForm({...collegeForm,code:e.target.value.toUpperCase()})} placeholder="e.g. ACME" />
            </div>
            <div>
              <label style={iL}>Location <span style={{ color: P.vermillion }}>*</span></label>
              <input style={iS} value={collegeForm.location} onChange={e=>setCollegeForm({...collegeForm,location:e.target.value})} placeholder="e.g. New York, USA" />
            </div>
          </div>
          <div>
            <label style={iL}>Address <span style={{ color: P.vermillion }}>*</span></label>
            <input style={iS} value={collegeForm.address} onChange={e=>setCollegeForm({...collegeForm,address:e.target.value})} placeholder="e.g. 123 Main Street, City" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={iL}>Email Address <span style={{ color: P.vermillion }}>*</span></label>
              <input type="email" style={iS} value={collegeForm.email} onChange={e=>setCollegeForm({...collegeForm,email:e.target.value})} placeholder="e.g. info@college.edu" />
            </div>
            <div>
              <label style={iL}>Contact Number <span style={{ color: P.vermillion }}>*</span></label>
              <input type="tel" style={iS} value={collegeForm.contactNumber} onChange={e=>setCollegeForm({...collegeForm,contactNumber:e.target.value})} placeholder="" />
            </div>
          </div>
          <div>
            <label style={iL}>Description <span style={{ color: P.vermillion }}>*</span></label>
            <textarea style={{...iS, resize:'vertical'}} rows={3} value={collegeForm.description} onChange={e=>setCollegeForm({...collegeForm,description:e.target.value})} />
          </div>
        </div>
      </DashboardModal>

      {/* User Modal */}
      <DashboardModal open={showUserModal} title="Edit User Identity" topColor={P.ink} onClose={()=>setShowUserModal(false)} actions={<><button onClick={()=>setShowUserModal(false)} style={{ padding: '9px 18px', background: 'transparent', border: `1px solid ${P.sand}`, fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 600, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', color: P.inkMuted, cursor: 'pointer' }}>Cancel</button><button onClick={handleSaveUser} style={{ padding: '9px 18px', background: P.inkMuted, border: 'none', fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#fff', cursor: 'pointer' }}>Save Changes</button></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={iL}>Username <span style={{ color: P.vermillion }}>*</span></label>
              <input style={iS} value={userForm.username} onChange={e=>setUserForm({...userForm,username:e.target.value})} />
            </div>
            <div>
              <label style={iL}>Email <span style={{ color: P.vermillion }}>*</span></label>
              <input style={iS} value={userForm.email} onChange={e=>setUserForm({...userForm,email:e.target.value})} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={iL}>First Name <span style={{ color: P.vermillion }}>*</span></label>
              <input style={iS} value={userForm.first_name} onChange={e=>setUserForm({...userForm,first_name:e.target.value})} />
            </div>
            <div>
              <label style={iL}>Last Name <span style={{ color: P.vermillion }}>*</span></label>
              <input style={iS} value={userForm.last_name} onChange={e=>setUserForm({...userForm,last_name:e.target.value})} />
            </div>
          </div>
          <div>
            <label style={iL}>Role</label>
            <Select value={userForm.roles[0] || 'STUDENT'} onValueChange={role=>setUserForm({...userForm,roles:[role]})} disabled={(editingUser as any)?.roles?.includes('SUPER_ADMIN')}>
              <SelectTrigger style={iS}>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STUDENT">Student</SelectItem>
                <SelectItem value="COLLEGE_ADMIN">College Admin</SelectItem>
                {(user as any)?.roles?.includes('SUPER_ADMIN') && <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>}
              </SelectContent>
            </Select>
          </div>
          {!userForm.roles.includes('SUPER_ADMIN') && (
            <div>
              <label style={iL}>College Affiliation <span style={{ color: P.vermillion }}>*</span></label>
              <Select value={userForm.collegeId} onValueChange={collegeId=>setUserForm({...userForm,collegeId})}>
                <SelectTrigger style={iS}>
                  <SelectValue placeholder="Select a college..." />
                </SelectTrigger>
                <SelectContent>
                  {colleges.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </DashboardModal>

      {/* LLM Modal */}
      <DashboardModal open={showLLMModal} title={editingLLM ? "Edit AI Logic" : "Configure AI Logic"} topColor={P.moss} width={600} onClose={()=>setShowLLMModal(false)} actions={<><button onClick={()=>setShowLLMModal(false)} style={{ padding: '9px 18px', background: 'transparent', border: `1px solid ${P.sand}`, fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 600, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', color: P.inkMuted, cursor: 'pointer' }}>Cancel</button><button onClick={handleSaveLLM} style={{ padding: '9px 18px', background: P.moss, border: 'none', fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#fff', cursor: 'pointer' }}>Save Config</button></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,2fr) minmax(0,1fr)', gap: 12 }}>
            <div><label style={iL}>Config Name <span style={{ color: P.vermillion }}>*</span></label><input style={iS} value={llmForm.name} onChange={e=>setLlmForm({...llmForm,name:e.target.value})} placeholder="e.g. Local Fast Model" /></div>
            <div><label style={iL}>Provider <span style={{ color: P.vermillion }}>*</span></label>
              <Select value={llmForm.provider} onValueChange={v=>setLlmForm({...llmForm,provider:v as any})} disabled={!!editingLLM}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OLLAMA">Ollama (Local)</SelectItem>
                  <SelectItem value="GROQ">Groq (Cloud)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {llmForm.provider === 'OLLAMA' ? (
            <div style={{ padding: 16, background: P.parchmentDark, border: `1px solid ${P.sand}`, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div><label style={iL}>Ollama URL</label><input style={iS} value={llmForm.ollamaUrl} onChange={e=>setLlmForm({...llmForm,ollamaUrl:e.target.value})} /></div>
              <div><label style={iL}>Model Tag</label><input style={iS} value={llmForm.ollamaModel} onChange={e=>setLlmForm({...llmForm,ollamaModel:e.target.value})} /></div>
            </div>
          ) : (
             <div style={{ padding: 16, background: P.parchmentDark, border: `1px solid ${P.sand}`, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div><label style={iL}>API Key</label><input type="password" style={iS} value={llmForm.groqApiKey} onChange={e=>setLlmForm({...llmForm,groqApiKey:e.target.value})} /></div>
              <div><label style={iL}>Model Id</label><input style={iS} value={llmForm.groqModel} onChange={e=>setLlmForm({...llmForm,groqModel:e.target.value})} /></div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <div><label style={iL}>Temperature</label><input type="number" step="0.1" min="0" max="2" style={iS} value={llmForm.temperature} onChange={e=>setLlmForm({...llmForm,temperature:parseFloat(e.target.value)})} /></div>
            <div><label style={iL}>Top P</label><input type="number" step="0.05" min="0" max="1" style={iS} value={llmForm.topP} onChange={e=>setLlmForm({...llmForm,topP:parseFloat(e.target.value)})} /></div>
            <div><label style={iL}>Max Tokens</label><input type="number" step="100" min="100" style={iS} value={llmForm.maxTokens} onChange={e=>setLlmForm({...llmForm,maxTokens:parseInt(e.target.value)})} /></div>
          </div>
        </div>
      </DashboardModal>

      {/* Delete/Activate Modals */}
      <DashboardModal open={deleteConf.open} title={`Delete ${deleteConf.type}`} topColor={P.vermillion} onClose={()=>setDeleteConf({...deleteConf,open:false})} actions={<><button onClick={()=>setDeleteConf({...deleteConf,open:false})} style={{ padding: '9px 18px', background: 'transparent', border: `1px solid ${P.sand}`, fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 600, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', color: P.inkMuted, cursor: 'pointer' }}>Cancel</button><button onClick={confirmDelete} disabled={isDeleting} style={{ padding: '9px 18px', background: P.vermillion, border: 'none', fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#fff', cursor: isDeleting?'default':'pointer' }}>{isDeleting?'Deleting':'Delete Permanently'}</button></>}>
        <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 13.5, color: P.inkMuted, lineHeight: 1.6, margin: 0 }}>Completely purge <strong>{deleteConf.name}</strong> from the system? This action cannot be undone.</p>
      </DashboardModal>

      <DashboardModal open={activateLLMConfirmOpen} title="Activate AI Model" topColor={P.moss} onClose={()=>setActivateLLMConfirmOpen(false)} actions={<><button onClick={()=>setActivateLLMConfirmOpen(false)} style={{ padding: '9px 18px', background: 'transparent', border: `1px solid ${P.sand}`, fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 600, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', color: P.inkMuted, cursor: 'pointer' }}>Cancel</button><button onClick={confirmActivateLLM} disabled={isActivating} style={{ padding: '9px 18px', background: P.moss, border: 'none', fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#fff', cursor: isActivating?'default':'pointer' }}>{isActivating?'Activating':'Set Active'}</button></>}>
        <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 13.5, color: P.inkMuted, lineHeight: 1.6, margin: 0 }}>Set <strong>{activateLLMName}</strong> as the system-wide default inference model?</p>
      </DashboardModal>

      {/* Modals from external components */}
      <LogoutConfirmDialog isOpen={logoutConfirm.isOpen} onConfirm={logoutConfirm.onConfirm} onCancel={logoutConfirm.onCancel} isLoading={logoutConfirm.isLoading} />
      {showInviteModal && (
        <InviteCollegeAdminModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          colleges={colleges as any}
          onInvitationSent={() => {
            fetchAllData();
          }}
        />
      )}
    </div>
  );
}
