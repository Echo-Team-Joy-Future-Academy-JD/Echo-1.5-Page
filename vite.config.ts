import { defineConfig } from "vite";
import { cpSync } from "node:fs";
import { resolve } from "node:path";
import { devPasswordGate } from "./build/dev-password-gate.mjs";

const copyDocuments = () => ({
  name: "copy-documents",
  closeBundle() {
    cpSync(resolve(import.meta.dirname, "Doc"), resolve(import.meta.dirname, "dist/Doc"), {
      recursive: true,
    });
  },
});

export default defineConfig({
  base: "./",
  plugins: [
    devPasswordGate({
      password: process.env.ECHO15_DEV_PASSWORD || "echo15",
    }),
    copyDocuments(),
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
