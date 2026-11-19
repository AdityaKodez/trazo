const GITHUB_API_BASE = "https://api.github.com/repos";

export async function fetchGitHubStars(repo: string): Promise<number | null> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "trazo-site",
  };

  const token = process.env.GITHUB_TOKEN?.trim();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${GITHUB_API_BASE}/${repo}`, {
      headers,
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(3500),
    });

    if (!response.ok) {
      return null;
    }

    const data: unknown = await response.json();
    if (
      typeof data === "object" &&
      data !== null &&
      "stargazers_count" in data &&
      typeof data.stargazers_count === "number" &&
      Number.isFinite(data.stargazers_count)
    ) {
      return data.stargazers_count;
    }

    return null;
  } catch {
    return null;
  }
}
