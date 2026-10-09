import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        about: resolve(__dirname, 'gioi-thieu.html'),
        lookup: resolve(__dirname, 'lich-kham.html'),
        doctor: resolve(__dirname, 'bac-si.html'),
        login: resolve(__dirname, 'dang-nhap.html'),
        register: resolve(__dirname, 'dang-ky.html'),

        payment: resolve(__dirname, 'payment.html'),
        adminPayment: resolve(__dirname, 'admin-payment.html'),

        profile: resolve(__dirname, 'ho-so.html'),

        admin: resolve(__dirname, 'admin/index.html')
      }
    }
  }
});
