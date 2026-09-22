import { githubRequest, GitHubRequestError } from "./client";

export interface GitHubRepository {
  name: string;
  full_name: string;
  private: boolean;

  description: string | null;

  html_url: string;

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
