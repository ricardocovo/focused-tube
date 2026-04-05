import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { authenticateJwt } from '../middleware/auth';
import { searchVideos, Video } from '../services/youtube.service';

const router = Router();
router.use(authenticateJwt);

function isQuotaError(error: unknown): boolean {
  if (typeof error === 'object' && error !== null) {
    const e = error as any;
    return e.code === 403 && e.errors?.[0]?.reason === 'quotaExceeded';
  }
  return false;
}

router.get('/:profileId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profileId = Array.isArray(req.params.profileId)
      ? req.params.profileId[0]
      : req.params.profileId;

    const source = req.query.source as string | undefined;
    const pageToken = req.query.pageToken as string | undefined;

    if (source !== undefined && source !== 'subscriptions' && source !== 'search') {
      res.status(400).json({ error: 'source must be "subscriptions" or "search"' });
      return;
    }

    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      include: { channels: true, keywords: true },
    });

    if (!profile) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }

    if (profile.userId !== req.user!.id) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    if (profile.channels.length === 0 && profile.keywords.length === 0) {
      res.json({ videos: [] });
      return;
    }

    const userId = req.user!.id;
    const promises: Promise<{ videos: Video[]; nextPageToken?: string }>[] = [];
    const promiseLabels: ('subscription' | 'search')[] = [];

    // Fan out channel searches
    if (source !== 'search') {
      for (const channel of profile.channels) {
        promises.push(
          searchVideos(userId, {
            channelId: channel.youtubeChannelId,
            maxResults: 20,
            pageToken,
          }),
        );
        promiseLabels.push('subscription');
      }
    }

    // Fan out keyword searches
    if (source !== 'subscriptions') {
      for (const kw of profile.keywords) {
        promises.push(
          searchVideos(userId, {
            query: kw.keyword,
            maxResults: 20,
            pageToken,
          }),
        );
        promiseLabels.push('search');
      }
    }

    const results = await Promise.allSettled(promises);

    // Check for quota errors in rejected promises
    for (const result of results) {
      if (result.status === 'rejected' && isQuotaError(result.reason)) {
        res.status(503).json({ error: 'youtube_quota_exceeded' });
        return;
      }
    }

    // Collect videos, deduplicating by videoId (subscription wins)
    const videoMap = new Map<string, Video>();
    for (const result of results) {
      if (result.status === 'fulfilled') {
        for (const video of result.value.videos) {
          const existing = videoMap.get(video.videoId);
          if (!existing || (existing.source === 'search' && video.source === 'subscription')) {
            videoMap.set(video.videoId, video);
          }
        }
      }
    }

    // Sort by publishedAt descending
    const videos = Array.from(videoMap.values()).sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );

    // Pick nextPageToken: first subscription result that has one, else first search result
    let nextPageToken: string | undefined;
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === 'fulfilled' && result.value.nextPageToken) {
        if (promiseLabels[i] === 'subscription') {
          nextPageToken = result.value.nextPageToken;
          break;
        }
        if (!nextPageToken) {
          nextPageToken = result.value.nextPageToken;
        }
      }
    }

    res.json({ videos, nextPageToken });
  } catch (error) {
    next(error);
  }
});

export default router;
