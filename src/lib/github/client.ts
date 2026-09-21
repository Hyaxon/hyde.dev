const GITHUB_API = "https://api.github.com";

export async function githubRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = process.env.GITHUB_TOKEN ?? import.meta.env?.GITHUB_TOKEN;

  const headers = new Headers(init.headers);

  headers.set("Accept", "application/vnd.github+json");
  headers.set("User-Agent", "hyde.dev");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${GITHUB_API}${path}`, {
    ...init,
    headers,
    signal: init.signal ?? AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    const body = await response.text();

    throw new GitHubRequestError(
      response.status,
      [
        "GitHub API request failed",
        `Status: ${response.status} ${response.statusText}`,
        `Path: ${path}`,
        `Response: ${body}`,
      ].join("\n"),
    );
  }

  return response.json() as Promise<T>;
}

export class GitHubRequestError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "GitHubRequestError";
  }
}
