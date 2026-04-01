import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    key: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAkD/YXmHQp61wYJRufgVS8ZKkqsjT5lwZvqEm7bEeNCP6hnhRFHc51UWwX6xj1s3F0gqZd05D7EVbb7sHtkRdKc+lsXSgld5jd2MIR2Eo/I+hifmfNMQ0DkRNM9T2XYg3v2yZRHsZ9+Z4kCkiVbIq+DO1jk9VcDG21Yv3gqdpucoNg5n93Ho5LElMExYzuM7ziwfrRqx8qLpYLD9f9fEXa7kM50eDT1FHmDzdyWrlH6V8AD9qff8YcyxID3oPkgpbr4bchfrQ10a+QvAKayZeHAuganZ0xh2y5p71xIGW1OWUwY23wv79QXQk7/QE5lD9KXJZeVm90cWGLrSupqtx+QIDAQAB',
    name: 'bubb',
    description: 'AI learning layer on top of the web',
    permissions: ['identity', 'storage', 'sidePanel', 'activeTab', 'tabs'],
    icons: {
      16: 'icon-16.png',
      32: 'icon-32.png',
      48: 'icon-48.png',
      128: 'icon-128.png',
    },
    action: {
      default_icon: {
        16: 'icon-16.png',
        32: 'icon-32.png',
      },
    },
    oauth2: {
      client_id: '321960645193-7fpeg0lktql87psr3nb70fl8ih9o64aj.apps.googleusercontent.com',
      scopes: ['openid', 'email', 'profile'],
    },
  },
});
