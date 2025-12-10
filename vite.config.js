import { defineConfig } from 'vite';

export default defineConfig({
  base: '/Stock-Greenhouse/', // Important for deploying to a subpath like GitHub Pages
  resolve: {
    alias: {
      'three': 'three/build/three.module.js',
    },
  },
  server: {
    hmr: { overlay: false },
  },
});
