import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const isDev = mode === "development";
  const proxyTarget = env.VITE_API_PROXY_TARGET || "http://127.0.0.1:9000";

  return {
    plugins: [react(), cloudflare()],
    build: {
      outDir: "dist",
      sourcemap: false,  // don't expose source code in prod
      minify: "esbuild",
    },
    server: isDev
      ? {
          proxy: {
            "/api": {
              target: proxyTarget,
              changeOrigin: true,
            },
          },
        }
      : {},
  };
});