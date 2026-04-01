import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, "../.."), "");
  const apiTarget = env.VITE_DEV_API_PROXY ?? "http://127.0.0.1:3000";

  return {
    plugins: [react()],
    resolve: {
      alias: { "@": path.resolve(__dirname, "src") },
    },
    server: {
      port: 5173,
      proxy: {
        "/health": { target: apiTarget, changeOrigin: true },
        "/api": { target: apiTarget, changeOrigin: true },
        "/v1": { target: apiTarget, changeOrigin: true },
      },
    },
  };
});
