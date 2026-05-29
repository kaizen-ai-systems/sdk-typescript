import { defineConfig } from "vitest/config";

export default defineConfig({
  // SDK tests have no CSS or DOM concerns; pin postcss to an empty plugin set
  // so vitest does not walk up and load the monorepo root's
  // postcss.config.mjs (which depends on tailwind that the SDK package
  // intentionally does not install).
  css: {
    postcss: {
      plugins: [],
    },
  },
});
