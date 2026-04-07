import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import SettingsMenu from './SettingsMenu';
import './AppHeader.css';

interface AppHeaderProps {
  children?: ReactNode;
}

export default function AppHeader({ children }: AppHeaderProps) {
  const { user } = useAuth();

  return (
    <header className="app-header">
      <Link to="/" className="app-header-brand">
        Focused <span className="app-header-brand-accent">Tube</span>
      </Link>
      <div className="app-header-center">
        {children}
      </div>
      <div className="app-header-controls">
        {user?.avatarUrl && (
          <img src={user.avatarUrl} alt={user.name} className="app-header-avatar" />
        )}
        <SettingsMenu />
      </div>
    </header>
  );
}
