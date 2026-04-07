import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchProfile, addKeyword, removeKeyword, removeChannel } from '../services/profilesApi';
import { useProfiles } from '../context/ProfileContext';
import { notify } from '../lib/toast';
import type { Profile } from '../types/profile';

export default function ProfileEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { updateProfile, refreshProfiles } = useProfiles();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    loadProfile(id);
  }, [id]);

  async function loadProfile(profileId: string) {
    setLoading(true);
    try {
      const data = await fetchProfile(profileId);
      setProfile(data);
      setName(data.name);
    } catch {
      setError('Failed to load profile.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    if (!id || !name.trim()) return;
    setSaving(true);
    setError('');
    try {
      await updateProfile(id, { name: name.trim() });
      await loadProfile(id);
      notify.success('Profile name updated');
    } catch {
      setError('Failed to update name.');
      notify.error('Failed to update name');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddKeyword(e: React.FormEvent) {
    e.preventDefault();
    if (!id || !newKeyword.trim()) return;
    setError('');
    try {
      await addKeyword(id, newKeyword.trim());
      setNewKeyword('');
      await loadProfile(id);
      await refreshProfiles();
      notify.success('Keyword added');
    } catch {
      setError('Failed to add keyword.');
      notify.error('Failed to add keyword');
    }
  }

  async function handleRemoveKeyword(keywordId: string) {
    if (!id) return;
    try {
      await removeKeyword(id, keywordId);
      await loadProfile(id);
      await refreshProfiles();
      notify.success('Keyword removed');
    } catch {
      setError('Failed to remove keyword.');
      notify.error('Failed to remove keyword');
    }
  }

  async function handleRemoveChannel(channelId: string) {
    if (!id) return;
    try {
      await removeChannel(id, channelId);
      await loadProfile(id);
      await refreshProfiles();
      notify.success('Channel removed');
    } catch {
      setError('Failed to remove channel.');
      notify.error('Failed to remove channel');
    }
  }

  if (loading) {
    return <div style={{ padding: 24, color: '#999' }}>Loading…</div>;
  }

  if (!profile) {
    return (
      <div style={{ padding: 24 }}>
        <p style={{ color: 'var(--ft-danger)' }}>{error || 'Profile not found.'}</p>
        <button onClick={() => navigate('/profiles')} style={{ marginTop: 8, color: 'var(--ft-link)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
          Back to profiles
        </button>
      </div>
    );
  }

  return (
    <div className="page-container-narrow">
      <button
        onClick={() => navigate('/profiles')}
        style={{
          marginBottom: 16,
          padding: '6px 0',
          fontSize: 14,
          color: 'var(--ft-link)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textDecoration: 'underline',
        }}
      >
        ← Back to profiles
      </button>

      <h1 style={{ color: 'var(--ft-text)', marginBottom: 20 }}>Edit Profile</h1>

      {error && <p style={{ color: 'var(--ft-danger)', marginBottom: 12 }}>{error}</p>}

      {/* Name section */}
      <form onSubmit={handleSaveName} style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{
            flex: 1,
            padding: '8px 12px',
            fontSize: 14,
            border: '1px solid var(--ft-border)',
            borderRadius: 8,
            outline: 'none',
            fontFamily: 'var(--ft-font)',
          }}
        />
        <button
          type="submit"
          disabled={saving || !name.trim() || name.trim() === profile.name}
          style={{
            padding: '8px 20px',
            fontSize: 14,
            fontWeight: 600,
            color: '#fff',
            backgroundColor: 'var(--ft-primary)',
            border: 'none',
            borderRadius: 999,
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving || !name.trim() || name.trim() === profile.name ? 0.6 : 1,
          }}
        >
          {saving ? 'Saving…' : 'Save Name'}
        </button>
      </form>

      {/* Channels section */}
      <section style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ fontSize: 18, margin: 0 }}>
            Channels ({profile.channels?.length ?? 0})
          </h2>
          <Link
            to={`/profiles/${id}/subscriptions`}
            style={{
              padding: '6px 14px',
              fontSize: 13,
              fontWeight: 600,
              color: '#fff',
              backgroundColor: 'var(--ft-primary)',
              borderRadius: 999,
              textDecoration: 'none',
            }}
          >
            Browse Subscriptions
          </Link>
        </div>
        {!profile.channels || profile.channels.length === 0 ? (
          <p style={{ color: 'var(--ft-text-tertiary)', fontSize: 14 }}>
            No channels yet. Add channels from the subscriptions page.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {profile.channels.map((ch) => (
              <div
                key={ch.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  background: 'var(--ft-surface)',
                  borderRadius: 8,
                  border: '1px solid var(--ft-border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {ch.thumbnailUrl && (
                    <img
                      src={ch.thumbnailUrl}
                      alt=""
                      style={{ width: 28, height: 28, borderRadius: '50%' }}
                    />
                  )}
                  <span style={{ fontSize: 14 }}>{ch.channelTitle}</span>
                </div>
                <button
                  onClick={() => handleRemoveChannel(ch.id)}
                  style={{
                    padding: '4px 12px',
                    fontSize: 12,
                    color: 'var(--ft-danger)',
                    background: 'transparent',
                    border: '1px solid var(--ft-danger)',
                    borderRadius: 999,
                    cursor: 'pointer',
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Keywords section */}
      <section>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>
          Keywords ({profile.keywords?.length ?? 0})
        </h2>

        <form
          onSubmit={handleAddKeyword}
          style={{ display: 'flex', gap: 8, marginBottom: 12 }}
        >
          <input
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            placeholder="Add keyword…"
            style={{
              flex: 1,
              padding: '8px 12px',
              fontSize: 14,
              border: '1px solid var(--ft-border)',
              borderRadius: 8,
              outline: 'none',
              fontFamily: 'var(--ft-font)',
            }}
          />
          <button
            type="submit"
            disabled={!newKeyword.trim()}
            style={{
              padding: '8px 16px',
              fontSize: 14,
              fontWeight: 600,
              color: '#fff',
              backgroundColor: 'var(--ft-primary)',
              border: 'none',
              borderRadius: 999,
              cursor: !newKeyword.trim() ? 'not-allowed' : 'pointer',
              opacity: !newKeyword.trim() ? 0.6 : 1,
            }}
          >
            Add
          </button>
        </form>

        {!profile.keywords || profile.keywords.length === 0 ? (
          <p style={{ color: 'var(--ft-text-tertiary)', fontSize: 14 }}>No keywords yet.</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {profile.keywords.map((kw) => (
              <span key={kw.id} className="keyword-tag">
                {kw.keyword}
                <button
                  onClick={() => handleRemoveKeyword(kw.id)}
                  style={{
                    color: 'var(--ft-danger)',
                    fontWeight: 700,
                    fontSize: 14,
                    lineHeight: 1,
                  }}
                  title="Remove keyword"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
