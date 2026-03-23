import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    sourcemap: false,
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          router: ["react-router-dom"],
          vercel: ["@vercel/analytics/react", "@vercel/speed-insights/react"],
        },
      },
    },
  },
});
