// @ts-check
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://hyde.dev",

  output: "static",

  adapter: cloudflare(),

  session: false,

  integrations: [
    mdx(),

    sitemap({
      filter: (page) => {
        const url = new URL(page);
        const segments = url.pathname.split("/").filter(Boolean);

        return segments.length <= 1;
      },
    }),
  ],
});
