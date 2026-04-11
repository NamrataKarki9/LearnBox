export const P = {
  parchment: 'var(--color-parchment)',
  parchmentLight: 'var(--color-parchment-light)',
  parchmentDark: 'var(--color-parchment-dark)',
  ink: 'var(--color-deep-ink)',
  inkSecondary: 'var(--color-ink-secondary)',
  inkMuted: 'var(--color-ink-muted)',
  sand: 'var(--color-warm-sand)',
  sandLight: 'var(--color-warm-sand-light)',
  vermillion: 'var(--color-vermillion)',
  vermillionBg: 'var(--color-vermillion-light)',
  moss: 'var(--color-moss)',
  mossBg: 'var(--color-moss-light)',
  purple: 'var(--color-purple)',
  purpleBg: 'var(--color-purple-light)'
};

export const paperStyles = {
  h1: { fontFamily: "'Playfair Display', serif", fontSize: 48, fontWeight: 900, color: P.ink, margin: '0 0 16px', lineHeight: 1.1, letterSpacing: '-0.02em' },
  h2: { fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 800, color: P.ink, margin: '0 0 24px', letterSpacing: '-0.01em' },
  h3: { fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 800, color: P.ink, margin: '0 0 16px', letterSpacing: '-0.01em' },
  p: { fontFamily: "'Lora', Georgia, serif", fontSize: 18, color: P.inkSecondary, lineHeight: 1.6, margin: '0 0 16px' },
  label: { fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 14, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: P.vermillion, margin: '0 0 8px', display: 'block' },
  input: { width: '100%', padding: '12px 16px', background: 'transparent', border: 'none', borderBottom: `2px solid ${P.ink}`, fontFamily: "'Lora', Georgia, serif", fontSize: 16, color: P.ink, outline: 'none', boxSizing: 'border-box' as const }
};

export const adminSelectStyle = {
  appearance: 'none' as const,
  WebkitAppearance: 'none' as const,
  MozAppearance: 'none' as const,
  backgroundColor: P.parchmentLight,
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%23756450' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  backgroundSize: '14px',
  paddingRight: '38px'
};
