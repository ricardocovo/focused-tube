import type { SubscriptionChannel } from '../../types/youtube';

interface Props {
  channel: SubscriptionChannel;
  isAdded: boolean;
  isAdding: boolean;
  onAdd: () => void;
}

export default function SubscriptionChannelRow({ channel, isAdded, isAdding, onAdd }: Props) {
  const disabled = isAdded || isAdding;

  let btnLabel = 'Add to Profile';
  let btnStyle: React.CSSProperties = {
    padding: '6px 14px',
    fontSize: 13,
    fontWeight: 600,
    border: 'none',
    borderRadius: 999,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    color: '#fff',
    backgroundColor: 'var(--ft-primary)',
    transition: 'background 0.15s, opacity 0.15s',
  };

  if (isAdded) {
    btnLabel = 'Added ✓';
    btnStyle = {
      ...btnStyle,
      backgroundColor: 'var(--ft-success-bg)',
      color: 'var(--ft-success)',
      cursor: 'default',
      opacity: 0.9,
    };
  } else if (isAdding) {
    btnLabel = 'Adding…';
    btnStyle = { ...btnStyle, opacity: 0.6, cursor: 'not-allowed' };
  }

  return (
    <div className="subscription-row">
      <img
        src={channel.thumbnailUrl ?? undefined}
        alt={channel.channelTitle}
      />

      <div className="subscription-row-info">
        <div className="subscription-row-title">
          {channel.channelTitle}
        </div>
        {channel.description && (
          <div className="subscription-row-desc">
            {channel.description}
          </div>
        )}
      </div>

      <button disabled={disabled} onClick={onAdd} style={btnStyle}>
        {btnLabel}
      </button>
    </div>
  );
}
