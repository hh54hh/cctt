import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,woff2}"],
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 1 week
              },
            },
          },
        ],
      },
      includeAssets: ["favicon.ico", "icon-192.png", "icon-512.png"],
      manifest: {
        name: "صالة حسام جم - نظام إدارة شامل",
        short_name: "صالة حسام جم",
        description:
          "نظام إدارة متكامل لصالات الألعاب الرياضية مع دعم العمل بدون إنترنت",
        theme_color: "#1e40af",
        background_color: "#ffffff",
        display: "standalone",
        scope: "/",
        start_url: "/",
        orientation: "portrait-primary",
        dir: "rtl",
        lang: "ar",
        icons: [
          {
            src: "icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "esnext",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks for better caching
          "react-vendor": ["react", "react-dom"],
          "router-vendor": ["react-router-dom"],
          "ui-vendor": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-select",
            "@radix-ui/react-tabs",
            "@radix-ui/react-toast",
          ],
          "supabase-vendor": ["@supabase/supabase-js"],
          "utils-vendor": [
            "date-fns",
            "clsx",
            "tailwind-merge",
            "class-variance-authority",
          ],
          // App chunks
          "pages-auth": ["./src/pages/Login.tsx"],
          "pages-main": [
            "./src/pages/Home.tsx",
            "./src/pages/Subscribers.tsx",
            "./src/pages/AddSubscriber.tsx",
          ],
          "pages-manage": [
            "./src/pages/Courses.tsx",
            "./src/pages/Diet.tsx",
            "./src/pages/Store.tsx",
          ],
          "lib-core": [
            "./src/lib/auth.ts",
            "./src/lib/supabase.ts",
            "./src/lib/utils.ts",
          ],
          "lib-offline": ["./src/lib/sync.ts", "./src/lib/indexeddb.ts"],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@supabase/supabase-js",
      "idb",
      "date-fns",
      "lucide-react",
    ],
  },
  server: {
    port: 5173,
    host: true,
  },
  preview: {
    port: 4173,
    host: true,
  },
});
