import { defineConfig } from "vite";

// Personal site deployed to GitHub Pages.
// If the repository is published as a project page (https://<user>.github.io/<repo>/),
// set VITE_BASE to "/<repo>/" via the build step. Defaults to "/" so local dev and
// user-page deploys (https://<user>.github.io/) just work.
export default defineConfig({
  base: process.env.VITE_BASE ?? "/",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
  },
  server: {
    open: true,
  },
});
