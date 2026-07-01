import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    // Caminhos relativos nos assets (./assets/...) — necessário para hospedagens
    // como InfinityFree, onde o caminho absoluto (/assets/...) resulta em 404 e
    // faz o servidor devolver uma página HTML no lugar do módulo JS.
    base: './',
    server: {
      port: 5173,
      // Opcional: Proxy para evitar CORS em desenvolvimento
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://localhost:8000',
          changeOrigin: true,
          rewrite: (path) => path
        }
      }
    },
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL)
    }
  }
})
