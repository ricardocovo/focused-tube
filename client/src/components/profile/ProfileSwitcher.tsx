import { useState, useRef, useEffect } from 'react';
import { useProfiles } from '../../context/ProfileContext';
import { Link } from 'react-router-dom';
import ProfileSwitcherSkeleton from './ProfileSwitcherSkeleton';
import './ProfileSwitcher.css';

export default function ProfileSwitcher() {
  const { profiles, activeProfile, setActiveProfile, isLoading, followedProfiles } = useProfiles();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const hasAnyProfiles = profiles.length > 0 || followedProfiles.length > 0;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isLoading) {
    return <ProfileSwitcherSkeleton />;
  }

  if (!hasAnyProfiles) {
    return (
      <span className="profile-switcher-empty">
        No profiles yet —{' '}
        <Link to="/profiles" className="profile-switcher-empty-link">
          create one!
        </Link>
      </span>
    );
  }

  return (
    <div ref={ref} className="profile-switcher">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen(!open)}
        className="profile-switcher-trigger"
      >
        <span className="profile-switcher-trigger-label">Watching</span>
        <span className="profile-switcher-trigger-value">{activeProfile?.name ?? 'Select profile'}</span>
        <span aria-hidden="true" className="profile-switcher-arrow">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div role="listbox" className="profile-switcher-dropdown">
          {profiles.length > 0 && (
            <div role="group" className="profile-switcher-section">
              <span className="profile-switcher-group-label">Your profiles</span>
              {profiles.map((p) => (
                <button
                  type="button"
                  role="option"
                  aria-selected={p.id === activeProfile?.id}
                  key={p.id}
                  onClick={() => {
                    setActiveProfile(p.id);
                    setOpen(false);
                  }}
                  className={`profile-switcher-option${p.id === activeProfile?.id ? ' profile-switcher-option--active' : ''}`}
                >
                  <span className="profile-switcher-option-name">{p.name}</span>
                  &nbsp;&nbsp;<span className={`profile-switcher-visibility-badge${p.isPublic ? ' profile-switcher-visibility-badge--public' : ''}`}>
                    {p.isPublic ? 'Public' : 'Private'}
                  </span>
                </button>
              ))}
            </div>
          )}

          {followedProfiles.length > 0 && (
            <>
              {profiles.length > 0 && <div className="profile-switcher-divider" role="separator" />}
              <div role="group" aria-label="Community profiles you follow" className="profile-switcher-section">
                <span className="profile-switcher-group-label">Community profiles you follow</span>
                {followedProfiles.map((p) => (
                  <button
                    type="button"
                    role="option"
                    aria-selected={p.id === activeProfile?.id}
                    key={p.id}
                    onClick={() => {
                      setActiveProfile(p.id);
                      setOpen(false);
                    }}
                    className={`profile-switcher-option profile-switcher-option--followed${p.id === activeProfile?.id ? ' profile-switcher-option--active' : ''}`}
                  >
                    <span className="profile-switcher-option-main">
                      <span className="profile-switcher-followed-info">
                        <span className="profile-switcher-followed-name">{p.name}</span>
                        <span className="profile-switcher-followed-owner">by {p.user.name}</span>
                      </span>
                      &nbsp;&nbsp;<span className="profile-switcher-followed-state">Following</span>
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
