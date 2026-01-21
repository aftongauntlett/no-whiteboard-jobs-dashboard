// @ts-check
import { defineConfig } from "astro/config";
import { fileURLToPath, URL } from "node:url";

import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  build: {
    // Avoid brief unstyled flashes on navigation by embedding critical CSS.
    // This is especially noticeable with dark mode + background tokens.
    inlineStylesheets: "always",
  },
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@data": fileURLToPath(new URL("./src/data", import.meta.url)),
      },
    },
  },
});
