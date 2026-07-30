import { createClient } from "./generated/client";
import { getTenantConfig as getTenantConfigSdk } from "./generated/sdk.gen";

export type {
  Branding as TenantBranding,
  Problem,
  ReadyResponse,
  TenantConfig,
} from "./generated/types.gen";
import type { TenantConfig } from "./generated/types.gen";

const TENANT_KEY_PATTERN = /^[a-z0-9][a-z0-9-]{0,62}$/;
const FORWARD_SLASH_CODE_POINT = 47;

function removeTrailingSlashes(value: string): string {
  let end = value.length;

  while (end > 0 && value.charCodeAt(end - 1) === FORWARD_SLASH_CODE_POINT) {
    end -= 1;
  }

  return value.slice(0, end);
}

export type ApiClientOptions = {
  apiBaseUrl?: string;
  fetcher?: typeof fetch;
};

export class TenantConfigNotFoundError extends Error {
  constructor() {
    super("Tenant configuration not found");
    this.name = "TenantConfigNotFoundError";
  }
}

export class TenantConfigUnavailableError extends Error {
  readonly status: number | undefined;

  constructor(status?: number) {
    super(
      status === undefined
        ? "Tenant configuration request failed without an HTTP response"
        : `Tenant configuration request failed with status ${status}`,
    );
    this.name = "TenantConfigUnavailableError";
    this.status = status;
  }
}

export async function getTenantConfig(
  tenantKey: string,
  options: ApiClientOptions = {},
): Promise<TenantConfig> {
  if (!TENANT_KEY_PATTERN.test(tenantKey)) {
    throw new TenantConfigNotFoundError();
  }

  const apiBaseUrl = removeTrailingSlashes(options.apiBaseUrl ?? "http://localhost:8080");
  const client = createClient({
    baseUrl: apiBaseUrl,
    cache: "no-store",
    fetch: options.fetcher,
    headers: {
      Accept: "application/json",
    },
  });
  const result = await getTenantConfigSdk({
    client,
    path: {
      tenantKey,
    },
  });

  if (result.data) {
    return result.data;
  }

  const status = result.response?.status;
  if (status === 404) {
    throw new TenantConfigNotFoundError();
  }

  throw new TenantConfigUnavailableError(status);
}
