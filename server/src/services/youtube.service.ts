import { google, youtube_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import prisma from '../utils/prisma';
import { config } from '../utils/config';
import { encrypt, decrypt } from '../utils/encryption';

export interface Subscription {
  youtubeChannelId: string;
  channelTitle: string;
  thumbnailUrl: string | null;
  description: string;
}

export interface Video {
  videoId: string;
  title: string;
  description: string;
  channelId: string;
  channelTitle: string;
  thumbnailUrl: string;
  publishedAt: string;
  source: 'subscription' | 'search';
}

export interface SearchVideosParams {
  channelId?: string;
  query?: string;
  maxResults?: number;
  publishedAfter?: string;
  pageToken?: string;
}

export interface SearchVideosResult {
  videos: Video[];
  nextPageToken?: string;
}

function createOAuth2Client(): OAuth2Client {
  return new google.auth.OAuth2(
    config.GOOGLE_CLIENT_ID,
    config.GOOGLE_CLIENT_SECRET,
  );
}

async function getAuthenticatedClient(userId: string): Promise<{
  oauth2Client: OAuth2Client;
  youtube: youtube_v3.Youtube;
}> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error('User not found');
  }

  const accessToken = decrypt(user.accessToken);
  const refreshToken = decrypt(user.refreshToken);

  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
  return { oauth2Client, youtube };
}

async function refreshAndSaveToken(
  userId: string,
  oauth2Client: OAuth2Client,
  encryptedRefreshToken: string,
): Promise<void> {
  const refreshToken = decrypt(encryptedRefreshToken);

  // Create a fresh client with only the refresh token to force a refresh
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  const { token } = await oauth2Client.getAccessToken();

  if (!token) {
    throw new Error('Failed to refresh access token');
  }

  const newEncryptedAccessToken = encrypt(token);
  await prisma.user.update({
    where: { id: userId },
    data: { accessToken: newEncryptedAccessToken },
  });

  oauth2Client.setCredentials({
    access_token: token,
    refresh_token: refreshToken,
  });
}

function isUnauthorizedError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: number }).code === 401
  );
}

export function isInsufficientScopeError(error: unknown): boolean {
  if (typeof error === 'object' && error !== null) {
    const e = error as any;
    return (
      e.code === 403 &&
      Array.isArray(e.errors) &&
      e.errors.some((err: any) => err.reason === 'insufficientPermissions')
    );
  }
  return false;
}

export async function getUserSubscriptions(userId: string): Promise<Subscription[]> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error('User not found');
  }

  const { oauth2Client, youtube } = await getAuthenticatedClient(userId);

  try {
    return await fetchAllSubscriptions(youtube);
  } catch (error) {
    if (isUnauthorizedError(error)) {
      await refreshAndSaveToken(userId, oauth2Client, user.refreshToken);
      const retryYoutube = google.youtube({ version: 'v3', auth: oauth2Client });
      return await fetchAllSubscriptions(retryYoutube);
    }
    throw error;
  }
}

async function fetchAllSubscriptions(youtube: youtube_v3.Youtube): Promise<Subscription[]> {
  const subscriptions: Subscription[] = [];
  let pageToken: string | undefined;

  do {
    const response: youtube_v3.Schema$SubscriptionListResponse = (
      await youtube.subscriptions.list({
        part: ['snippet'],
        mine: true,
        maxResults: 50,
        pageToken,
      })
    ).data;

    const items = response.items ?? [];
    for (const item of items) {
      const snippet = item.snippet;
      if (snippet?.resourceId?.channelId) {
        subscriptions.push({
          youtubeChannelId: snippet.resourceId.channelId,
          channelTitle: snippet.title ?? '',
          thumbnailUrl: snippet.thumbnails?.default?.url ?? null,
          description: snippet.description ?? '',
        });
      }
    }

    pageToken = response.nextPageToken ?? undefined;
  } while (pageToken);

  return subscriptions;
}

export async function searchVideos(
  userId: string,
  params: SearchVideosParams,
): Promise<SearchVideosResult> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error('User not found');
  }

  const { oauth2Client, youtube } = await getAuthenticatedClient(userId);

  const requestParams: youtube_v3.Params$Resource$Search$List = {
    part: ['snippet'],
    type: ['video'],
    order: 'date',
    maxResults: params.maxResults ?? 25,
  };

  if (params.channelId) requestParams.channelId = params.channelId;
  if (params.query) requestParams.q = params.query;
  if (params.publishedAfter) requestParams.publishedAfter = params.publishedAfter;
  if (params.pageToken) requestParams.pageToken = params.pageToken;

  const source: Video['source'] = params.channelId ? 'subscription' : 'search';

  try {
    return await executeSearch(youtube, requestParams, source);
  } catch (error) {
    if (isUnauthorizedError(error)) {
      await refreshAndSaveToken(userId, oauth2Client, user.refreshToken);
      const retryYoutube = google.youtube({ version: 'v3', auth: oauth2Client });
      return await executeSearch(retryYoutube, requestParams, source);
    }
    throw error;
  }
}

async function executeSearch(
  youtube: youtube_v3.Youtube,
  requestParams: youtube_v3.Params$Resource$Search$List,
  source: Video['source'],
): Promise<SearchVideosResult> {
  const response = await youtube.search.list(requestParams);

  const videos: Video[] = (response.data.items ?? [])
    .filter((item) => item.id?.videoId && item.snippet)
    .map((item) => ({
      videoId: item.id!.videoId!,
      title: item.snippet!.title ?? '',
      description: item.snippet!.description ?? '',
      channelId: item.snippet!.channelId ?? '',
      channelTitle: item.snippet!.channelTitle ?? '',
      thumbnailUrl: item.snippet!.thumbnails?.medium?.url ?? '',
      publishedAt: item.snippet!.publishedAt ?? '',
      source,
    }));

  return {
    videos,
    nextPageToken: response.data.nextPageToken ?? undefined,
  };
}
