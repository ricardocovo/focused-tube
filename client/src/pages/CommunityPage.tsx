import AppHeader from '../components/ui/AppHeader';
import { useCommunity } from '../hooks/useCommunity';
import './CommunityPage.css';

export default function CommunityPage() {
  const {
    profiles,
    total,
    page,
    setPage,
    limit,
    keyword,
    setKeyword,
    isLoading,
    error,
    handleFollow,
    handleUnfollow,
  } = useCommunity();

  return (
    <>
      <AppHeader>
        <nav className="app-header-breadcrumb" aria-label="Breadcrumb">
          <ol>
            <li><span aria-current="page">Community</span></li>
          </ol>
        </nav>
      </AppHeader>
      <main className="page-container">
        <div className="community-header">
          <h1 className="community-title">Community Profiles</h1>
        </div>

        <div className="community-search">
          <label htmlFor="community-search-input" className="community-search-label">
            Search by keyword
          </label>
          <input
            id="community-search-input"
            type="search"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Search profiles by keyword..."
            className="community-search-input"
          />
        </div>

        {isLoading ? (
          <p className="community-loading">Loading profiles…</p>
        ) : error ? (
          <p className="community-error">{error}</p>
        ) : profiles.length === 0 ? (
          <div className="community-empty">
            <p>No public profiles found{keyword ? ` matching "${keyword}"` : ''}.</p>
          </div>
        ) : (
          <>
            <div className="community-grid">
              {profiles.map((profile) => (
                <div key={profile.id} className="community-card">
                  <div className="community-card-info">
                    <span className="community-card-name">{profile.name}</span>
                    <span className="community-card-owner">by {profile.user.name}</span>
                    <span className="community-card-followers">
                      {profile._count.followers} {profile._count.followers === 1 ? 'follower' : 'followers'}
                    </span>
                  </div>
                  <button
                    onClick={() => profile.isFollowing
                      ? handleUnfollow(profile.id)
                      : handleFollow(profile.id)
                    }
                    className={profile.isFollowing ? 'community-card-btn community-card-btn--following' : 'community-card-btn'}
                    aria-label={`${profile.isFollowing ? 'Unfollow' : 'Follow'} ${profile.name}`}
                  >
                    {profile.isFollowing ? 'Unfollow' : 'Follow'}
                  </button>
                </div>
              ))}
            </div>

            {total > limit && (
              <nav className="community-pagination" aria-label="Pagination">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                  className="community-pagination-btn"
                >
                  Previous
                </button>
                <span className="community-pagination-info">
                  Page {page} of {Math.ceil(total / limit)}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= Math.ceil(total / limit)}
                  className="community-pagination-btn"
                >
                  Next
                </button>
              </nav>
            )}
          </>
        )}
      </main>
    </>
  );
}
