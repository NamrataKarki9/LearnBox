import { AlertCircle, LogOut } from 'lucide-react';
import { useEffect } from 'react';

const P = {
  parchment: '#F5F0E8', parchmentLight: '#FAF7F0', parchmentDark: '#EDE5D4',
  ink: '#1C1208', inkSecondary: '#3D2E18', inkMuted: '#7A6A52',
  sand: '#D4C5A9', vermillion: '#C0392B', vermillionBg: '#F5E6E4',
};

interface LogoutConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function LogoutConfirmDialog({ isOpen, onConfirm, onCancel, isLoading = false }: LogoutConfirmDialogProps) {
  if (!isOpen) return null;
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(28,18,8,0.55)' }} onClick={onCancel} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
        <div style={{ background: P.parchmentLight, border: `1px solid ${P.sand}`, borderTop: `3px solid ${P.vermillion}`, padding: '32px', maxWidth: 380, width: '90%', pointerEvents: 'auto', fontFamily: "'Lora', Georgia, serif" }} onClick={e => e.stopPropagation()}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
            <div style={{ width: 40, height: 40, background: P.vermillionBg, border: `1px solid ${P.vermillion}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <LogOut size={18} color={P.vermillion} strokeWidth={2} />
            </div>
            <div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 800, color: P.ink, margin: '0 0 6px' }}>Confirm Logout</h3>
              <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 13.5, color: P.inkMuted, lineHeight: 1.6, margin: 0 }}>Are you sure you want to logout? You'll need to sign in again to access your account.</p>
            </div>
          </div>
          <div style={{ borderTop: `1px solid ${P.sand}`, paddingTop: 20, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onCancel} disabled={isLoading} style={{ padding: '10px 20px', background: 'transparent', border: `1px solid ${P.sand}`, fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 600, fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase', color: P.inkMuted, cursor: isLoading ? 'not-allowed' : 'pointer', transition: 'all 0.12s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = P.ink; (e.currentTarget as HTMLElement).style.color = P.ink; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = P.sand; (e.currentTarget as HTMLElement).style.color = P.inkMuted; }}>
              Cancel
            </button>
            <button type="button" onClick={onConfirm} disabled={isLoading} style={{ padding: '10px 20px', background: P.vermillion, border: 'none', fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#fff', cursor: isLoading ? 'not-allowed' : 'pointer', transition: 'background 0.12s', opacity: isLoading ? 0.6 : 1 }}
              onMouseEnter={e => { if (!isLoading) (e.currentTarget as HTMLElement).style.background = '#A93226'; }}
              onMouseLeave={e => { if (!isLoading) (e.currentTarget as HTMLElement).style.background = P.vermillion; }}>
              {isLoading ? 'Logging out…' : 'Logout'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
