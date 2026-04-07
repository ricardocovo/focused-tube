import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import type { FeedVideo } from '../../types/feed';
import './VideoCard.css';

interface VideoCardProps {
  video: FeedVideo;
}

const VideoCard: React.FC<VideoCardProps> = React.memo(function VideoCard({ video }) {
  const relativeTime = formatDistanceToNow(new Date(video.publishedAt), { addSuffix: true });

  const isSubscription = video.source === 'subscription';
  const badgeLabel = isSubscription ? 'Subscription' : 'Search';

  const badgeClass = `source-badge ${isSubscription ? 'source-badge-subscription' : 'source-badge-search'}`;

  return (
    <a
      href={`https://www.youtube.com/watch?v=${video.videoId}`}
      target="_blank"
      rel="noopener noreferrer"
      className="video-card"
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
        </div>
      </div>
    </a>
  );
});

export default VideoCard;
