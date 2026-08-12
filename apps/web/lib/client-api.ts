export function normalizeClientApiBaseUrl(value?: string): string {
  return value?.replace(/\/+$/, "") ?? "";
}

// Ohne explizite öffentliche API-Adresse bleiben Browseraufrufe auf derselben
// Origin. Next.js leitet /v1/* dann serverseitig an API_BASE_URL weiter.
export const CLIENT_API_BASE_URL = normalizeClientApiBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL);
