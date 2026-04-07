import { useState, useRef, useEffect } from 'react';
import { useProfiles } from '../../context/ProfileContext';
import { Link } from 'react-router-dom';
import ProfileSwitcherSkeleton from './ProfileSwitcherSkeleton';
import './ProfileSwitcher.css';

export default function ProfileSwitcher() {
  const { profiles, activeProfile, setActiveProfile, isLoading } = useProfiles();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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

  if (profiles.length === 0) {
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
        onClick={() => setOpen(!open)}
        className="profile-switcher-trigger"
      >
        {activeProfile?.name ?? 'Select profile'}
        <span className="profile-switcher-arrow">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="profile-switcher-dropdown">
          {profiles.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setActiveProfile(p.id);
                setOpen(false);
              }}
              className={`profile-switcher-option${p.id === activeProfile?.id ? ' profile-switcher-option--active' : ''}`}
            >
              {p.name}
              {p.isDefault && (
                <span className="profile-switcher-default-label">(default)</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
