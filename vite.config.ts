import { defineConfig } from "vite";
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
  },
});
