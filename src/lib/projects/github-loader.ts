import type { Loader } from "astro/loaders";

import { projects } from "../../data/projects";

import {
  getRepository,
  getRepositoryReadme,
  parseGitHubRepoUrl,
} from "../github/repositories";

export function githubProjectsLoader(): Loader {
  return {
    name: "github-projects",

    async load({ store, parseData, renderMarkdown }) {
      const entries = [];

      const githubProjects = projects.filter(
        (project) => project.visible !== false,
      );

      const ids = new Set<string>();
      for (const definition of githubProjects) {
        if (
          !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(definition.slug) ||
          ids.has(definition.slug)
        ) {
          throw new Error(
            `Invalid or duplicate GitHub project slug: ${definition.slug}`,
          );
        }
        ids.add(definition.slug);
        const { owner, repo } = parseGitHubRepoUrl(definition.repo);

        const [repository, readme] = await Promise.all([
          getRepository(owner, repo),
          getRepositoryReadme(owner, repo),
        ]);

        const data = await parseData({
          id: definition.slug,

          data: {
            title: definition.title ?? repository.name,

            description: definition.description ?? repository.description ?? "",

            category: definition.category,

            tags: definition.tags ?? repository.topics ?? [],

            featured: definition.featured ?? false,

            visible: definition.visible ?? true,

            status:
              definition.status ??
              (repository.archived ? "archived" : "active"),

            repo: definition.repo,

            repoOwner: owner,
            repoName: repo,

            updatedAt: repository.updated_at,

            pushedAt: repository.pushed_at,
          },
        });

        entries.push({
          id: definition.slug,

          data,

          body: readme.body,

          rendered: await renderMarkdown(readme.body, {
            fileURL: new URL(
              `https://github.com/${owner}/${repo}/blob/${encodeURIComponent(repository.default_branch)}/${readme.path}`,
            ),
          }),
        });
      }

      store.clear();
      for (const entry of entries) store.set(entry);
    },
  };
}
