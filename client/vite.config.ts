// client/vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  root: ".", // 👈 now it's already in client/
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"), // 👈 fix path
      "@shared": path.resolve(__dirname, "../shared"), // 👈 go up 1 level
      "@assets": path.resolve(__dirname, "../attached_assets"), // 👈 go up 1 level
    },
  },
  build: {
    outDir: path.resolve(__dirname, "../dist/public"), // 👈 output outside client
    emptyOutDir: true,
  },
});
