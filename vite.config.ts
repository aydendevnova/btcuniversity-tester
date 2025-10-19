import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/main.ts"),
      name: "BtcUniversity",
      fileName: "btc-university",
      formats: ["iife"],
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {},
        inlineDynamicImports: true,
      },
    },
    sourcemap: true,
    outDir: "dist",
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    cors: true,
  },
});
