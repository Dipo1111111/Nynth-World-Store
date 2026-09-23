import path from "path"
import { fileURLToPath } from 'url'
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import legacy from "@vitejs/plugin-legacy"
import { defineConfig } from "vite"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    legacy({
      targets: ['defaults', 'not IE 11', 'chrome >= 61', 'safari >= 11'],
      additionalLegacyPolyfills: ['regenerator-runtime/runtime']
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json']
  },
  build: {
    manifest: true, // emit dist/.vite/manifest.json so deploy smoke tests can enumerate every chunk
    cssMinify: 'lightningcss', // Uses lightningcss to transpile modern CSS features
    cssTarget: ['chrome61', 'safari11', 'edge16', 'firefox60'], // Target older browsers for CSS compatibility
    target: ['chrome61', 'safari11', 'edge16', 'firefox60'],
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'charts': ['react-chartjs-2', 'chart.js'],
          'ui-vendor': ['lucide-react', 'react-hot-toast', 'react-helmet-async'],
        }
      }
    }
  }
})