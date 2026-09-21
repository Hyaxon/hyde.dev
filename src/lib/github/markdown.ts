import type { SatteriMarkdownProcessorOptions } from "@astrojs/markdown-satteri";

// Resolve README assets relative to the actual README location, including docs/.
export function repositoryUrl(
  value: string,
  fileURL: URL | undefined,
  image = false,
) {
  if (
    !fileURL ||
    fileURL.hostname !== "github.com" ||
    !fileURL.pathname.includes("/blob/")
  )
    return value;
  if (
    !value ||
    value.startsWith("#") ||
    /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(value)
  )
    return value;
  const [, owner, repo, , branch] = fileURL.pathname.split("/");
  const base = image
    ? new URL(
        fileURL.href
          .replace("https://github.com/", "https://raw.githubusercontent.com/")
          .replace("/blob/", "/"),
      )
    : fileURL;
  const root = image
    ? `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/`
    : `https://github.com/${owner}/${repo}/blob/${branch}/`;
  return new URL(value.replace(/^\//, ""), value.startsWith("/") ? root : base)
    .href;
}

export const githubMarkdownPlugins: SatteriMarkdownProcessorOptions = {
  mdastPlugins: [
    {
      name: "github-readme-images",
      image(node, ctx) {
        ctx.setProperty(
          node,
          "url",
          repositoryUrl(node.url, ctx.fileURL, true),
        );
      },
    },
  ],
  hastPlugins: [
    {
      name: "github-readme-urls",
      element: {
        filter: [],
        visit(node, ctx) {
          for (const property of ["href", "src", "poster"]) {
            const value = node.properties[property];
            if (typeof value === "string") {
              ctx.setProperty(
                node,
                property,
                repositoryUrl(value, ctx.fileURL, property !== "href"),
              );
            }
          }
        },
      },
      raw(node, ctx) {
        const value = node.value.replace(
          /(\s)(href|src|poster)=("[^"]*"|'[^']*'|[^\s>]+)/gi,
          (match, space, attribute, quoted) => {
            const quote = /^["']/.test(quoted) ? quoted[0] : "";
            const url = quote ? quoted.slice(1, -1) : quoted;
            const resolved = repositoryUrl(
              url,
              ctx.fileURL,
              attribute.toLowerCase() !== "href",
            );
            return resolved === url
              ? match
              : `${space}${attribute}=${quote || '"'}${resolved}${quote || '"'}`;
          },
        );
        ctx.setProperty(node, "value", value);
      },
    },
  ],
};
