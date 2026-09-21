import assert from "node:assert/strict";
import { test } from "node:test";
import { createSatteriMarkdownProcessor } from "@astrojs/markdown-satteri";
import {
  githubMarkdownPlugins,
  repositoryUrl,
} from "../src/lib/github/markdown.ts";

const fileURL = new URL(
  "https://github.com/example/project/blob/main/docs/README.md",
);

test("README URLs use the repository branch and README directory", () => {
  assert.equal(
    repositoryUrl("../guide.md#install", fileURL),
    "https://github.com/example/project/blob/main/guide.md#install",
  );
  assert.equal(
    repositoryUrl("/images/demo.png", fileURL, true),
    "https://raw.githubusercontent.com/example/project/main/images/demo.png",
  );
  for (const url of [
    "#install",
    "https://example.com",
    "mailto:hello@example.com",
    "//example.com/img.png",
  ]) {
    assert.equal(repositoryUrl(url, fileURL), url);
  }
  assert.equal(
    repositoryUrl("./image.png", new URL("file:///tmp/local.md"), true),
    "./image.png",
  );
});

test("renders GitHub Markdown, reference links, HTML images and code without corrupting URLs", async () => {
  const renderer = await createSatteriMarkdownProcessor({
    ...githubMarkdownPlugins,
    syntaxHighlight: false,
  });
  const { code } = await renderer.render(
    `
# README

[Guide](../guide.md)

![Demo](./demo.png)

![Reference image][image]

[image]: ./reference.png

[Reference][guide]

[guide]: ../reference.md

<img src="./html.png" alt="HTML image">

| Feature | Ready |
| --- | --- |
| Pages | Yes |

\`![Literal](./literal.png)\`
`,
    { fileURL },
  );
  assert.match(
    code,
    /href="https:\/\/github.com\/example\/project\/blob\/main\/guide.md"/,
  );
  assert.match(
    code,
    /src="https:\/\/raw.githubusercontent.com\/example\/project\/main\/docs\/demo.png"/,
  );
  assert.match(
    code,
    /href="https:\/\/github.com\/example\/project\/blob\/main\/reference.md"/,
  );
  assert.match(
    code,
    /src="https:\/\/raw.githubusercontent.com\/example\/project\/main\/docs\/html.png"/,
  );
  assert.match(
    code,
    /src="https:\/\/raw.githubusercontent.com\/example\/project\/main\/docs\/reference.png"/,
  );
  assert.match(code, /<table>/);
  assert.match(code, /<code>!\[Literal\]\(.\/literal.png\)<\/code>/);
});
