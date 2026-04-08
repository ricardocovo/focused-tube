import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useProfiles } from '../context/ProfileContext';
import AppHeader from '../components/ui/AppHeader';
import ProfileSwitcher from '../components/profile/ProfileSwitcher';
import VideoFeed from '../components/feed/VideoFeed';
import VideoPlayer from '../components/feed/VideoPlayer';
import type { FeedVideo } from '../types/feed';
import './Dashboard.css';

export default function Dashboard() {
  const { activeProfile } = useProfiles();
  const [selectedVideo, setSelectedVideo] = useState<FeedVideo | null>(null);
  const lastFocusRef = useRef<HTMLElement | null>(null);

  const handleVideoSelect = useCallback((video: FeedVideo) => {
    lastFocusRef.current = document.activeElement as HTMLElement;
    setSelectedVideo(video);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedVideo(null);
    // Use requestAnimationFrame to ensure DOM has updated before restoring focus
    requestAnimationFrame(() => {
      lastFocusRef.current?.focus();
    });
  }, []);

  return (
    <>
      <AppHeader>
        <ProfileSwitcher />
      </AppHeader>
      {selectedVideo && (
        <VideoPlayer video={selectedVideo} onClose={handleClose} />
      )}
      <div className="page-container">

      {activeProfile ? (
        <VideoFeed profileId={activeProfile.id} onVideoSelect={handleVideoSelect} />
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
