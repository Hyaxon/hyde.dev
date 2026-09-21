import { getCollection, type CollectionEntry } from "astro:content";

export type ProjectEntry =
  CollectionEntry<"githubProjects"> | CollectionEntry<"projects">;

export async function getProjects(): Promise<ProjectEntry[]> {
  const githubProjects = await getCollection(
    "githubProjects",
    ({ data }) => data.visible && !data.draft,
  );

  const manualProjects = await getCollection(
    "projects",
    ({ data }) => data.visible && !data.draft,
  );

  const projects = [...githubProjects, ...manualProjects];

  const ids = new Set<string>();
  for (const project of projects) {
    if (ids.has(project.id))
      throw new Error(`Duplicate project slug: ${project.id}`);
    ids.add(project.id);
  }

  const getTime = (project: ProjectEntry) =>
    (
      project.data.pushedAt ??
      project.data.updatedAt ??
      project.data.publishedAt
    )?.getTime() ?? 0;

  projects.sort(
    (a, b) =>
      Number(b.data.featured) - Number(a.data.featured) ||
      getTime(b) - getTime(a) ||
      a.id.localeCompare(b.id),
  );

  return projects;
}

export async function getHomepageProjects(limit = 5) {
  return (await getProjects()).slice(0, limit);
}
