import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        about: resolve(__dirname, 'gioi-thieu.html'),
        login: resolve(__dirname, 'dang-nhap.html'),
        register: resolve(__dirname, 'dang-ky.html'),
        admin: resolve(__dirname, 'admin/index.html')
      }
    }
  }
});
