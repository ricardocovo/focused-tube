export { joinUrl, PLACEHOLDER_SITE_URL } from '../../site.config';
import { resolveSiteUrl } from '../../site.config';

/**
 * Returns the configured VITE_SITE_URL origin.
 * Runtime import.meta.env access is isolated here; pure URL handling lives in site.config.ts.
 */
export function getSiteUrl(): string {
  return resolveSiteUrl(import.meta.env.VITE_SITE_URL);
}
