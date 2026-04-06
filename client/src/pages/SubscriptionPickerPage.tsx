import { useState, useMemo, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSubscriptions } from '../hooks/useSubscriptions';
import { useProfiles } from '../context/ProfileContext';
import { addChannel } from '../services/profilesApi';
import { fetchProfile } from '../services/profilesApi';
import SubscriptionChannelRow from '../components/subscriptions/SubscriptionChannelRow';
import SubscriptionItemSkeleton from '../components/subscriptions/SubscriptionItemSkeleton';
import { notify } from '../lib/toast';
import type { Profile } from '../types/profile';

const BLUE = '#11A0D9';
const CORAL = '#F2594B';

export default function SubscriptionPickerPage() {
  const { profileId } = useParams<{ profileId: string }>();
  const navigate = useNavigate();
  const { subscriptions, isLoading, error, refetch } = useSubscriptions();
  const { refreshProfiles } = useProfiles();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [addedChannelIds, setAddedChannelIds] = useState<Set<string>>(new Set());
  const [addingChannelIds, setAddingChannelIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!profileId) return;
    setProfileLoading(true);
    fetchProfile(profileId)
      .then((data) => {
        setProfile(data);
        const existing = new Set(
          (data.channels ?? []).map((ch) => ch.youtubeChannelId),
        );
        setAddedChannelIds(existing);
      })
      .catch(() => {
        setProfile(null);
      })
      .finally(() => setProfileLoading(false));
  }, [profileId]);

  const filtered = useMemo(() => {
    if (!search.trim()) return subscriptions;
    const q = search.toLowerCase();
    return subscriptions.filter((ch) =>
      ch.channelTitle.toLowerCase().includes(q),
    );
  }, [subscriptions, search]);

  const handleAdd = useCallback(
    async (channel: (typeof subscriptions)[number]) => {
      if (!profileId) return;

      // Optimistic update
      setAddingChannelIds((prev) => new Set(prev).add(channel.youtubeChannelId));
      setAddedChannelIds((prev) => new Set(prev).add(channel.youtubeChannelId));

      try {
        await addChannel(profileId, {
          youtubeChannelId: channel.youtubeChannelId,
          channelTitle: channel.channelTitle,
          thumbnailUrl: channel.thumbnailUrl,
        });
        await refreshProfiles();
        notify.success(`Added ${channel.channelTitle}`);
      } catch {
        // Revert on error
        setAddedChannelIds((prev) => {
          const next = new Set(prev);
          next.delete(channel.youtubeChannelId);
          return next;
        });
        notify.error(`Failed to add ${channel.channelTitle}`);
      } finally {
        setAddingChannelIds((prev) => {
          const next = new Set(prev);
          next.delete(channel.youtubeChannelId);
          return next;
        });
      }
    },
    [profileId, refreshProfiles],
  );

  const showLoading = isLoading || profileLoading;

  return (
    <div className="page-container-narrow">
      <button
        onClick={() => navigate(`/profiles/${profileId}/edit`)}
        style={{
          marginBottom: 16,
          padding: '6px 0',
          fontSize: 14,
          color: BLUE,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textDecoration: 'underline',
        }}
      >
        ← Back to Profile
      </button>

      <h1 style={{ color: BLUE, marginBottom: 20 }}>Browse Subscriptions</h1>

      {/* Search input */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search channels…"
        className="subscription-search"
      />

      {/* Error state */}
      {error && !showLoading && (
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <p style={{ color: CORAL, marginBottom: 12 }}>{error}</p>
          <button
            onClick={refetch}
            style={{
              padding: '8px 20px',
              fontSize: 14,
              fontWeight: 600,
              color: '#fff',
              backgroundColor: BLUE,
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading state */}
      {showLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {Array.from({ length: 8 }, (_, i) => (
            <SubscriptionItemSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!showLoading && !error && subscriptions.length === 0 && (
        <p style={{ color: '#888', fontSize: 14, textAlign: 'center', padding: '32px 0' }}>
          No YouTube subscriptions found.
        </p>
      )}

      {/* No search results */}
      {!showLoading && !error && subscriptions.length > 0 && filtered.length === 0 && (
        <p style={{ color: '#888', fontSize: 14, textAlign: 'center', padding: '32px 0' }}>
          No channels match "{search}".
        </p>
      )}

      {/* Channel list */}
      {!showLoading && !error && filtered.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filtered.map((ch) => (
            <SubscriptionChannelRow
              key={ch.youtubeChannelId}
              channel={ch}
              isAdded={addedChannelIds.has(ch.youtubeChannelId)}
              isAdding={addingChannelIds.has(ch.youtubeChannelId)}
              onAdd={() => handleAdd(ch)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
