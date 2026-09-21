import { Helmet } from 'react-helmet-async';
import { getSiteUrl, joinUrl } from '../../lib/siteUrl';

export interface SeoProps {
  /** Page-specific title. Appended as "{title} – Focused Tube". Omit for the default site title. */
  title?: string;
  /** Page-specific meta description. Falls back to the generic site description. */
  description?: string;
  /** When true emits noindex,nofollow. Use on every protected route. */
  noindex?: boolean;
  /** Absolute path (e.g. "/login") used to build the canonical URL. Omitted when undefined. */
  canonicalPath?: string;
  /**
   * Absolute URL of the social-sharing image for og:image / twitter:image.
   * Relative paths are resolved against the configured site URL.
   * Defaults to the site logo at /ft-logo.png.
   */
  image?: string;
}

const SITE_NAME = 'Focused Tube';
const DEFAULT_DESCRIPTION =
  'Watch only what matters. Create curated YouTube profiles with keyword filters – no recommendations, no rabbit holes.';
const HTTP_URL_PATTERN = /^https?:\/\//i;

export default function Seo({
  title,
  description,
  noindex = false,
  canonicalPath,
  image,
}: SeoProps) {
  const siteUrl = getSiteUrl();
  const pageTitle = title ? `${title} – ${SITE_NAME}` : SITE_NAME;
  const metaDescription = description ?? DEFAULT_DESCRIPTION;
  const canonicalUrl = canonicalPath != null ? joinUrl(siteUrl, canonicalPath) : undefined;

  const resolvedImage = image != null
    ? (HTTP_URL_PATTERN.test(image) ? image : joinUrl(siteUrl, image))
    : joinUrl(siteUrl, '/ft-logo.png');

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="robots" content={noindex ? 'noindex,nofollow' : 'index,follow'} />
      {canonicalUrl != null && <link rel="canonical" href={canonicalUrl} />}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={metaDescription} />
      {canonicalUrl != null && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:image" content={resolvedImage} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={resolvedImage} />
    </Helmet>
  );
}
