import { useState, useEffect, useCallback, useRef } from 'react';
import type { FeedVideo } from '../types/feed';
import { fetchFeed } from '../services/feedApi';

interface UseFeedResult {
  videos: FeedVideo[];
  isLoading: boolean;
  isFetchingMore: boolean;
  error: string | null;
  nextPageToken: string | undefined;
  loadMore: () => void;
  reset: () => void;
  hasLoadedOnce: boolean;
}

export function useFeed(profileId: string | null, source?: string): UseFeedResult {
  const [videos, setVideos] = useState<FeedVideo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  // Track the current request so we can ignore stale responses
  const requestIdRef = useRef(0);

  const fetchInitial = useCallback(async () => {
    if (!profileId) return;

    const id = ++requestIdRef.current;
    setIsLoading(true);
    setError(null);
    setVideos([]);
    setNextPageToken(undefined);
    setHasLoadedOnce(false);

    try {
      const res = await fetchFeed(profileId, { source });
      if (id !== requestIdRef.current) return; // stale
      setVideos(res.videos);
      setNextPageToken(res.nextPageToken);
      setHasLoadedOnce(true);
    } catch (err: any) {
      if (id !== requestIdRef.current) return;
      const serverMessage = err?.response?.data?.error;
      setError(serverMessage || (err instanceof Error ? err.message : 'Failed to load feed'));
      setHasLoadedOnce(true);
    } finally {
      if (id === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [profileId, source]);

  useEffect(() => {
    fetchInitial();
  }, [fetchInitial]);

  const loadMore = useCallback(async () => {
    if (!profileId || !nextPageToken || isFetchingMore) return;

    const id = requestIdRef.current; // don't increment — keep same request chain
    setIsFetchingMore(true);

    try {
      const res = await fetchFeed(profileId, { source, pageToken: nextPageToken });
      if (id !== requestIdRef.current) return;
      setVideos((prev) => {
        const existingIds = new Set(prev.map((v) => v.videoId));
        const newVideos = res.videos.filter((v) => !existingIds.has(v.videoId));
        return [...prev, ...newVideos];
      });
      setNextPageToken(res.nextPageToken);
    } catch (err: any) {
      if (id !== requestIdRef.current) return;
      const serverMessage = err?.response?.data?.error;
      setError(serverMessage || (err instanceof Error ? err.message : 'Failed to load more videos'));
    } finally {
      if (id === requestIdRef.current) {
        setIsFetchingMore(false);
      }
    }
  }, [profileId, source, nextPageToken, isFetchingMore]);

  const reset = useCallback(() => {
    fetchInitial();
  }, [fetchInitial]);

  return { videos, isLoading, isFetchingMore, error, nextPageToken, loadMore, reset, hasLoadedOnce };
}
