import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Dev-only: the production hosts (vite preview, Cloudflare) resolve a directory
// request like /orange-analytics/ to its index.html, but the dev server falls
// through to the SPA history-fallback and serves the main app instead. This
// rewrites the bare directory path so each standalone static page works in dev too.
const STANDALONE_DIRS = ["/orange-analytics", "/irep-claim"];

function serveStaticDirsInDev() {
  return {
    name: "serve-static-dirs-in-dev",
    configureServer(server: { middlewares: { use: (fn: (req: { url?: string }, res: unknown, next: () => void) => void) => void } }) {
      server.middlewares.use((req, _res, next) => {
        const u = req.url ?? "";
        if (STANDALONE_DIRS.some((dir) => u.startsWith(dir))) {
          const qIndex = u.indexOf("?");
          const path = qIndex >= 0 ? u.slice(0, qIndex) : u;
          const qs = qIndex >= 0 ? u.slice(qIndex) : "";
          // directory-style request (no file extension) -> serve its static index.html
          if (!/\.[a-zA-Z0-9]+$/.test(path)) {
            req.url = path.replace(/\/$/, "") + "/index.html" + qs;
          }
        }
        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), serveStaticDirsInDev()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    target: "es2022",
  },
});
