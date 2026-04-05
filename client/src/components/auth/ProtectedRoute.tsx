import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{
          width: 40, height: 40,
          border: '4px solid #e0e0e0',
          borderTop: '4px solid #11A0D9',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
