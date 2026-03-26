type DesktopShellBadgeProps = {
  platform: string;
};

export function DesktopShellBadge({ platform }: DesktopShellBadgeProps) {
  const inDesktop = typeof window !== 'undefined' && typeof window.api !== 'undefined';

  return (
    <div
      style={{
        padding: '6px 10px',
        margin: '8px',
        borderRadius: 8,
        fontSize: 12,
        display: 'inline-block',
        background: inDesktop ? '#DCFCE7' : '#DBEAFE',
        color: '#1E293B',
      }}
    >
      {inDesktop ? `Desktop Shell (${platform})` : `Web Browser (${platform})`}
    </div>
  );
}
