import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0F0F0F' }}>
        <div style={{
          width: 40, height: 40,
          border: '4px solid #333',
          borderTop: '4px solid var(--ft-brand)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    );
  }

  if (user) {
    return <Navigate to={from} replace />;
  }

  return (
    <div className="login-page">
      <div style={{
        textAlign: 'center',
        maxWidth: 560,
        width: '100%',
      }}>
        {/* Brand row: logo + Focused-Tube */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 32 }}>
          <img src="/ft-logo.png" alt="Focused-Tube" style={{ height: 56, background: '#8f8f96', borderRadius: '50%', padding: 6 }} />
          <span style={{
            fontSize: 42,
            fontWeight: 700,
            color: 'var(--ft-brand)',
            letterSpacing: '-0.3px',
          }}>
            Focused-Tube
          </span>
        </div>

        {/* Hero headline */}
        <h1 style={{
          fontSize: 32,
          fontWeight: 800,
          color: '#FFFFFF',
          marginBottom: 12,
          letterSpacing: '-1px',
          lineHeight: 1.15,
        }}>
          Escape the algorithm.
        </h1>

        {/* Sub-headline */}
        <p style={{
          fontSize: 20,
          color: '#AAAAAA',
          marginBottom: 32,
          fontWeight: 400,
        }}>
          Watch only what matters.
        </p>

        {/* Description */}
        <p style={{
          fontSize: 15,
          color: '#717171',
          marginBottom: 48,
          lineHeight: 1.6,
          maxWidth: 460,
          marginLeft: 'auto',
          marginRight: 'auto',
        }}>
          Create curated profiles of your favourite YouTube channels
          with keyword filters. No recommendations. No rabbit holes.
          Just your content.
        </p>

        {/* Google sign-in button */}
        <a
          href="/api/auth/google"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            padding: '14px 48px',
            fontSize: 16,
            fontWeight: 600,
            color: '#3C4043',
            backgroundColor: '#FFFFFF',
            border: 'none',
            borderRadius: 999,
            textDecoration: 'none',
            cursor: 'pointer',
            transition: 'background-color 0.15s, box-shadow 0.15s',
            minWidth: 300,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#F5F5F5';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(255,255,255,0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#FFFFFF';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.003 24.003 0 0 0 0 21.56l7.98-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Sign in with Google
        </a>
      </div>
    </div>
  );
}
