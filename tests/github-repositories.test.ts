import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getRepositoryContributorCount,
  getRepositoryLanguages,
  repositoryHomepage,
} from "../src/lib/github/repositories.ts";

test("language percentages use byte totals and sort largest first", async (t) => {
  t.mock.method(globalThis, "fetch", async () =>
    Response.json({ CSS: 150, TypeScript: 800, HTML: 50, Empty: 0 }),
  );
  assert.deepEqual(await getRepositoryLanguages("example", "repo"), [
    { name: "TypeScript", percentage: 80 },
    { name: "CSS", percentage: 15 },
    { name: "HTML", percentage: 5 },
  ]);
});

test("empty language data has no invented percentages", async (t) => {
  t.mock.method(globalThis, "fetch", async () => Response.json({}));
  assert.deepEqual(await getRepositoryLanguages("example", "repo"), []);
});

test("contributor counts include subsequent pages", async (t) => {
  const paths: string[] = [];
  t.mock.method(globalThis, "fetch", async (url: string) => {
    paths.push(url);
    return Response.json(
      Array.from({ length: paths.length === 1 ? 100 : 3 }, () => ({
        login: "contributor",
      })),
    );
  });
  assert.equal(await getRepositoryContributorCount("example", "repo"), 103);
  assert.deepEqual(paths, [
    "https://api.github.com/repos/example/repo/contributors?per_page=100&page=1",
    "https://api.github.com/repos/example/repo/contributors?per_page=100&page=2",
  ]);
});

test("empty repositories return zero contributors on HTTP 204", async (t) => {
  t.mock.method(
    globalThis,
    "fetch",
    async () => new Response(null, { status: 204 }),
  );
  assert.equal(await getRepositoryContributorCount("example", "repo"), 0);
});

test("failed metadata requests do not masquerade as zero counts", async (t) => {
  t.mock.method(
    globalThis,
    "fetch",
    async () => new Response("Unavailable", { status: 503 }),
  );
  await assert.rejects(
    getRepositoryContributorCount("example", "repo"),
    /Status: 503/,
  );
});

test("repository homepage accepts only absolute web links", () => {
  assert.equal(
    repositoryHomepage("https://example.com"),
    "https://example.com/",
  );
  for (const homepage of [
    null,
    "",
    "example.com",
    "javascript:alert(1)",
    "ftp://example.com",
  ]) {
    assert.equal(repositoryHomepage(homepage), undefined);
  }
});
