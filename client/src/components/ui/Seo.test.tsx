import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter, Route, Routes, Link } from 'react-router-dom';
import Seo from './Seo';

function renderSeo(ui: React.ReactElement) {
  return render(<HelmetProvider>{ui}</HelmetProvider>);
}

function loadIndexHead() {
  const indexHtml = readFileSync(join(process.cwd(), 'index.html'), 'utf-8');
  const head = indexHtml.match(/<head>([\s\S]*?)<\/head>/)?.[1];
  if (head == null) {
    throw new Error('Unable to find <head> in client/index.html');
  }
  document.head.innerHTML = head.replace(/__SITE_URL__/g, 'https://example.com');
}

function expectSingle(selector: string): Element {
  const matches = document.querySelectorAll(selector);
  expect(matches).toHaveLength(1);
  return matches[0];
}

describe('Seo component', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    document.title = '';
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('title', () => {
    it('formats the page title as "{title} – Focused Tube"', async () => {
      renderSeo(<Seo title="Sign in" />);
      await waitFor(() => expect(document.title).toBe('Sign in – Focused Tube'));
    });

    it('uses the bare site name when no title is provided', async () => {
      renderSeo(<Seo />);
      await waitFor(() => expect(document.title).toBe('Focused Tube'));
    });

    it('mirrors the page title into og:title', async () => {
      renderSeo(<Seo title="Dashboard" />);
      await waitFor(() =>
        expect(document.querySelector('meta[property="og:title"]')).toHaveAttribute(
          'content',
          'Dashboard – Focused Tube',
        ),
      );
    });

    it('mirrors the page title into twitter:title', async () => {
      renderSeo(<Seo title="Profiles" />);
      await waitFor(() =>
        expect(document.querySelector('meta[name="twitter:title"]')).toHaveAttribute(
          'content',
          'Profiles – Focused Tube',
        ),
      );
    });
  });

  describe('robots meta', () => {
    it('renders index,follow when noindex is false (default)', async () => {
      renderSeo(<Seo />);
      await waitFor(() =>
        expect(document.querySelector('meta[name="robots"]')).toHaveAttribute(
          'content',
          'index,follow',
        ),
      );
    });

    it('renders noindex,nofollow when noindex is true', async () => {
      renderSeo(<Seo noindex />);
      await waitFor(() =>
        expect(document.querySelector('meta[name="robots"]')).toHaveAttribute(
          'content',
          'noindex,nofollow',
        ),
      );
    });

    it('emits exactly one robots meta tag', async () => {
      renderSeo(<Seo noindex />);
      await waitFor(() =>
        expect(document.querySelectorAll('meta[name="robots"]')).toHaveLength(1),
      );
    });
  });

  describe('canonical', () => {
    it('renders a canonical link when canonicalPath is provided', async () => {
      vi.stubEnv('VITE_SITE_URL', 'https://example.com');
      renderSeo(<Seo canonicalPath="/login" />);
      await waitFor(() => {
        const canonical = document.querySelector('link[rel="canonical"]');
        expect(canonical).not.toBeNull();
        expect(canonical?.getAttribute('href')).toBe('https://example.com/login');
      });
    });

    it('does not render a canonical link when canonicalPath is omitted', async () => {
      renderSeo(<Seo />);
      await waitFor(() =>
        expect(document.querySelector('link[rel="canonical"]')).toBeNull(),
      );
    });

    it('emits exactly one canonical link when canonicalPath is given', async () => {
      renderSeo(<Seo canonicalPath="/login" />);
      await waitFor(() =>
        expect(document.querySelectorAll('link[rel="canonical"]')).toHaveLength(1),
      );
    });

    it('uses the placeholder site URL when VITE_SITE_URL is absent', async () => {
      vi.stubEnv('VITE_SITE_URL', '');
      renderSeo(<Seo canonicalPath="/login" />);
      await waitFor(() => {
        const canonical = document.querySelector('link[rel="canonical"]');
        expect(canonical?.getAttribute('href')).toContain('focused-tube.example');
        expect(canonical?.getAttribute('href')).toContain('/login');
      });
    });
  });

  describe('description', () => {
    it('uses a custom description when provided', async () => {
      renderSeo(<Seo description="Custom description" />);
      await waitFor(() =>
        expect(document.querySelector('meta[name="description"]')).toHaveAttribute(
          'content',
          'Custom description',
        ),
      );
    });

    it('uses the default description when none is provided', async () => {
      renderSeo(<Seo />);
      await waitFor(() => {
        const desc = document.querySelector('meta[name="description"]')?.getAttribute('content');
        expect(desc).toBeTruthy();
        expect(desc).not.toBe('');
      });
    });
  });

  describe('og:site_name', () => {
    it('renders og:site_name as "Focused Tube"', async () => {
      renderSeo(<Seo />);
      await waitFor(() =>
        expect(document.querySelector('meta[property="og:site_name"]')).toHaveAttribute(
          'content',
          'Focused Tube',
        ),
      );
    });
  });

  describe('navigation between pages', () => {
    it('switches from index,follow to noindex,nofollow when navigating to a protected page', async () => {
      const user = userEvent.setup();

      function App() {
        return (
          <MemoryRouter initialEntries={['/login']}>
            <Routes>
              <Route
                path="/login"
                element={
                  <>
                    <Seo title="Sign in" canonicalPath="/login" />
                    <Link to="/dashboard">Go to dashboard</Link>
                  </>
                }
              />
              <Route
                path="/dashboard"
                element={<Seo title="Dashboard" noindex />}
              />
            </Routes>
          </MemoryRouter>
        );
      }

      const { getByText } = renderSeo(<App />);

      await waitFor(() =>
        expect(document.querySelector('meta[name="robots"]')).toHaveAttribute(
          'content',
          'index,follow',
        ),
      );

      await user.click(getByText('Go to dashboard'));

      await waitFor(() =>
        expect(document.querySelector('meta[name="robots"]')).toHaveAttribute(
          'content',
          'noindex,nofollow',
        ),
      );
    });

    it('updates the document title when navigating between pages', async () => {
      const user = userEvent.setup();

      function App() {
        return (
          <MemoryRouter initialEntries={['/login']}>
            <Routes>
              <Route
                path="/login"
                element={
                  <>
                    <Seo title="Sign in" />
                    <Link to="/profiles">Go to profiles</Link>
                  </>
                }
              />
              <Route
                path="/profiles"
                element={<Seo title="Profiles" noindex />}
              />
            </Routes>
          </MemoryRouter>
        );
      }

      const { getByText } = renderSeo(<App />);
      await waitFor(() => expect(document.title).toBe('Sign in – Focused Tube'));

      await user.click(getByText('Go to profiles'));
      await waitFor(() => expect(document.title).toBe('Profiles – Focused Tube'));
    });

    it('emits exactly one robots meta tag after navigation', async () => {
      const user = userEvent.setup();

      function App() {
        return (
          <MemoryRouter initialEntries={['/login']}>
            <Routes>
              <Route
                path="/login"
                element={
                  <>
                    <Seo title="Sign in" />
                    <Link to="/dashboard">Go</Link>
                  </>
                }
              />
              <Route path="/dashboard" element={<Seo title="Dashboard" noindex />} />
            </Routes>
          </MemoryRouter>
        );
      }

      const { getByText } = renderSeo(<App />);
      await user.click(getByText('Go'));
      await waitFor(() =>
        expect(document.querySelectorAll('meta[name="robots"]')).toHaveLength(1),
      );
    });

    it('adopts real index.html baseline tags across public-private-public navigation', async () => {
      vi.stubEnv('VITE_SITE_URL', 'https://example.com/');
      loadIndexHead();
      const user = userEvent.setup();

      function App() {
        return (
          <MemoryRouter initialEntries={['/login']}>
            <Routes>
              <Route
                path="/login"
                element={
                  <>
                    <Seo
                      title="Sign in"
                      description="Public login description"
                      canonicalPath="/login"
                    />
                    <Link to="/dashboard">Go private</Link>
                  </>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <>
                    <Seo
                      title="Dashboard"
                      description="Private dashboard description"
                      noindex
                      canonicalPath="/dashboard"
                      image="/private-og.png"
                    />
                    <Link to="/login">Go public</Link>
                  </>
                }
              />
            </Routes>
          </MemoryRouter>
        );
      }

      const { getByText } = renderSeo(<App />);

      await waitFor(() => {
        expect(expectSingle('meta[name="description"]')).toHaveAttribute(
          'content',
          'Public login description',
        );
        expect(expectSingle('link[rel="canonical"]')).toHaveAttribute(
          'href',
          'https://example.com/login',
        );
        expect(expectSingle('meta[property="og:image"]')).toHaveAttribute(
          'content',
          'https://example.com/ft-logo.png',
        );
        expect(expectSingle('meta[name="robots"]')).toHaveAttribute('content', 'index,follow');
      });

      await user.click(getByText('Go private'));

      await waitFor(() => {
        expect(expectSingle('meta[name="description"]')).toHaveAttribute(
          'content',
          'Private dashboard description',
        );
        expect(expectSingle('link[rel="canonical"]')).toHaveAttribute(
          'href',
          'https://example.com/dashboard',
        );
        expect(expectSingle('meta[property="og:image"]')).toHaveAttribute(
          'content',
          'https://example.com/private-og.png',
        );
        expect(expectSingle('meta[name="robots"]')).toHaveAttribute(
          'content',
          'noindex,nofollow',
        );
      });

      await user.click(getByText('Go public'));

      await waitFor(() => {
        expect(expectSingle('meta[name="description"]')).toHaveAttribute(
          'content',
          'Public login description',
        );
        expect(expectSingle('link[rel="canonical"]')).toHaveAttribute(
          'href',
          'https://example.com/login',
        );
        expect(expectSingle('meta[property="og:image"]')).toHaveAttribute(
          'content',
          'https://example.com/ft-logo.png',
        );
        expect(expectSingle('meta[name="robots"]')).toHaveAttribute('content', 'index,follow');
      });
    });
  });

  describe('image / social', () => {
    it('renders og:image and twitter:image when image is provided', async () => {
      renderSeo(<Seo image="https://example.com/og.png" />);
      await waitFor(() => {
        expect(document.querySelector('meta[property="og:image"]')).toHaveAttribute(
          'content',
          'https://example.com/og.png',
        );
        expect(document.querySelector('meta[name="twitter:image"]')).toHaveAttribute(
          'content',
          'https://example.com/og.png',
        );
      });
    });

    it('renders a default og:image when no image is provided', async () => {
      vi.stubEnv('VITE_SITE_URL', 'https://example.com');
      renderSeo(<Seo />);
      await waitFor(() => {
        expect(document.querySelector('meta[property="og:image"]')).toHaveAttribute(
          'content',
          'https://example.com/ft-logo.png',
        );
      });
    });

    it('renders twitter:card as summary_large_image', async () => {
      renderSeo(<Seo />);
      await waitFor(() =>
        expect(document.querySelector('meta[name="twitter:card"]')).toHaveAttribute(
          'content',
          'summary_large_image',
        ),
      );
    });

    it('renders og:type as website', async () => {
      renderSeo(<Seo />);
      await waitFor(() =>
        expect(document.querySelector('meta[property="og:type"]')).toHaveAttribute(
          'content',
          'website',
        ),
      );
    });

    it('resolves a relative image path against the site URL', async () => {
      vi.stubEnv('VITE_SITE_URL', 'https://example.com');
      renderSeo(<Seo image="/custom-og.png" />);
      await waitFor(() =>
        expect(document.querySelector('meta[property="og:image"]')).toHaveAttribute(
          'content',
          'https://example.com/custom-og.png',
        ),
      );
    });
  });
});
