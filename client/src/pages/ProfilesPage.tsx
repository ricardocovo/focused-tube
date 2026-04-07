import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useProfiles } from '../context/ProfileContext';

export default function ProfilesPage() {
  const { profiles, isLoading, createProfile, deleteProfile } = useProfiles();
  const navigate = useNavigate();

  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;
    setCreating(true);
    setError('');
    try {
      await createProfile(trimmed);
      setNewName('');
      setShowForm(false);
    } catch {
      setError('Failed to create profile.');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Delete profile "${name}"? This cannot be undone.`)) return;
    try {
      await deleteProfile(id);
    } catch {
      alert('Failed to delete profile.');
    }
  }

  return (
    <div className="page-container-narrow">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ color: 'var(--ft-text)', margin: 0 }}>Profiles</h1>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link
            to="/"
            style={{
              padding: '8px 16px',
              fontSize: 14,
              color: 'var(--ft-text-secondary)',
              textDecoration: 'none',
              border: '1px solid var(--ft-border)',
              borderRadius: 999,
              background: 'var(--ft-surface)',
              transition: 'background 0.15s',
            }}
          >
            ← Dashboard
          </Link>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              padding: '8px 16px',
              fontSize: 14,
              fontWeight: 600,
              color: '#fff',
              backgroundColor: 'var(--ft-primary)',
              border: 'none',
              borderRadius: 999,
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
          >
            {showForm ? 'Cancel' : '+ New Profile'}
          </button>
        </div>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          style={{
            display: 'flex',
            gap: 8,
            marginBottom: 20,
            padding: 16,
            background: 'var(--ft-surface)',
            borderRadius: 12,
            border: '1px solid var(--ft-border)',
          }}
        >
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Profile name"
            autoFocus
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
            disabled={creating || !newName.trim()}
            style={{
              padding: '8px 20px',
              fontSize: 14,
              fontWeight: 600,
              color: '#fff',
              backgroundColor: 'var(--ft-primary)',
              border: 'none',
              borderRadius: 999,
              cursor: creating ? 'not-allowed' : 'pointer',
              opacity: creating || !newName.trim() ? 0.6 : 1,
            }}
          >
            {creating ? 'Creating…' : 'Create'}
          </button>
        </form>
      )}

      {error && <p style={{ color: 'var(--ft-danger)', marginBottom: 12 }}>{error}</p>}

      {isLoading ? (
        <p style={{ color: 'var(--ft-text-tertiary)' }}>Loading profiles…</p>
      ) : profiles.length === 0 ? (
        <p style={{ color: 'var(--ft-text-secondary)' }}>No profiles yet. Create your first one above!</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {profiles.map((p) => (
            <div
              key={p.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 16px',
                background: 'var(--ft-surface)',
                border: '1px solid var(--ft-border)',
                borderRadius: 12,
              }}
            >
              <div>
                <span style={{ fontWeight: 600, fontSize: 15 }}>{p.name}</span>
                {p.isDefault && (
                  <span
                    style={{
                      marginLeft: 8,
                      fontSize: 11,
                      padding: '2px 8px',
                      background: 'var(--ft-success-bg)',
                      borderRadius: 10,
                      color: 'var(--ft-success)',
                      fontWeight: 600,
                    }}
                  >
                    Default
                  </span>
                )}
                <div style={{ fontSize: 13, color: 'var(--ft-text-tertiary)', marginTop: 4 }}>
                  {p._count?.channels ?? 0} channels · {p._count?.keywords ?? 0} keywords
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => navigate(`/profiles/${p.id}/edit`)}
                  style={{
                    padding: '6px 14px',
                    fontSize: 13,
                    color: 'var(--ft-link)',
                    background: 'transparent',
                    border: '1px solid var(--ft-border)',
                    borderRadius: 999,
                    cursor: 'pointer',
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(p.id, p.name)}
                  style={{
                    padding: '6px 14px',
                    fontSize: 13,
                    color: 'var(--ft-danger)',
                    background: 'transparent',
                    border: '1px solid var(--ft-danger)',
                    borderRadius: 999,
                    cursor: 'pointer',
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
