import { describe, it, expect, vi, afterEach } from 'vitest';
import { getSiteUrl, joinUrl, PLACEHOLDER_SITE_URL } from './siteUrl';
import { resolveSiteUrl } from '../../site.config';

describe('getSiteUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns the configured VITE_SITE_URL origin', () => {
    vi.stubEnv('VITE_SITE_URL', 'https://example.com');
    expect(getSiteUrl()).toBe('https://example.com');
  });

  it('strips a single trailing slash', () => {
    vi.stubEnv('VITE_SITE_URL', 'https://example.com/');
    expect(getSiteUrl()).toBe('https://example.com');
  });

  it('strips multiple trailing slashes', () => {
    vi.stubEnv('VITE_SITE_URL', 'https://example.com///');
    expect(getSiteUrl()).toBe('https://example.com');
  });

  it('returns the placeholder when VITE_SITE_URL is an empty string', () => {
    vi.stubEnv('VITE_SITE_URL', '');
    expect(getSiteUrl()).toBe(PLACEHOLDER_SITE_URL);
  });

  it('returns the placeholder when VITE_SITE_URL is not set', () => {
    vi.unstubAllEnvs();
    expect(getSiteUrl()).toBe(PLACEHOLDER_SITE_URL);
  });

  it('normalizes a URL with a path segment to its origin', () => {
    vi.stubEnv('VITE_SITE_URL', 'https://example.com/app');
    expect(getSiteUrl()).toBe('https://example.com');
  });

  it('normalizes query and hash to the origin', () => {
    vi.stubEnv('VITE_SITE_URL', 'https://example.com/?utm=1#top');
    expect(getSiteUrl()).toBe('https://example.com');
  });

  it('placeholder is a valid reserved hostname, not a user placeholder string', () => {
    vi.stubEnv('VITE_SITE_URL', '');
    expect(getSiteUrl()).toBe('https://focused-tube.example');
  });

  it('rejects non-http(s) values and returns placeholder', () => {
    vi.stubEnv('VITE_SITE_URL', 'ftp://example.com');
    expect(getSiteUrl()).toBe(PLACEHOLDER_SITE_URL);
  });

  it('rejects malformed http(s) values and returns placeholder', () => {
    vi.stubEnv('VITE_SITE_URL', 'https://exa mple.com');
    expect(getSiteUrl()).toBe(PLACEHOLDER_SITE_URL);
  });

  it('rejects credentials in the configured URL', () => {
    expect(resolveSiteUrl(['https://user', 'example.com'].join('@'))).toBe(PLACEHOLDER_SITE_URL);
  });

  it('preserves http localhost origins', () => {
    expect(resolveSiteUrl('http://localhost:5173/')).toBe('http://localhost:5173');
  });
});

describe('joinUrl', () => {
  it('joins base without trailing slash and path with leading slash', () => {
    expect(joinUrl('https://example.com', '/login')).toBe('https://example.com/login');
  });

  it('strips multiple leading slashes from path', () => {
    expect(joinUrl('https://example.com/', '///login')).toBe('https://example.com/login');
  });

  it('joins base with trailing slash and path with leading slash', () => {
    expect(joinUrl('https://example.com/', '/login')).toBe('https://example.com/login');
  });

  it('joins base with trailing slash and path without leading slash', () => {
    expect(joinUrl('https://example.com/', 'login')).toBe('https://example.com/login');
  });

  it('joins base without trailing slash and path without leading slash', () => {
    expect(joinUrl('https://example.com', 'login')).toBe('https://example.com/login');
  });

  it('strips multiple trailing slashes from base', () => {
    expect(joinUrl('https://example.com///', '/login')).toBe('https://example.com/login');
  });

  it('preserves path segments', () => {
    expect(joinUrl('https://example.com', '/profiles/abc/edit')).toBe(
      'https://example.com/profiles/abc/edit',
    );
  });
});
