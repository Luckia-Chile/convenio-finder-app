import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
    // El cliente de Supabase lanza error si faltan; valores falsos solo para pruebas.
    env: { VITE_SUPABASE_URL: 'http://test.local', VITE_SUPABASE_ANON_KEY: 'test-anon-key' },
  },
});
