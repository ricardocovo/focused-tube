import { Link } from 'react-router-dom';
import { useProfiles } from '../context/ProfileContext';
import AppHeader from '../components/ui/AppHeader';
import ProfileSwitcher from '../components/profile/ProfileSwitcher';
import VideoFeed from '../components/feed/VideoFeed';
import './Dashboard.css';

export default function Dashboard() {
  const { activeProfile } = useProfiles();

  return (
    <>
      <AppHeader>
        <ProfileSwitcher />
      </AppHeader>
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
