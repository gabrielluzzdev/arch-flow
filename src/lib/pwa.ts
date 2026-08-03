export function registerServiceWorker() {
  // O service worker só existe no build de produção (gerado pelo vite-plugin-pwa).
  if (!import.meta.env.PROD) return;
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.error("Falha ao registrar o service worker", err);
    });
  });
}
