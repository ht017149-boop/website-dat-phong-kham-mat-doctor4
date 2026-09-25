import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        about: resolve(__dirname, 'gioi-thieu.html'),
        admin: resolve(__dirname, 'admin/index.html')
      }
    }
  }
});
