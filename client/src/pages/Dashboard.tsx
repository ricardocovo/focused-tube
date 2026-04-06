import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProfiles } from '../context/ProfileContext';
import ProfileSwitcher from '../components/profile/ProfileSwitcher';
import VideoFeed from '../components/feed/VideoFeed';

const BLUE = '#11A0D9';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { activeProfile } = useProfiles();

  return (
    <div className="page-container">
      <header className="app-header">
        <h1 style={{ color: BLUE }}>Focused Tube</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <ProfileSwitcher />
          {user && (
            <>
              <span>{user.name}</span>
              {user.avatarUrl && <img src={user.avatarUrl} alt={user.name} style={{ width: 32, height: 32, borderRadius: '50%' }} />}
            </>
          )}
          <button onClick={logout} style={{ padding: '8px 16px', cursor: 'pointer' }}>Logout</button>
        </div>
      </header>

      {activeProfile ? (
        <VideoFeed profileId={activeProfile.id} />
      ) : (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎬</div>
          <p style={{ fontSize: 16, color: '#666', marginBottom: 16 }}>
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
              backgroundColor: BLUE,
              borderRadius: 6,
              textDecoration: 'none',
            }}
          >
            Manage Profiles
          </Link>
        </div>
      )}
    </div>
  );
}
