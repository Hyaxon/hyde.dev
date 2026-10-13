import type { Loader } from "astro/loaders";

import { projects } from "../../data/projects";

import {
  getRepository,
  getRepositoryReadme,
  getRepositoryLanguages,
  getRepositoryContributorCount,
  repositoryHomepage,
  parseGitHubRepoUrl,
} from "../github/repositories";

export function githubProjectsLoader(): Loader {
  return {
    name: "github-projects",

    async load({ store, parseData, renderMarkdown, logger }) {
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

        const repository = await getRepository(owner, repo);

        // Require an explicit public status before fetching publishable content.
        if (repository.private !== false) {
          throw new Error(
            `Refusing to publish GitHub project ${definition.slug}: repository must be public.`,
          );
        }

        // Auxiliary metadata should not prevent an otherwise valid README
        // from publishing if GitHub temporarily cannot serve these endpoints.
        const optionalMetadata = async <T>(
          label: string,
          request: Promise<T>,
        ) => {
          try {
            return await request;
          } catch {
            logger.warn(
              `Could not load ${label} for ${owner}/${repo}; omitting it.`,
            );
            return undefined;
          }
        };
        const [readme, languages, contributors] = await Promise.all([
          getRepositoryReadme(owner, repo),
          optionalMetadata("languages", getRepositoryLanguages(owner, repo)),
          optionalMetadata(
            "contributors",
            getRepositoryContributorCount(owner, repo),
          ),
        ]);

        const data = await parseData({
          id: definition.slug,

          data: {
            title: definition.title ?? repository.name,

            description: definition.description ?? repository.description ?? "",

            category: definition.category,

            tags: definition.tags ?? repository.topics ?? [],

            linkedPosts: definition.linkedPosts ?? [],

            featured: definition.featured ?? false,

            visible: definition.visible ?? true,

            status:
              definition.status ??
              (repository.archived ? "archived" : "active"),

            repo: definition.repo,

            repoOwner: owner,
            repoName: repo,

            demo: definition.demo ?? repositoryHomepage(repository.homepage),
            docs: definition.docs,
            createdAt: repository.created_at,
            repositoryStats: {
              stars: repository.stargazers_count,
              forks: repository.forks_count,
              watchers: repository.subscribers_count,
              contributors,
            },
            languages: languages ?? [],

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
