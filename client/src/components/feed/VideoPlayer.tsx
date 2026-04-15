import React, { useRef, useEffect } from 'react';
import type { FeedVideo } from '../../types/feed';
import './VideoPlayer.css';

interface VideoPlayerProps {
  video: FeedVideo;
  onClose: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ video, onClose }) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Focus close button on mount
  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  // Escape key closes player
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="video-player">
      <div className="video-player-inner">
        <button
          ref={closeButtonRef}
          className="video-player-close"
          aria-label="Close video player"
          onClick={onClose}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        <div className="video-player-iframe-wrapper">
          <iframe
            key={video.videoId}
            src={`https://www.youtube-nocookie.com/embed/${video.videoId}?autoplay=1&origin=${encodeURIComponent(window.location.origin)}`}
            title={video.title}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        </div>

        <div className="video-player-info">
          <h2 className="video-player-title">{video.title}</h2>
          <p className="video-player-channel">{video.channelTitle}</p>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
