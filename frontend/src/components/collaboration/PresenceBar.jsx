import { Users, Wifi, WifiOff, Circle } from 'lucide-react';

/**
 * PresenceBar — Hiển thị ai đang online trong room.
 * Compact bar phía trên content area.
 */
export default function PresenceBar({ isConnected, members = [], clientId }) {
  if (!isConnected && members.length === 0) return null;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px',
      borderRadius: 'var(--radius-md)', background: 'var(--c-bg-secondary)',
      border: '1px solid var(--c-border)', fontSize: '0.6875rem',
    }}>
      {/* Connection status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {isConnected ? (
          <Wifi size={12} style={{ color: '#10b981' }} />
        ) : (
          <WifiOff size={12} style={{ color: '#ef4444' }} />
        )}
        <span style={{ color: isConnected ? '#10b981' : '#ef4444', fontWeight: 600 }}>
          {isConnected ? 'Live' : 'Offline'}
        </span>
      </div>

      <div style={{ width: 1, height: 16, background: 'var(--c-border)' }} />

      {/* Member avatars */}
      <div style={{ display: 'flex', alignItems: 'center', gap: -4 }}>
        {members.slice(0, 5).map((m, i) => (
          <div key={m.clientId} title={m.name} style={{
            width: 22, height: 22, borderRadius: '50%',
            background: m.clientId === clientId ? 'var(--c-accent-gradient)' : 'var(--c-bg-tertiary)',
            border: '2px solid var(--c-bg-card)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.5rem', fontWeight: 700, color: m.clientId === clientId ? '#fff' : 'var(--c-text-secondary)',
            marginLeft: i > 0 ? -4 : 0,
          }}>
            {(m.name || 'U').charAt(0).toUpperCase()}
          </div>
        ))}
        {members.length > 5 && (
          <span style={{ marginLeft: 4, color: 'var(--c-text-muted)', fontWeight: 600 }}>
            +{members.length - 5}
          </span>
        )}
      </div>

      <span style={{ color: 'var(--c-text-muted)', marginLeft: 'auto' }}>
        <Users size={11} style={{ marginRight: 3, verticalAlign: 'middle' }} />
        {members.length}
      </span>
    </div>
  );
}
