// @ts-check
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import mdx from "@astrojs/mdx";
import { satteri } from "@astrojs/markdown-satteri";
import { githubMarkdownPlugins } from "./src/lib/github/markdown.ts";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://hyde.dev",

  output: "static",

  adapter: cloudflare(),

  session: false,

  markdown: { processor: satteri(githubMarkdownPlugins) },

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
