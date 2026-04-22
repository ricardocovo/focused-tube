import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('LoginPage styles', () => {
  it('uses an AA-compliant muted color for login description text on dark background', () => {
    const loginPageCssPath = resolve(__dirname, './LoginPage.css');
    const loginPageCss = readFileSync(loginPageCssPath, 'utf8');

    expect(loginPageCss).toMatch(/\.login-description\s*\{[\s\S]*?color:\s*#888888;/);
  });
});
