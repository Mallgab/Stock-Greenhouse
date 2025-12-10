import { defineConfig } from 'vite';

export default defineConfig({
  base: '/Stock-Greenhouse/', // Important for deploying to a subpath like GitHub Pages
  plugins: [
    {
      name: 'three-module-resolver',
      resolveId(source) {
        if (source === 'three') {
          return 'three/build/three.module.js';
        }
        return null;
      },
    },
  ],
  server: {
    hmr: { overlay: false },
  },
});
