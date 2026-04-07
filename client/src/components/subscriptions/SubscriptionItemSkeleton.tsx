import Skeleton from '../ui/Skeleton';

export default function SubscriptionItemSkeleton() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 14px',
        background: 'var(--ft-surface)',
        borderRadius: 8,
        border: '1px solid var(--ft-border)',
      }}
    >
      {/* Avatar circle */}
      <Skeleton style={{ width: 48, height: 48, borderRadius: '50%', flexShrink: 0 }} />

      {/* Text lines */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Skeleton style={{ height: 14, width: '40%' }} />
        <Skeleton style={{ height: 12, width: '70%' }} />
      </div>

      {/* Button placeholder */}
      <Skeleton style={{ width: 100, height: 32, borderRadius: 6, flexShrink: 0 }} />
    </div>
  );
}
