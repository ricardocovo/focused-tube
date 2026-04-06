import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import type { FeedVideo } from '../../types/feed';

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
      <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', background: '#f0f0f0' }}>
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          loading="lazy"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </div>

      {/* Info */}
      <div style={{ padding: 12 }}>
        <h3 className="video-card-title">{video.title}</h3>
        <p className="video-card-channel">{video.channelTitle}</p>
        <div className="video-card-meta">
          <span style={{ fontSize: 12, color: '#909090' }}>{relativeTime}</span>
          <span className={badgeClass}>{badgeLabel}</span>
        </div>
      </div>
    </a>
  );
});

export default VideoCard;
