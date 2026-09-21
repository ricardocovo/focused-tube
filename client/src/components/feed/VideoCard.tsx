import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import type { FeedVideo } from '../../types/feed';
import './VideoCard.css';

interface VideoCardProps {
  video: FeedVideo;
  onSelect?: (video: FeedVideo) => void;
}

const compactCountFormatter = new Intl.NumberFormat('en', {
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

function formatCount(count: string): string {
  const parsed = Number(count);
  if (!Number.isFinite(parsed)) return count;
  return compactCountFormatter.format(parsed);
}

function formatStat(count: string | undefined, label: string): string | null {
  if (count === undefined) return null;
  const formatted = formatCount(count);
  const suffix = count === '1' ? label : `${label}s`;
  return `${formatted} ${suffix}`;
}

const VideoCard: React.FC<VideoCardProps> = React.memo(function VideoCard({ video, onSelect }) {
  const relativeTime = formatDistanceToNow(new Date(video.publishedAt), { addSuffix: true });
  const duration = video.duration ? formatDuration(video.duration) : null;
  const stats = [
    { type: 'views', text: formatStat(video.viewCount, 'view') },
    { type: 'likes', text: formatStat(video.likeCount, 'like') },
    { type: 'dislikes', text: formatStat(video.dislikeCount, 'dislike') },
  ].filter((stat): stat is { type: string; text: string } => stat.text !== null);

  return (
    <button
      type="button"
      className="video-card"
      onClick={() => onSelect?.(video)}
    >
      <span className="sr-only">Play </span>
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
        </div>
        {stats.length > 0 && (
          <div className="video-card-socials">
            {stats.map((stat) => (
              <span key={stat.type} className="video-card-social">
                {stat.text}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  );
});

export default VideoCard;
