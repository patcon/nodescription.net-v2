// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  site: 'https://nodescription.net',
  output: 'static',
  integrations: [react(), tailwind(), mdx()],
  redirects: {
    '/2015/02/17/rules-for-the-future/': '/blog/rules-for-the-future/',
  },
});
