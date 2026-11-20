import { defineConfig, loadEnv, type Plugin } from 'vite';
import { qrSvg, readableAddress } from './src/qr';

/** Puts the app address and its QR code into each page at build time, the QR label in the page language. */
function appLinks(appUrl: string): Plugin {
  return {
    name: 'app-links',
    transformIndexHtml: (html) => {
      const label = html.includes('<html lang="en">') ? 'QR code' : 'QR-код';
      return html
        .replace('<!--app-qr-->', qrSvg(appUrl, label))
        .replaceAll('%APP_ADDRESS%', readableAddress(appUrl));
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.');
  const appUrl = env.VITE_APP_URL;
  if (!appUrl) throw new Error('VITE_APP_URL is missing in .env');
  return {
    // GitHub Pages serves the landing from /<repo-name>/ (body.log-landing since 2026-11-17).
    base: '/body.log-landing/',
    plugins: [appLinks(appUrl)],
    build: {
      target: 'es2022',
      sourcemap: false,
      // Two pages: Ukrainian at the root, English at /en/ (paths from the project root).
      rollupOptions: {
        input: { uk: 'index.html', en: 'en/index.html' },
      },
    },
    test: {
      environment: 'jsdom',
      include: ['src/**/*.test.ts'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'lcov'],
        include: ['src/**/*.ts'],
        exclude: ['src/**/*.test.ts', 'src/main.ts'],
      },
    },
  };
});
