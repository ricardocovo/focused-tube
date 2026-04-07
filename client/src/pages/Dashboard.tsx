import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProfiles } from '../context/ProfileContext';
import ProfileSwitcher from '../components/profile/ProfileSwitcher';
import VideoFeed from '../components/feed/VideoFeed';
import SettingsMenu from '../components/ui/SettingsMenu';
import './Dashboard.css';

export default function Dashboard() {
  const { user } = useAuth();
  const { activeProfile } = useProfiles();

  return (
    <>
      <header className="app-header">
        <h1>Focused <span className="dashboard-brand-accent">Tube</span></h1>
        <div className="dashboard-header-controls">
          <ProfileSwitcher />
          {user && (
            <div className="dashboard-header-user">
              {user.avatarUrl && <img src={user.avatarUrl} alt={user.name} className="dashboard-avatar" />}
            </div>
          )}
          <SettingsMenu />
        </div>
      </header>
      <div className="page-container">

      {activeProfile ? (
        <VideoFeed profileId={activeProfile.id} />
      ) : (
        <div className="dashboard-empty">
          <div className="dashboard-empty-icon">🎬</div>
          <p className="dashboard-empty-text">
            Select or create a profile to get started.
          </p>
          <Link to="/profiles" className="dashboard-empty-cta">
            Manage Profiles
          </Link>
        </div>
      )}
      </div>
    </>
  );
}
