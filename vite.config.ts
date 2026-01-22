import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const replaceEnvVars = (content: string, env: Record<string, string>): string =>
  content
    .replace("${VITE_API_KEY}", env.VITE_API_KEY || "")
    .replace("${VITE_AUTH_DOMAIN}", env.VITE_AUTH_DOMAIN || "")
    .replace("${VITE_PROJECT_ID}", env.VITE_PROJECT_ID || "")
    .replace("${VITE_STORAGE_BUCKET}", env.VITE_STORAGE_BUCKET || "")
    .replace("${VITE_MESSAGING_SENDER_ID}", env.VITE_MESSAGING_SENDER_ID || "")
    .replace("${VITE_APP_ID}", env.VITE_APP_ID || "");

const createFirebaseConfigPlugin = (env: Record<string, string>) => ({
  name: "inject-firebase-config",
  writeBundle() {
    const swPath = resolve(__dirname, "dist/firebase-messaging-sw.js");
    const templatePath = resolve(__dirname, "public/firebase-messaging-sw.js");

    try {
      const template = readFileSync(templatePath, "utf-8");
      const swContent = replaceEnvVars(template, env);
      writeFileSync(swPath, swContent);
      console.log("✓ Firebase messaging service worker generated");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Service worker generation failed: ${message}`);
    }
  },
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: "autoUpdate",
        devOptions: {
          enabled: true,
          type: "module",
        },
        manifest: {
          name: "Don't break the chain",
          short_name: "Don't break the chain",
          description: "Don't break the chain",
          theme_color: "#ffffff",
          background_color: "#ffffff",
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
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
        },
      }),
      createFirebaseConfigPlugin(env),
    ],

    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: "./test-setup.ts",
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
  };
});
