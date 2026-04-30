import { AppIcon } from './AppIcon';

type WinnerStampProps = {
  compact?: boolean;
  className?: string;
};

export function WinnerStamp({ compact = false, className = '' }: WinnerStampProps) {
  const isCompact = compact;

  return (
    <div
      className={`winner-stamp ${isCompact ? 'compact' : 'hero'} ${className}`.trim()}
      aria-label="Hackathon winner stamp"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: isCompact ? 10 : 14,
        padding: isCompact ? '8px 12px' : '16px 18px',
        minWidth: isCompact ? 170 : 280,
        border: '3px solid var(--ink)',
        background: 'linear-gradient(135deg, var(--c1) 0%, var(--c2) 55%, var(--c3) 100%)',
        boxShadow: '6px 6px 0 var(--ink)',
        transform: 'rotate(-4deg)',
        transformOrigin: 'center',
        textTransform: 'uppercase',
        position: 'relative',
        isolation: 'isolate',
      }}
    >
      <span
        style={{
          width: isCompact ? 34 : 48,
          height: isCompact ? 34 : 48,
          borderRadius: '50%',
          border: '2px solid var(--ink)',
          background: 'rgba(255, 248, 245, 0.78)',
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
          boxShadow: 'inset 0 0 0 2px rgba(26, 10, 13, 0.08)',
        }}
      >
        <AppIcon name="trophy" size={isCompact ? 16 : 22} />
      </span>

      <span style={{ display: 'flex', flexDirection: 'column', gap: isCompact ? 2 : 4, lineHeight: 1 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: isCompact ? 8 : 10, letterSpacing: '2px', fontWeight: 700 }}>
          Hackathon Winner
        </span>
        <span style={{ fontFamily: 'var(--display)', fontSize: isCompact ? 20 : 34, letterSpacing: '1px', lineHeight: 0.9 }}>
          PETAL
        </span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: isCompact ? 8 : 10, letterSpacing: '1px', color: 'var(--c5)' }}>
          Built to ship
        </span>
      </span>
    </div>
  );
}
