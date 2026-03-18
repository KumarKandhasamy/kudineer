import { defineConfig } from 'vite';

export default defineConfig({
  // Set to your GitHub repo name for Pages deployment
  // e.g. if repo is github.com/kumarkandhasamy/neernilai → base: '/neernilai/'
  base: process.env.GITHUB_ACTIONS ? '/neernilai/' : '/',
  server: {
    port: 3000,
    open: true,
    host: true,
  },
  build: {
    outDir: 'dist',
    minify: true,
  },
});
