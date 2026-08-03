// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  // Lovable's default nitro target is Cloudflare; outside the Lovable sandbox
  // (i.e. this self-hosted deploy) we target Vercel instead.
  nitro: { preset: "vercel" },
  plugins: [
    VitePWA({
      // No index.html in this SSR app for vite-plugin-pwa to inject into — the
      // service worker is registered manually (see src/lib/pwa.ts).
      injectRegister: false,
      registerType: "autoUpdate",
      // Nitro (not plain Vite) owns the client output layout here. With the
      // "vercel" preset it writes deployable client assets to
      // .vercel/output/static — point the plugin there directly instead of
      // Vite's unused default "dist".
      outDir: ".vercel/output/static",
      includeAssets: ["favicon.ico", "robots.txt", "apple-touch-icon.png"],
      manifest: {
        name: "Luz Botelho Arquitetura",
        short_name: "Luz Botelho",
        description:
          "Sistema de gestão financeira e CRM do escritório Luz Botelho Arquitetura.",
        lang: "pt-BR",
        start_url: "/",
        scope: "/",
        display: "standalone",
        theme_color: "#B06A45",
        background_color: "#F6F3EE",
        icons: [
          { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          {
            src: "/pwa-maskable-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/pwa-maskable-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // Não há HTML estático nesta app SSR para pré-cachear: o "app shell"
        // (layout + navegação) é coberto pelo cache dos bundles JS/CSS abaixo.
        globPatterns: ["**/*.{js,css,ico,png,svg,webmanifest}"],
        navigateFallback: null,
        runtimeCaching: [
          {
            // Navegação (troca de rota / recarregar a página): tenta a rede,
            // cai para a última versão em cache quando offline.
            urlPattern: ({ request }: { request: Request }) => request.mode === "navigate",
            handler: "NetworkFirst",
            options: { cacheName: "app-shell", networkTimeoutSeconds: 3 },
          },
          {
            urlPattern: ({ url }: { url: URL }) => url.pathname.startsWith("/assets/"),
            handler: "CacheFirst",
            options: { cacheName: "assets" },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
});
