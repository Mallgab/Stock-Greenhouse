import { defineConfig } from 'vite';

export default defineConfig({
  base: '/Stock-Greenhouse/', // Important for deploying to a subpath like GitHub Pages
  server: {
    hmr: { overlay: false },
  },
});
