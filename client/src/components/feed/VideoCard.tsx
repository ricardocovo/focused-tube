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
        </div>
      </div>
    </button>
  );
});

export default VideoCard;
