export interface Profile {
  id: string;
  name: string;
  isDefault: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
  channels?: ProfileChannel[];
  keywords?: ProfileKeyword[];
  _count?: { channels: number; keywords: number };
}

export interface ProfileChannel {
  id: string;
  profileId: string;
  youtubeChannelId: string;
  channelTitle: string;
  thumbnailUrl: string | null;
  createdAt: string;
}

export interface ProfileKeyword {
  id: string;
  profileId: string;
  keyword: string;
  createdAt: string;
}
