import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import handler from './api/send-email';

function apiDevServerPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'api-dev-server',
    configureServer(server) {
      server.middlewares.use('/api/send-email', (req, res) => {
        let bodyData = '';
        req.on('data', (chunk) => {
          bodyData += chunk;
        });
        req.on('end', async () => {
          try {
            // Apply loaded environment variables for local dev
            Object.assign(process.env, env);

            const parsedBody = bodyData ? JSON.parse(bodyData) : {};
            const simulatedReq = {
              ...req,
              method: req.method,
              body: parsedBody,
            };

            const simulatedRes = {
              setHeader: (name: string, value: string) => {
                res.setHeader(name, value);
              },
              status: (statusCode: number) => ({
                json: (data: any) => {
                  res.statusCode = statusCode;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify(data));
                },
                end: () => {
                  res.statusCode = statusCode;
                  res.end();
                },
              }),
            };

            await handler(simulatedReq, simulatedRes);
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err?.message || 'Dev server API error' }));
          }
        });
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);

  return {
    base: '/',
    plugins: [react(), apiDevServerPlugin(env)],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
  };
});
