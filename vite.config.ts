import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Loaded with an empty prefix so proxy-only variables (which must never reach
  // the browser bundle) can be read here without being exposed as VITE_*.
  const env = loadEnv(mode, process.cwd(), '')

  // The Go API in docker-compose publishes 8081 on the host; 8080 is the
  // in-container port. Override with API_PROXY_TARGET when running the API
  // directly with `go run ./cmd/api` on a different port.
  const apiTarget = env.API_PROXY_TARGET || 'http://localhost:8081'

  return {
    plugins: [
      react(),
      babel({ presets: [reactCompilerPreset()] }),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5173,
      // Same-origin in dev, which keeps CORS out of the picture and lets the
      // SSE answer stream pass through untouched.
      proxy: {
        '/api': { target: apiTarget, changeOrigin: true },
        // Both, because the API serves the health handler on each: /readyz is
        // what the app calls (Google Front End swallows /healthz on run.app),
        // and /healthz stays proxied so curling it by hand still works in dev.
        '/healthz': { target: apiTarget, changeOrigin: true },
        '/readyz': { target: apiTarget, changeOrigin: true },
      },
    },
    build: {
      sourcemap: mode !== 'production',
    },
  }
})
