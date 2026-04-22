import type { SubscriptionChannel } from '../../types/youtube';
import './SubscriptionChannelRow.css';

interface Props {
  channel: SubscriptionChannel;
  isSelected: boolean;
  isSaving: boolean;
  onToggle: () => void;
}

export default function SubscriptionChannelRow({ channel, isSelected, isSaving, onToggle }: Props) {
  const disabled = isSaving;

  let btnLabel = 'Select';
  let btnClass = 'sub-channel-btn';

  if (isSaving) {
    btnLabel = isSelected ? 'Updating…' : 'Updating…';
    btnClass += ' sub-channel-btn--saving';
  } else if (isSelected) {
    btnLabel = 'Selected';
    btnClass += ' sub-channel-btn--selected';
  }

  return (
    <div className={`subscription-row${isSelected ? ' subscription-row--selected' : ''}`}>
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

      <button
        type="button"
        aria-pressed={isSelected}
        aria-label={isSelected ? `Remove ${channel.channelTitle}` : `Add ${channel.channelTitle}`}
        disabled={disabled}
        onClick={onToggle}
        className={btnClass}
      >
        {btnLabel}
      </button>
    </div>
  );
}
