import { getTenantConfig as getGeneratedTenantConfig, type TenantConfig } from "@waste/api-client";

export {
  TenantConfigNotFoundError,
  TenantConfigUnavailableError,
  type TenantBranding,
  type TenantConfig,
} from "@waste/api-client";

export async function getTenantConfig(
  tenantKey: string,
  fetcher: typeof fetch = fetch,
): Promise<TenantConfig> {
  const apiBaseUrl = (process.env.API_BASE_URL ?? "http://localhost:8080").replace(/\/+$/, "");
  return getGeneratedTenantConfig(tenantKey, {
    apiBaseUrl,
    fetcher,
  });
}
