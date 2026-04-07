import type { SubscriptionChannel } from '../../types/youtube';
import './SubscriptionChannelRow.css';

interface Props {
  channel: SubscriptionChannel;
  isAdded: boolean;
  isAdding: boolean;
  onAdd: () => void;
}

export default function SubscriptionChannelRow({ channel, isAdded, isAdding, onAdd }: Props) {
  const disabled = isAdded || isAdding;

  let btnLabel = 'Add to Profile';
  let btnClass = 'sub-channel-btn';

  if (isAdded) {
    btnLabel = 'Added ✓';
    btnClass += ' sub-channel-btn--added';
  } else if (isAdding) {
    btnLabel = 'Adding…';
    btnClass += ' sub-channel-btn--adding';
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

      <button disabled={disabled} onClick={onAdd} className={btnClass}>
        {btnLabel}
      </button>
    </div>
  );
}
