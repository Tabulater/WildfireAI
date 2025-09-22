import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import type { UserConfig, PluginOption } from 'vite';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const config: UserConfig = {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      mode === 'development' && componentTagger(),
    ].filter(Boolean) as PluginOption[],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    worker: {
      format: 'es', // Use ES modules for workers
      plugins: () => ([] as PluginOption[]), // Return a function that returns an array
    },
    build: {
      target: 'esnext', // Required for top-level await in workers
      rollupOptions: {
        output: {
          manualChunks: {
            // Split vendor modules into separate chunks
            vendor: ['react', 'react-dom', 'react-router-dom'],
          },
        },
      },
    },
    optimizeDeps: {
      // Add any dependencies that should be pre-bundled
      include: ['react', 'react-dom', 'react-router-dom'],
    },
  };

  return config;
});
