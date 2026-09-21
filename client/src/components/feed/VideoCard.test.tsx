import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VideoCard from './VideoCard';
import type { FeedVideo } from '../../types/feed';

const video: FeedVideo = {
  videoId: 'video-1',
  title: 'My Video Title',
  channelId: 'channel-1',
  channelTitle: 'My Channel',
  thumbnailUrl: 'http://example.com/thumb.jpg',
  publishedAt: '2024-01-01T00:00:00Z',
  source: 'subscription',
};

describe('VideoCard', () => {
  it('renders decorative thumbnail and non-heading title text inside button', () => {
    const { container } = render(<VideoCard video={video} />);

    const thumbnail = container.querySelector('.video-card-thumbnail img');
    expect(thumbnail).toHaveAttribute('alt', '');
    expect(screen.queryByRole('heading', { name: video.title })).not.toBeInTheDocument();
    expect(screen.getByText(video.title, { selector: '.video-card-title' })).toBeInTheDocument();
  });

  it('calls onSelect when activated', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();

    render(<VideoCard video={video} onSelect={onSelect} />);

    await user.click(screen.getByRole('button', { name: /My Video Title/i }));

    expect(onSelect).toHaveBeenCalledWith(video);
  });

  it('renders duration badge when duration is present', () => {
    const videoWithDuration: FeedVideo = { ...video, duration: 'PT4M13S' };
    render(<VideoCard video={videoWithDuration} />);

    const badge = screen.getByText('4:13');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('video-card-duration');
    expect(badge).toHaveAttribute('aria-label', 'Duration: 4:13');
  });

  it('renders hours in duration badge when over an hour', () => {
    const videoWithDuration: FeedVideo = { ...video, duration: 'PT1H23M45S' };
    render(<VideoCard video={videoWithDuration} />);

    expect(screen.getByText('1:23:45')).toBeInTheDocument();
  });

  it('does not render duration badge when duration is absent', () => {
    const { container } = render(<VideoCard video={video} />);
    expect(container.querySelector('.video-card-duration')).not.toBeInTheDocument();
  });

  it('renders compact views and likes with exact accessible counts', () => {
    render(<VideoCard video={{
      ...video,
      stats: { viewCount: 12_345, likeCount: 678, dislikeCount: null },
    }} />);

    expect(screen.getByText('12.3K views')).toBeInTheDocument();
    expect(screen.getByText('678 likes')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /12,345 views, 678 likes/i })).toBeInTheDocument();
    expect(screen.getByLabelText('Views: 12,345')).toBeInTheDocument();
    expect(screen.queryByText(/dislikes/i)).not.toBeInTheDocument();
  });

  it('renders dislikes only when a value is available', () => {
    render(<VideoCard video={{
      ...video,
      stats: { viewCount: null, likeCount: null, dislikeCount: 10 },
    }} />);

    expect(screen.getByText('10 dislikes')).toBeInTheDocument();
    expect(screen.queryByText(/0 views/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/0 likes/i)).not.toBeInTheDocument();
  });
});
