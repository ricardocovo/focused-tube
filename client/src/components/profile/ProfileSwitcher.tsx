import { useState, useRef, useEffect } from 'react';
import { useProfiles } from '../../context/ProfileContext';
import { Link } from 'react-router-dom';
import ProfileSwitcherSkeleton from './ProfileSwitcherSkeleton';

const BLUE = '#11A0D9';
const MINT = '#80F2DD';

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
      <span style={{ fontSize: 14, color: '#666' }}>
        No profiles yet —{' '}
        <Link to="/profiles" style={{ color: BLUE, textDecoration: 'underline' }}>
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
        <span style={{ fontSize: 10, marginLeft: 4 }}>{open ? '▲' : '▼'}</span>
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
              className="profile-switcher-option"
              style={{
                backgroundColor: p.id === activeProfile?.id ? MINT : '#fff',
                fontWeight: p.id === activeProfile?.id ? 600 : 400,
              }}
              onMouseEnter={(e) => {
                if (p.id !== activeProfile?.id) e.currentTarget.style.backgroundColor = '#f5f5f5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor =
                  p.id === activeProfile?.id ? MINT : '#fff';
              }}
            >
              {p.name}
              {p.isDefault && (
                <span style={{ fontSize: 11, color: '#999', marginLeft: 6 }}>(default)</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
