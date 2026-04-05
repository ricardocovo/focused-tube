import type { SubscriptionChannel } from '../../types/youtube';

const BLUE = '#11A0D9';
const MINT = '#80F2DD';

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
    borderRadius: 6,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    color: '#fff',
    backgroundColor: BLUE,
  };

  if (isAdded) {
    btnLabel = 'Added ✓';
    btnStyle = {
      ...btnStyle,
      backgroundColor: MINT,
      color: '#1a5c4a',
      cursor: 'default',
      opacity: 0.9,
    };
  } else if (isAdding) {
    btnLabel = 'Adding…';
    btnStyle = { ...btnStyle, opacity: 0.6, cursor: 'not-allowed' };
  }

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
      <img
        src={channel.thumbnailUrl ?? undefined}
        alt={channel.channelTitle}
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
          background: '#ddd',
        }}
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>
          {channel.channelTitle}
        </div>
        {channel.description && (
          <div
            style={{
              fontSize: 12,
              color: '#666',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
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
