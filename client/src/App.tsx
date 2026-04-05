import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import ProfilesPage from './pages/ProfilesPage';
import ProfileEditPage from './pages/ProfileEditPage';
import SubscriptionPickerPage from './pages/SubscriptionPickerPage';
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profiles"
        element={
          <ProtectedRoute>
            <ProfilesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profiles/:id/edit"
        element={
          <ProtectedRoute>
            <ProfileEditPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profiles/:profileId/subscriptions"
        element={
          <ProtectedRoute>
            <SubscriptionPickerPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
