import { githubRequest, GitHubRequestError } from "./client.ts";

export interface GitHubRepository {
  name: string;
  full_name: string;
  private: boolean;

  description: string | null;

  html_url: string;
  homepage: string | null;
  created_at: string;
  stargazers_count: number;
  forks_count: number;
  subscribers_count: number;

  updated_at: string;
  pushed_at: string;

  archived: boolean;
  topics: string[];

  default_branch: string;
}

export function parseGitHubRepoUrl(repoUrl: string) {
  const url = new URL(repoUrl);

  if (
    url.protocol !== "https:" ||
    url.hostname !== "github.com" ||
    url.username ||
    url.password
  ) {
    throw new Error(`Invalid GitHub URL: ${repoUrl}`);
  }

  const [owner, repo, ...extra] = url.pathname
    .replace(/^\/|\/$/g, "")
    .split("/");

  if (!owner || !repo || extra.length || !repo.replace(/\.git$/, "")) {
    throw new Error(`Invalid GitHub repository URL: ${repoUrl}`);
  }

  return {
    owner,
    repo: repo.replace(/\.git$/, ""),
  };
}

export function getRepository(owner: string, repo: string) {
  return githubRequest<GitHubRepository>(`/repos/${owner}/${repo}`);
}

export async function getRepositoryLanguages(owner: string, repo: string) {
  const languages = await githubRequest<Record<string, number>>(
    `/repos/${owner}/${repo}/languages`,
  );
  const entries = Object.entries(languages).filter(([, bytes]) => bytes > 0);
  const total = entries.reduce((sum, [, bytes]) => sum + bytes, 0);
  return entries
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([name, bytes]) => ({ name, percentage: (bytes / total) * 100 }));
}

export async function getRepositoryContributorCount(
  owner: string,
  repo: string,
) {
  let count = 0;
  for (let page = 1; ; page++) {
    const contributors = await githubRequest<unknown[] | undefined>(
      `/repos/${owner}/${repo}/contributors?per_page=100&page=${page}`,
    );
    // GitHub returns 204 for an empty repository.
    count += contributors?.length ?? 0;
    if (!contributors || contributors.length < 100) return count;
  }
}

export function repositoryHomepage(homepage: string | null) {
  if (!homepage) return undefined;
  try {
    const url = new URL(homepage);
    return ["https:", "http:"].includes(url.protocol) ? url.href : undefined;
  } catch {
    return undefined;
  }
}

interface GitHubReadme {
  content: string;
  encoding: string;
  path: string;
}

export async function getRepositoryReadme(owner: string, repo: string) {
  try {
    const readme = await githubRequest<GitHubReadme>(
      `/repos/${owner}/${repo}/readme`,
    );
    if (readme.encoding !== "base64") {
      throw new Error(`Unsupported README encoding: ${readme.encoding}`);
    }
    return {
      body: Buffer.from(readme.content, "base64").toString("utf8"),
      path: readme.path,
    };
  } catch (error) {
    if (error instanceof GitHubRequestError && error.status === 404) {
      return { body: "", path: "README.md" };
    }
    throw error;
  }
}
