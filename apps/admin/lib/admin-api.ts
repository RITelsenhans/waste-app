export const ADMIN_API_BASE_URL = "/admin-api";

export async function adminRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${ADMIN_API_BASE_URL}${path}`, options);
  if (!response.ok) {
    const problem = (await response.json().catch(() => null)) as { detail?: string } | null;
    throw new Error(problem?.detail ?? `Anfrage fehlgeschlagen (${response.status}).`);
  }
  return (response.status === 204 ? undefined : await response.json()) as T;
}
