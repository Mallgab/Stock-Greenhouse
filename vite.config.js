import { defineConfig } from 'vite';

export default defineConfig({
  base: '/Stock-Greenhouse/', // Important for deploying to a subpath like GitHub Pages
  // resolve: {
  //   alias: {
  //     'three': 'three/build/three.module.js',
  //   },
  // }, // Removed alias as it's causing issues with module resolution during build
  build: {
    rollupOptions: {
      output: {
        paths: {
          'three': `${process.env.VITE_BASE || ''}three/build/three.module.js`,
        },
      },
    },
  },
  server: {
    hmr: { overlay: false },
  },
});
