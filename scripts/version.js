export const CURRENT_VERSION = "1.3.0";
export const VERSION_FILE = "version.json";

export function compareVersions(currentVersion, latestVersion) {
  const currentParts = currentVersion.split(".").map(Number);
  const latestParts = latestVersion.split(".").map(Number);
  const maxLength = Math.max(currentParts.length, latestParts.length);

  for (let index = 0; index < maxLength; index += 1) {
    const current = currentParts[index] || 0;
    const latest = latestParts[index] || 0;

    if (latest > current) {
      return "outdated";
    }

    if (latest < current) {
      return "ahead";
    }
  }

  return "current";
}

export async function fetchLatestVersion(fetcher = fetch) {
  const cacheBuster = Date.now();
  const response = await fetcher(`${VERSION_FILE}?v=${cacheBuster}`, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("无法读取最新版本信息。");
  }

  return response.json();
}
