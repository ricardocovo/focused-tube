const shimmerKeyframes = `
@keyframes ft-shimmer {
  0% { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
`;

const shimmerBg: React.CSSProperties = {
  background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
  backgroundSize: '400px 100%',
  animation: 'ft-shimmer 1.4s ease infinite',
  borderRadius: 4,
};

let styleInjected = false;
function injectStyle() {
  if (styleInjected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.textContent = shimmerKeyframes;
  document.head.appendChild(style);
  styleInjected = true;
}

export default function SubscriptionItemSkeleton() {
  injectStyle();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 14px',
        background: '#f9f9f9',
        borderRadius: 6,
      }}
    >
      {/* Avatar circle */}
      <div style={{ ...shimmerBg, width: 48, height: 48, borderRadius: '50%', flexShrink: 0 }} />

      {/* Text lines */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ ...shimmerBg, height: 14, width: '40%' }} />
        <div style={{ ...shimmerBg, height: 12, width: '70%' }} />
      </div>

      {/* Button placeholder */}
      <div style={{ ...shimmerBg, width: 100, height: 32, borderRadius: 6, flexShrink: 0 }} />
    </div>
  );
}
