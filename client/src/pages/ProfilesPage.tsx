import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfiles } from '../context/ProfileContext';
import AppHeader from '../components/ui/AppHeader';
import './ProfilesPage.css';

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
    <>
      <AppHeader>
        <nav className="app-header-breadcrumb" aria-label="Breadcrumb">
          <ol>
            <li><span aria-current="page">Profiles</span></li>
          </ol>
        </nav>
      </AppHeader>
      <div className="page-container-narrow">
        <div className="profiles-header">
          <h1 className="profiles-title">Profiles</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="profiles-new-btn"
          >
            {showForm ? 'Cancel' : '+ New Profile'}
          </button>
        </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="profiles-create-form"
        >
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Profile name"
            autoFocus
            className="profiles-create-input"
          />
          <button
            type="submit"
            disabled={creating || !newName.trim()}
            className="profiles-create-btn"
          >
            {creating ? 'Creating…' : 'Create'}
          </button>
        </form>
      )}

      {error && <p className="profiles-error">{error}</p>}

      {isLoading ? (
        <p className="profiles-loading">Loading profiles…</p>
      ) : profiles.length === 0 ? (
        <p className="profiles-empty">No profiles yet. Create your first one above!</p>
      ) : (
        <div className="profiles-list">
          {profiles.map((p) => (
            <div key={p.id} className="profiles-item">
              <div>
                <span className="profiles-item-name">{p.name}</span>
                {p.isDefault && (
                  <span className="profiles-item-default">
                    Default
                  </span>
                )}
                <div className="profiles-item-meta">
                  {p._count?.channels ?? 0} channels · {p._count?.keywords ?? 0} keywords
                </div>
              </div>
              <div className="profiles-item-actions">
                <button
                  onClick={() => navigate(`/profiles/${p.id}/edit`)}
                  className="profiles-edit-btn"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(p.id, p.name)}
                  className="profiles-delete-btn"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </>
  );
}
