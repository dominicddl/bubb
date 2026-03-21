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
    permissions: ['identity', 'storage', 'sidePanel', 'activeTab'],
    oauth2: {
      client_id: 'PLACEHOLDER.apps.googleusercontent.com',
      scopes: ['openid', 'email', 'profile'],
    },
  },
});
