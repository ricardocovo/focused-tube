import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProfiles } from '../context/ProfileContext';
import ProfileSwitcher from '../components/profile/ProfileSwitcher';
import VideoFeed from '../components/feed/VideoFeed';
import SettingsMenu from '../components/ui/SettingsMenu';

export default function Dashboard() {
  const { user } = useAuth();
  const { activeProfile } = useProfiles();

  return (
    <>
      <header className="app-header">
        <h1>Focused <span style={{ color: 'var(--ft-brand)' }}>Tube</span></h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ProfileSwitcher />
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {user.avatarUrl && <img src={user.avatarUrl} alt={user.name} style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid var(--ft-border)' }} />}
            </div>
          )}
          <SettingsMenu />
        </div>
      </header>
      <div className="page-container">

      {activeProfile ? (
        <VideoFeed profileId={activeProfile.id} />
      ) : (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎬</div>
          <p style={{ fontSize: 16, color: 'var(--ft-text-secondary)', marginBottom: 16 }}>
            Select or create a profile to get started.
          </p>
          <Link
            to="/profiles"
            style={{
              display: 'inline-block',
              padding: '10px 24px',
              fontSize: 14,
              fontWeight: 600,
              color: '#fff',
              backgroundColor: 'var(--ft-primary)',
              borderRadius: 999,
              textDecoration: 'none',
              transition: 'background 0.15s',
            }}
          >
            Manage Profiles
          </Link>
        </div>
      )}
      </div>
    </>
  );
}
