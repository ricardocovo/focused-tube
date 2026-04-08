import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import type { FeedVideo } from '../../types/feed';
import './VideoCard.css';

interface VideoCardProps {
  video: FeedVideo;
  onSelect?: (video: FeedVideo) => void;
}

const VideoCard: React.FC<VideoCardProps> = React.memo(function VideoCard({ video, onSelect }) {
  const relativeTime = formatDistanceToNow(new Date(video.publishedAt), { addSuffix: true });

  const isSubscription = video.source === 'subscription';
  const badgeLabel = isSubscription ? 'Subscription' : 'Search';

  const badgeClass = `source-badge ${isSubscription ? 'source-badge-subscription' : 'source-badge-search'}`;

  return (
    <button
      type="button"
      className="video-card"
      onClick={() => onSelect?.(video)}
    >
      {/* Thumbnail */}
      <div className="video-card-thumbnail">
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          loading="lazy"
        />
      </div>

      {/* Info */}
      <div className="video-card-info">
        <h3 className="video-card-title">{video.title}</h3>
        <p className="video-card-channel">{video.channelTitle}</p>
        <div className="video-card-meta">
          <span className="video-card-time">{relativeTime}</span>
          <span className={badgeClass}>{badgeLabel}</span>
          <a
            href={`https://www.youtube.com/watch?v=${video.videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${video.title} on YouTube`}
            className="video-card-yt-link"
            onClick={(e) => e.stopPropagation()}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M6 3h7v7M13 3L6 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      </div>
    </button>
  );
});

export default VideoCard;
