export const PLACEHOLDER_SITE_URL = 'https://focused-tube.example';

export function resolveSiteUrl(value?: string): string {
  const raw = value?.trim();
  if (raw == null || raw === '') {
    return PLACEHOLDER_SITE_URL;
  }

  try {
    const parsed = new URL(raw);
    if (
      (parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
      parsed.hostname.length > 0 &&
      parsed.username === '' &&
      parsed.password === ''
    ) {
      return parsed.origin;
    }
  } catch {
    // Fall through to placeholder.
  }

  return PLACEHOLDER_SITE_URL;
}

export function joinUrl(base: string, path: string): string {
  const normalizedBase = base.replace(/\/+$/, '');
  const normalizedPath = path.replace(/^\/+/, '');
  return normalizedPath === '' ? normalizedBase : `${normalizedBase}/${normalizedPath}`;
}
