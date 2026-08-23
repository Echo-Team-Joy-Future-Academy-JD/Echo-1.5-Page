import { defineConfig } from "vite";
import { resolve } from "node:path";
import { devPasswordGate } from "./build/dev-password-gate.mjs";

export default defineConfig({
  base: "./",
  plugins: [
    devPasswordGate({
      password: process.env.ECHO15_DEV_PASSWORD || "echo15",
    }),
  ],
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        index: resolve(import.meta.dirname, "index.html"),
        longVideo: resolve(import.meta.dirname, "long-video/index.html"),
        worldModel: resolve(import.meta.dirname, "wm/index.html"),
      },
    },
  },
});
