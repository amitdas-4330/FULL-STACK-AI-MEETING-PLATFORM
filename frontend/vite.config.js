import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      buffer: "buffer",
      events: "events",
      process: "process/browser",
    },
  },

  define: {
    global: "globalThis",
  },

  optimizeDeps: {
    include: [
      "buffer",
      "events",
      "process",
      "simple-peer",
    ],
  },
});
