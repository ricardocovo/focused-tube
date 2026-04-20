import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ProfileSwitcher from './ProfileSwitcher';

const mockUseProfiles = vi.fn();

vi.mock('../../context/ProfileContext', () => ({
  useProfiles: () => mockUseProfiles(),
}));

vi.mock('./ProfileSwitcherSkeleton', () => ({
  default: () => <div>Loading profiles</div>,
}));

function renderSwitcher() {
  return render(
    <MemoryRouter>
      <ProfileSwitcher />
    </MemoryRouter>,
  );
}

describe('ProfileSwitcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseProfiles.mockReturnValue({
      profiles: [],
      activeProfile: {
        id: 'followed-1',
        name: 'News Roundup',
      },
      setActiveProfile: vi.fn(),
      isLoading: false,
      followedProfiles: [
        {
          id: 'followed-1',
          name: 'News Roundup',
          isPublic: true,
          isFollowing: true,
          user: { name: 'Taylor', avatarUrl: null },
          _count: { followers: 3 },
        },
      ],
    });
  });

  it('shows followed profiles when the user has no owned profiles', async () => {
    const user = userEvent.setup();
    const setActiveProfile = vi.fn();

    mockUseProfiles.mockReturnValue({
      profiles: [],
      activeProfile: {
        id: 'followed-1',
        name: 'News Roundup',
      },
      setActiveProfile,
      isLoading: false,
      followedProfiles: [
        {
          id: 'followed-1',
          name: 'News Roundup',
          isPublic: true,
          isFollowing: true,
          user: { name: 'Taylor', avatarUrl: null },
          _count: { followers: 3 },
        },
      ],
    });

    renderSwitcher();

    expect(screen.getByRole('button', { name: /watching\s*news roundup/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /watching\s*news roundup/i }));

    expect(screen.getByText('Community profiles you follow')).toBeInTheDocument();
    expect(screen.getByText('Following')).toBeInTheDocument();
    expect(screen.getByText('by Taylor')).toBeInTheDocument();
    expect(screen.queryByText('👥')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /following\s*news roundup\s*by\s*taylor/i }));

    expect(setActiveProfile).toHaveBeenCalledWith('followed-1');
  });
});