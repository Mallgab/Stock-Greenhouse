import { defineConfig } from 'vite';

export default defineConfig({
  base: '/Stock-Greenhouse/', // Important for deploying to a subpath like GitHub Pages
  build: {
    commonjsOptions: {
      include: [/node_modules/three/],
    },
  },
  server: {
    hmr: { overlay: false },
  },
});
