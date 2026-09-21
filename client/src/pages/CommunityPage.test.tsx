import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import CommunityPage from './CommunityPage';

const mockUseCommunity = vi.fn();

vi.mock('../hooks/useCommunity', () => ({
  useCommunity: () => mockUseCommunity(),
}));

vi.mock('../components/ui/AppHeader', () => ({
  default: () => <div>Header</div>,
}));

function renderPage() {
  return render(
    <HelmetProvider>
      <MemoryRouter>
        <CommunityPage />
      </MemoryRouter>
    </HelmetProvider>,
  );
}

describe('CommunityPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseCommunity.mockReturnValue({
      profiles: [
        {
          id: 'profile-own',
          name: 'Deep Work',
          isPublic: true,
          user: { name: 'Casey', avatarUrl: 'https://example.com/avatar.jpg' },
          _count: { followers: 2 },
          isFollowing: false,
          isOwn: true,
        },
      ],
      total: 1,
      page: 1,
      setPage: vi.fn(),
      limit: 12,
      keyword: '',
      setKeyword: vi.fn(),
      isLoading: false,
      error: '',
      handleFollow: vi.fn(),
      handleUnfollow: vi.fn(),
    });
  });

  it('shows Yours in the owner line for the current user profile', () => {
    renderPage();

    expect(screen.getByText('Yours')).toBeInTheDocument();
    expect(screen.queryByText('by Casey')).not.toBeInTheDocument();
  });

  describe('indexability', () => {
    it('renders noindex,nofollow robots meta (protected page)', async () => {
      renderPage();
      await waitFor(() =>
        expect(document.querySelector('meta[name="robots"]')).toHaveAttribute(
          'content',
          'noindex,nofollow',
        ),
      );
    });
  });
});