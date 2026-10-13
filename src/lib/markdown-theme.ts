import type { SatteriMarkdownProcessorOptions } from "@astrojs/markdown-satteri";

// CSS variables keep generated Markdown and MDX in sync with the site palette.
export const markdownShikiConfig: SatteriMarkdownProcessorOptions["shikiConfig"] =
  {
    theme: {
      name: "hyde-terminal",
      type: "dark",
      colors: {
        "editor.background": "var(--color-panel)",
        "editor.foreground": "var(--color-text)",
      },
      tokenColors: [
        {
          scope: ["comment", "punctuation.definition.comment"],
          settings: { foreground: "var(--color-code-comment)" },
        },
        {
          scope: ["keyword", "storage"],
          settings: { foreground: "var(--color-code-keyword)" },
        },
        {
          scope: ["string", "markup.inserted"],
          settings: { foreground: "var(--color-code-string)" },
        },
        {
          scope: ["constant", "variable.language"],
          settings: { foreground: "var(--color-code-constant)" },
        },
        {
          scope: ["entity.name.function", "support.function"],
          settings: { foreground: "var(--color-code-function)" },
        },
        {
          scope: [
            "entity.name.type",
            "support.type",
            "entity.name.tag",
            "entity.other.attribute-name",
          ],
          settings: { foreground: "var(--color-code-type)" },
        },
        {
          scope: "punctuation",
          settings: { foreground: "var(--color-code-punctuation)" },
        },
        {
          scope: ["invalid", "markup.deleted"],
          settings: { foreground: "var(--color-code-deleted)" },
        },
      ],
    },
  };
