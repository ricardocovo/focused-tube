export interface FeedVideo {
  videoId: string;
  title: string;
  channelId: string;
  channelTitle: string;
  thumbnailUrl: string;
  publishedAt: string;
  source: 'subscription' | 'search';
  duration?: string;
  stats?: {
    viewCount: number | null;
    likeCount: number | null;
    dislikeCount: number | null;
  };
}

export interface FeedResponse {
  videos: FeedVideo[];
  nextPageToken?: string;
}
