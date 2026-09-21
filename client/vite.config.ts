import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { PLACEHOLDER_SITE_URL, resolveSiteUrl } from './site.config';

const SEO_PUBLIC_FILES = ['robots.txt', 'sitemap.xml'] as const;

/**
 * Escapes a URL for safe insertion into HTML attribute values and XML text.
 * Encodes characters that would break out of a double-quoted attribute.
 */
function escapeUrlForHtml(url: string): string {
  return url
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function siteUrlPlugin(): Plugin {
  let siteUrl = PLACEHOLDER_SITE_URL;

  function replaceSiteUrlPlaceholders(content: string): string {
    const escapedSiteUrl = escapeUrlForHtml(siteUrl);
    return content.replace(/__SITE_URL__/g, () => escapedSiteUrl);
  }

  return {
    name: 'focused-tube:site-url',

    configResolved(config) {
      siteUrl = resolveSiteUrl(config.env.VITE_SITE_URL);
    },

    transformIndexHtml(html) {
      return replaceSiteUrlPlaceholders(html);
    },

    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const name = req.url?.replace(/\?.*$/, '').slice(1);
        if (name === 'robots.txt' || name === 'sitemap.xml') {
          const filePath = resolve(__dirname, `public/${name}`);
          try {
            const raw = readFileSync(filePath, 'utf-8');
            const content = replaceSiteUrlPlaceholders(raw);
            res.setHeader('Content-Type', name.endsWith('.xml') ? 'application/xml' : 'text/plain');
            res.end(content);
            return;
          } catch {
            // Fall through to Vite's static file handler
          }
        }
        next();
      });
    },

    writeBundle({ dir }) {
      if (!dir) return;
      for (const name of SEO_PUBLIC_FILES) {
        const outPath = resolve(dir, name);
        const raw = readFileSync(outPath, 'utf-8');
        writeFileSync(outPath, replaceSiteUrlPlaceholders(raw), 'utf-8');
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), siteUrlPlugin()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
