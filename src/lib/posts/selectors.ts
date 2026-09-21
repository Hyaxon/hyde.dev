import { getCollection } from "astro:content";

export async function getPosts() {
  return (await getCollection("posts", ({ data }) => !data.draft)).sort(
    (a, b) =>
      b.data.publishedAt.getTime() - a.data.publishedAt.getTime() ||
      a.id.localeCompare(b.id),
  );
}
