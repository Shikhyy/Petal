type IconName =
  | 'dashboard'
  | 'chat'
  | 'task'
  | 'calendar'
  | 'note'
  | 'agents'
  | 'mcp'
  | 'activity'
  | 'settings'
  | 'profile'
  | 'diagnostics'
  | 'help'
  | 'search'
  | 'home'
  | 'spark'
  | 'trophy'
  | 'rocket'
  | 'target';

export function AppIcon({ name, size = 18 }: { name: IconName; size?: number }) {
  const common = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  switch (name) {
    case 'dashboard':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h6v6H4z" {...common} /><path d="M14 4h6v6h-6z" {...common} /><path d="M4 14h6v6H4z" {...common} /><path d="M14 14h6v6h-6z" {...common} /></svg>
      );
    case 'chat':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v10H9l-5 4z" {...common} /><path d="M8 9h8" {...common} /><path d="M8 12h6" {...common} /></svg>
      );
    case 'task':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2" {...common} /><path d="M7 9h10" {...common} /><path d="M7 13h6" {...common} /><path d="M7 17h4" {...common} /></svg>
      );
    case 'calendar':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2" {...common} /><path d="M8 3v4" {...common} /><path d="M16 3v4" {...common} /><path d="M3 10h18" {...common} /><path d="M8 14h3" {...common} /></svg>
      );
    case 'note':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h9l3 3v15H6z" {...common} /><path d="M15 3v4h4" {...common} /><path d="M9 12h6" {...common} /><path d="M9 16h4" {...common} /></svg>
      );
    case 'agents':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><circle cx="8" cy="8" r="2" {...common} /><circle cx="16" cy="8" r="2" {...common} /><path d="M5 19c0-2 1.8-4 3-4s3 2 3 4" {...common} /><path d="M13 19c0-2 1.8-4 3-4s3 2 3 4" {...common} /><path d="M8 10v3" {...common} /><path d="M16 10v3" {...common} /></svg>
      );
    case 'mcp':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l-3 5 3 5" {...common} /><path d="M17 7l3 5-3 5" {...common} /><path d="M9 12h6" {...common} /><path d="M12 5l-2 14" {...common} /></svg>
      );
    case 'activity':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><path d="M4 13h4l2-8 4 16 2-8h4" {...common} /></svg>
      );
    case 'settings':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3" {...common} /><path d="M19 12a7 7 0 0 0-.1-1l2-1.2-2-3.5-2.2.8a7 7 0 0 0-1.7-1L15 3h-6l-.9 2.1a7 7 0 0 0-1.7 1L4.2 5.3l-2 3.5 2 1.2a7 7 0 0 0 0 2.1l-2 1.2 2 3.5 2.2-.8a7 7 0 0 0 1.7 1L9 21h6l.9-2.1a7 7 0 0 0 1.7-1l2.2.8 2-3.5-2-1.2c.1-.3.1-.7.1-1.1Z" {...common} /></svg>
      );
    case 'profile':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5" {...common} /><path d="M5 20c1.5-3.5 4-5 7-5s5.5 1.5 7 5" {...common} /></svg>
      );
    case 'diagnostics':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" {...common} /><path d="M8 12h3l1-3 2 6 1-3h1" {...common} /></svg>
      );
    case 'help':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" {...common} /><path d="M9.5 9a2.75 2.75 0 0 1 5 1.5c0 1.5-1.5 2.3-2.3 3.1-.4.4-.7.8-.7 1.4" {...common} /><path d="M12 17h.01" {...common} /></svg>
      );
    case 'search':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" {...common} /><path d="M16 16l4 4" {...common} /></svg>
      );
    case 'home':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11l8-7 8 7" {...common} /><path d="M6 10v10h12V10" {...common} /></svg>
      );
    case 'spark':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8z" {...common} /><path d="M18 15l.8 1.8L21 17.6l-2.2.9L18 20.3l-.8-1.8-2.2-.9 2.2-.8z" {...common} /></svg>
      );
    case 'trophy':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4h8v3a4 4 0 0 1-8 0V4Z" {...common} /><path d="M6 4h12v1a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4V4Z" {...common} /><path d="M9 17h6" {...common} /><path d="M10 17v3h4v-3" {...common} /></svg>
      );
    case 'rocket':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4c3 0 5 2 5 5 0 5-4 9-9 9-3 0-5-2-5-5 0-5 4-9 9-9Z" {...common} /><path d="M10 14l4-4" {...common} /><path d="M8 16l-2 4 4-2" {...common} /></svg>
      );
    case 'target':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" {...common} /><circle cx="12" cy="12" r="4" {...common} /><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" /></svg>
      );
    default:
      return null;
  }
}
