import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    name: 'bubb',
    description: 'AI learning layer on top of the web',
    permissions: ['identity', 'storage', 'sidePanel', 'activeTab', 'tabs'],
    oauth2: {
      client_id: '321960645193-7fpeg0lktql87psr3nb70fl8ih9o64aj.apps.googleusercontent.com',
      scopes: ['openid', 'email', 'profile'],
    },
  },
});
