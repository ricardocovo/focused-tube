import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useFeed } from '../../hooks/useFeed';
import VideoCard from './VideoCard';
import VideoCardSkeleton from './VideoCardSkeleton';
import FeedSourceTabs from './FeedSourceTabs';
import type { FeedVideo } from '../../types/feed';
import './VideoFeed.css';

interface VideoFeedProps {
  profileId: string;
  onVideoSelect?: (video: FeedVideo) => void;
}

// Grid layout handled by .video-grid CSS class with responsive breakpoints

export default function VideoFeed({ profileId, onVideoSelect }: VideoFeedProps) {
  const [source, setSource] = useState<string | undefined>(undefined);
  const { videos, isLoading, isFetchingMore, error, nextPageToken, loadMore, reset, hasLoadedOnce } =
    useFeed(profileId, source);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Stable callback ref to avoid stale closures in observer
  const loadMoreRef = useRef(loadMore);
  loadMoreRef.current = loadMore;

  const canLoadMore = !!nextPageToken && !isFetchingMore;
  const canLoadMoreRef = useRef(canLoadMore);
  canLoadMoreRef.current = canLoadMore;

  const setupObserver = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && canLoadMoreRef.current) {
          loadMoreRef.current();
        }
      },
      { rootMargin: '200px' },
    );

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }
  }, []);

  useEffect(() => {
    setupObserver();
    return () => {
      observerRef.current?.disconnect();
    };
  }, [setupObserver]);

  // Re-observe when sentinel may have re-mounted (videos changed)
  useEffect(() => {
    if (sentinelRef.current && observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current.observe(sentinelRef.current);
    }
  }, [videos.length]);

  const handleSourceChange = (newSource?: string) => {
    setSource(newSource);
  };

  // Error state
  if (error && !isLoading && videos.length === 0) {
    return (
      <div>
        <FeedSourceTabs activeSource={source} onSourceChange={handleSourceChange} />
        <div className="video-feed-error">
          <p className="video-feed-error-text">{error}</p>
          <button
            onClick={reset}
            className="video-feed-retry-btn"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (!isLoading && hasLoadedOnce && videos.length === 0) {
    return (
      <div>
        <FeedSourceTabs activeSource={source} onSourceChange={handleSourceChange} />
        <div className="video-feed-empty">
          <div className="video-feed-empty-icon">📺</div>
          <p className="video-feed-empty-text">
            No videos found. Add channels to your profile to see videos here.
          </p>
          <Link
            to="/profiles"
            className="video-feed-empty-cta"
          >
            Edit Profile
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <FeedSourceTabs activeSource={source} onSourceChange={handleSourceChange} />

      {/* Initial loading state */}
      {isLoading && (
        <div className="video-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <VideoCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Video grid */}
      {!isLoading && videos.length > 0 && (
        <>
          <div className="video-grid">
            {videos.map((video) => (
              <VideoCard key={video.videoId} video={video} onSelect={onVideoSelect} />
            ))}
            {/* Extra skeletons while fetching more */}
            {isFetchingMore &&
              Array.from({ length: 4 }).map((_, i) => <VideoCardSkeleton key={`more-${i}`} />)}
          </div>

          {/* Sentinel for infinite scroll */}
          <div ref={sentinelRef} className="video-feed-sentinel" />

          {/* All caught up */}
          {!nextPageToken && hasLoadedOnce && (
            <p className="video-feed-caught-up">
              You're all caught up! 🎉
            </p>
          )}
        </>
      )}

      {/* Inline error with videos already shown */}
      {error && videos.length > 0 && (
        <div className="video-feed-inline-error">
          <p className="video-feed-inline-error-text">{error}</p>
          <button
            onClick={reset}
            className="video-feed-inline-retry-btn"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
