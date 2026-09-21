import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import ProtectedRoute from './ProtectedRoute';

const mockUseAuth = vi.fn();
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

function renderWithRouter(ui: React.ReactElement, { route = '/' } = {}) {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path="*" element={ui} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    </HelmetProvider>
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a spinner while loading', () => {
    mockUseAuth.mockReturnValue({ user: null, isLoading: true, logout: vi.fn() });

    const { container } = renderWithRouter(
      <ProtectedRoute><div>Protected Content</div></ProtectedRoute>
    );

    expect(container.querySelector('.protected-route-spinner')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders children when user is authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'a@b.com', name: 'Test', avatarUrl: null },
      isLoading: false,
      logout: vi.fn(),
    });

    renderWithRouter(
      <ProtectedRoute><div>Protected Content</div></ProtectedRoute>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects to /login when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({ user: null, isLoading: false, logout: vi.fn() });

    renderWithRouter(
      <ProtectedRoute><div>Protected Content</div></ProtectedRoute>
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  describe('indexability', () => {
    it('renders noindex,nofollow during loading state (protected route guard)', async () => {
      mockUseAuth.mockReturnValue({ user: null, isLoading: true, logout: vi.fn() });

      renderWithRouter(
        <ProtectedRoute><div>Protected Content</div></ProtectedRoute>
      );

      await waitFor(() =>
        expect(document.querySelector('meta[name="robots"]')).toHaveAttribute(
          'content',
          'noindex,nofollow',
        ),
      );
    });
  });
});
