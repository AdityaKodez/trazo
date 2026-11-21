const NPM_DOWNLOADS_API = "https://api.npmjs.org/downloads/point/last-week";

export async function fetchNpmDownloads(
  packageName: string,
): Promise<number | null> {
  try {
    const response = await fetch(
      `${NPM_DOWNLOADS_API}/${encodeURIComponent(packageName)}`,
      {
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(3500),
      },
    );

    if (!response.ok) {
      return null;
    }

    const data: unknown = await response.json();
    if (
      typeof data === "object" &&
      data !== null &&
      "downloads" in data &&
      typeof data.downloads === "number" &&
      Number.isSafeInteger(data.downloads) &&
      data.downloads >= 0
    ) {
      return data.downloads;
    }

    return null;
  } catch {
    return null;
  }
}
