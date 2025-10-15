import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/wordcombinationgame/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  }
});
