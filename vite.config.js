import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const chatTarget = env.VITE_CHAT_BASE || 'https://canteen-recommendation-system.onrender.com';

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api/chat': {
          target: chatTarget,
          changeOrigin: true,
          // Map /api/chat/... -> /chat/...
          rewrite: (path) => path.replace(/^\/api\/chat/, '/chat'),
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('proxy error', err);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('Sending Request to the Target:', req.method, req.url);
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
            });
          },
        },
        '/api/recommend': {
          target: 'https://api-general-latest.onrender.com',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => {
            return path.replace(/^\/api\/recommend/, '/recommend');
          },
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('Recommendation API proxy error', err);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('Sending Recommendation API Request:', req.method, req.url);
              console.log('Rewritten path:', proxyReq.path);
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log('Received Response from Recommendation API:', proxyRes.statusCode, req.url);
            });
          }
        },
        '/api': {
          target: 'https://ajay-cafe-1.onrender.com',
          changeOrigin: true,
          secure: true,
          configure: (proxy, _options) => {
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('Sending Canteen API Request:', req.method, req.url);
            });
          }
        }
      },
    },
  }
})