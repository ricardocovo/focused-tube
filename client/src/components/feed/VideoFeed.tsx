import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useFeed } from '../../hooks/useFeed';
import VideoCard from './VideoCard';
import VideoCardSkeleton from './VideoCardSkeleton';
import FeedSourceTabs from './FeedSourceTabs';

const CORAL = '#F2594B';
const BLUE = '#11A0D9';

interface VideoFeedProps {
  profileId: string;
}

// Grid layout handled by .video-grid CSS class with responsive breakpoints

export default function VideoFeed({ profileId }: VideoFeedProps) {
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
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <p style={{ fontSize: 16, color: CORAL, marginBottom: 16 }}>{error}</p>
          <button
            onClick={reset}
            style={{
              padding: '10px 24px',
              fontSize: 14,
              fontWeight: 600,
              color: '#fff',
              backgroundColor: CORAL,
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
            }}
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
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📺</div>
          <p style={{ fontSize: 16, color: '#666', marginBottom: 16 }}>
            No videos found. Add channels or keywords to your profile to see videos here.
          </p>
          <Link
            to="/profiles"
            style={{
              display: 'inline-block',
              padding: '10px 24px',
              fontSize: 14,
              fontWeight: 600,
              color: '#fff',
              backgroundColor: BLUE,
              borderRadius: 6,
              textDecoration: 'none',
            }}
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
              <VideoCard key={video.videoId} video={video} />
            ))}
            {/* Extra skeletons while fetching more */}
            {isFetchingMore &&
              Array.from({ length: 4 }).map((_, i) => <VideoCardSkeleton key={`more-${i}`} />)}
          </div>

          {/* Sentinel for infinite scroll */}
          <div ref={sentinelRef} style={{ height: 1 }} />

          {/* All caught up */}
          {!nextPageToken && hasLoadedOnce && (
            <p
              style={{
                textAlign: 'center',
                padding: '32px 0',
                fontSize: 14,
                color: '#999',
              }}
            >
              You're all caught up! 🎉
            </p>
          )}
        </>
      )}

      {/* Inline error with videos already shown */}
      {error && videos.length > 0 && (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <p style={{ fontSize: 14, color: CORAL, marginBottom: 8 }}>{error}</p>
          <button
            onClick={reset}
            style={{
              padding: '8px 20px',
              fontSize: 13,
              fontWeight: 600,
              color: '#fff',
              backgroundColor: CORAL,
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
