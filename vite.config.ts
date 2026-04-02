import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'

const parseList = (value: string | undefined) => {
  if (!value) {
    return undefined;
  }
  const items = value
    .split(',')
    .map((item: string) => item.trim())
    .filter(Boolean);
  return items.length ? items : undefined;
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const devPort = Number(env.VITE_DEV_SERVER_PORT || 5173);
  const allowedHosts = parseList(env.VITE_DEV_ALLOWED_HOSTS);
  const apiTarget = env.VITE_API_PROXY_TARGET;

  return {
    base: './',
    plugins: [inspectAttr(), react()],
    server: {
      port: Number.isFinite(devPort) ? devPort : 5173,
      ...(allowedHosts ? { allowedHosts } : {}),
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
