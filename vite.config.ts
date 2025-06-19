import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "/",
  server: {
    host: "0.0.0.0",
    port: 8080,
    hmr: {
      port: 8080,
      host: "localhost",
      clientPort: 8080,
    },
    watch: {
      usePolling: true,
      interval: 1000,
    },
    cors: true,
    strictPort: false,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "favicon.svg",
        "icon-192.png",
        "icon-512.png",
        "robots.txt",
      ],
      manifest: {
        name: "صالة حسام لكمال الأجسام",
        short_name: "صالة حسام جم",
        description:
          "نظام إدارة صالة حسام لكمال الأجسام والرشاقة - يعمل بدون إنترنت",
        theme_color: "#f97316",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        lang: "ar-IQ",
        dir: "rtl",
        icons: [
          {
            src: "favicon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
          {
            src: "icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
        categories: ["business", "health", "fitness"],
        shortcuts: [
          {
            name: "المشتركين",
            short_name: "المشتركين",
            description: "عرض قائمة المشتركين",
            url: "/dashboard/subscribers",
            icons: [{ src: "favicon.svg", sizes: "96x96" }],
          },
          {
            name: "إضافة مشترك",
            short_name: "إضافة",
            description: "إضافة مشترك جديد",
            url: "/dashboard/add-subscriber",
            icons: [{ src: "favicon.svg", sizes: "96x96" }],
          },
          {
            name: "المخزون",
            short_name: "المخزون",
            description: "إدارة المخزون والمبيعات",
            url: "/dashboard/inventory",
            icons: [{ src: "favicon.svg", sizes: "96x96" }],
          },
        ],
        prefer_related_applications: false,
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,woff2}"],
        maximumFileSizeToCacheInBytes: 5000000,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-api-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 365 days
              },
            },
          },
          {
            urlPattern: /^https:\/\/cdn\.builder\.io\/.*/,
            handler: "CacheFirst",
            options: {
              cacheName: "builder-io-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: false, // Disable in dev to avoid WebSocket conflicts
        type: "module",
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          router: ["react-router-dom"],
          ui: [
            "@radix-ui/react-dialog",
            "@radix-ui/react-alert-dialog",
            "@radix-ui/react-tabs",
            "@radix-ui/react-select",
            "@radix-ui/react-progress",
          ],
          supabase: ["@supabase/supabase-js"],
          utils: ["date-fns", "lucide-react"],
        },
      },
    },
  },
}));
