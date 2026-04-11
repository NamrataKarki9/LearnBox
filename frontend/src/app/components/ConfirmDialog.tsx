import { AlertCircle, TriangleAlert } from 'lucide-react';
import { useEffect } from 'react';

const P = {
  parchment: '#F5F0E8', parchmentLight: '#FAF7F0', parchmentDark: '#EDE5D4',
  ink: '#1C1208', inkSecondary: '#3D2E18', inkMuted: '#7A6A52',
  sand: '#D4C5A9', vermillion: '#C0392B', vermillionBg: '#F5E6E4',
};

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  isDangerous?: boolean;
  autoClose?: boolean;
  closeDelay?: number;
}

export function ConfirmDialog({
  isOpen, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  onConfirm, onCancel, isLoading = false, isDangerous = false, autoClose = false, closeDelay = 3000
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  useEffect(() => {
    if (autoClose) {
      const t = setTimeout(onCancel, closeDelay);
      return () => clearTimeout(t);
    }
  }, [autoClose, closeDelay, onCancel]);

  const accentColor = isDangerous ? P.vermillion : '#A07A30';
  const accentBg = isDangerous ? P.vermillionBg : '#FEF5E4';
  const panelBg = isDangerous ? '#FFF4F2' : P.parchmentLight;
  const panelBorder = isDangerous ? '#E7B7B0' : P.sand;
  const titleColor = isDangerous ? '#7C241C' : P.ink;
  const messageColor = isDangerous ? '#8E3B33' : P.inkMuted;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, pointerEvents: 'none', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 80 }}>
      <div style={{ background: panelBg, border: `1px solid ${panelBorder}`, borderTop: `3px solid ${accentColor}`, padding: '28px 32px', maxWidth: 400, width: '90%', pointerEvents: 'auto', fontFamily: "'Lora', Georgia, serif", boxShadow: '0 8px 40px rgba(28,18,8,0.18)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}>
          <div style={{ width: 36, height: 36, background: accentBg, border: `1px solid ${accentColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {isDangerous ? <TriangleAlert size={16} color={accentColor} strokeWidth={2} /> : <AlertCircle size={16} color={accentColor} strokeWidth={2} />}
          </div>
          <div>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 800, color: titleColor, margin: '0 0 4px' }}>{title}</h3>
            <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 13.5, color: messageColor, lineHeight: 1.6, margin: 0 }}>{message}</p>
          </div>
        </div>
        {!autoClose && (
          <div style={{ borderTop: `1px solid ${panelBorder}`, paddingTop: 18, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onCancel} disabled={isLoading} style={{ padding: '9px 18px', background: '#FFFFFF', border: `1px solid ${isDangerous ? '#C98B84' : P.sand}`, fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', color: isDangerous ? '#7C241C' : P.inkSecondary, cursor: 'pointer', transition: 'all 0.12s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = isDangerous ? '#FCE9E6' : P.parchment; (e.currentTarget as HTMLElement).style.borderColor = isDangerous ? accentColor : P.inkMuted; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#FFFFFF'; (e.currentTarget as HTMLElement).style.borderColor = isDangerous ? '#C98B84' : P.sand; }}>
              {cancelLabel}
            </button>
            {onConfirm && (
              <button type="button" onClick={onConfirm} disabled={isLoading} style={{ padding: '9px 18px', background: accentColor, border: 'none', fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#fff', cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.6 : 1, transition: 'background 0.12s' }}>
                {isLoading ? 'Processing…' : confirmLabel}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
