// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://ynkotp-webdev.github.io',
  // GitHub Pages віддає проєкт з підшляху; Cloudflare Workers Builds (WORKERS_CI=1) з кореня.
  base: process.env.WORKERS_CI ? '/' : '/M-beauty-one',
  vite: {
    plugins: [tailwindcss()]
  }
});
