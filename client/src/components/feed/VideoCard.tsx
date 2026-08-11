import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import type { FeedVideo } from '../../types/feed';
import './VideoCard.css';

interface VideoCardProps {
  video: FeedVideo;
  onSelect?: (video: FeedVideo) => void;
}

const COMPACT_COUNT_FORMATTER = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

/** Converts ISO 8601 duration (e.g. PT4M13S) to a display string (e.g. 4:13 or 1:23:45). */
function formatDuration(iso: string): string {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '';
  const h = parseInt(match[1] ?? '0', 10);
  const m = parseInt(match[2] ?? '0', 10);
  const s = parseInt(match[3] ?? '0', 10);
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m);
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

function formatMetricCount(rawCount: string | undefined): string {
  if (rawCount === undefined) return '—';
  const parsed = Number(rawCount);
  if (!Number.isFinite(parsed) || parsed < 0) return '—';
  return COMPACT_COUNT_FORMATTER.format(parsed);
}

const VideoCard: React.FC<VideoCardProps> = React.memo(function VideoCard({ video, onSelect }) {
  const relativeTime = formatDistanceToNow(new Date(video.publishedAt), { addSuffix: true });
  const duration = video.duration ? formatDuration(video.duration) : null;
  const viewCount = formatMetricCount(video.viewCount);
  const likeCount = formatMetricCount(video.likeCount);
  const dislikeCount = formatMetricCount(video.dislikeCount);

  return (
    <button
      type="button"
      className="video-card"
      aria-label={`Play ${video.title} by ${video.channelTitle}`}
      onClick={() => onSelect?.(video)}
    >
      {/* Thumbnail */}
      <div className="video-card-thumbnail">
        <img
          src={video.thumbnailUrl}
          alt=""
          loading="lazy"
        />
        {duration && (
          <span className="video-card-duration" aria-label={`Duration: ${duration}`}>
            {duration}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="video-card-info">
        <p className="video-card-title">{video.title}</p>
        <p className="video-card-channel">{video.channelTitle}</p>
        <div className="video-card-meta">
          <span className="video-card-time">{relativeTime}</span>
          <span className="video-card-stat" aria-label={`Views: ${viewCount === '—' ? 'Unavailable' : viewCount}`}>
            Views {viewCount}
          </span>
          <span className="video-card-stat" aria-label={`Likes: ${likeCount === '—' ? 'Unavailable' : likeCount}`}>
            Likes {likeCount}
          </span>
          <span className="video-card-stat" aria-label={`Dislikes: ${dislikeCount === '—' ? 'Unavailable' : dislikeCount}`}>
            Dislikes {dislikeCount}
          </span>
        </div>
      </div>
    </button>
  );
});

export default VideoCard;
