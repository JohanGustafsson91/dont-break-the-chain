import { configDefaults, defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      // Our own service worker (src/sw.ts), so it can show reminder notifications.
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      injectManifest: {
        // Include the self-hosted fonts and icons, so the installed app looks right offline.
        globPatterns: ["**/*.{js,css,html,woff2,png,svg,ico}"],
      },
      devOptions: {
        enabled: true,
        type: "module",
      },
      manifest: {
        name: "Don't Break The Chain",
        // The label under the icon on a home screen, which fits about 12 characters.
        short_name: "DBTC",
        description: "Track your habits and build streaks.",
        theme_color: "#011627",
        background_color: "#011627",
        display: "standalone",
        icons: [
          {
            src: "/web-app-manifest-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/web-app-manifest-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/web-app-manifest-512x512.png",
            sizes: "512x512",
            type: "image/png",
            // The chain sits well inside the safe zone, so launchers can crop it to any shape.
            purpose: "maskable",
          },
        ],
      },
    }),
  ],

  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./test-setup.ts",
    // Rules tests need the Firestore emulator; they run via `pnpm test:rules`.
    exclude: [...configDefaults.exclude, "tests/**", "e2e/**"],
    css: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      exclude: [
        "node_modules/",
        "test-setup.ts",
        "**/*.css",
        "**/*.d.ts",
        "**/*.test.{ts,tsx}",
        "**/*.mockData.ts",
        "src/main.tsx",
        "src/vite-env.d.ts",
      ],
      thresholds: {
        statements: 85,
        branches: 75,
        functions: 80,
        lines: 85,
      },
    },
  },
});
