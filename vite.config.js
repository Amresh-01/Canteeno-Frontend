import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Ajay Cafe",
        short_name: "Cafe",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#D96F32",
        start_url: "/",
        icons: [
          {
            src: "/favicon-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/favicon.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],
});
