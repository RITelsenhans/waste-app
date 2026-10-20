import { createClient } from "./generated/client";
import {
  getCollections as getCollectionsSdk,
  getTenantConfig as getTenantConfigSdk,
  searchAddresses as searchAddressesSdk,
} from "./generated/sdk.gen";

export type {
  Address,
  Branding as TenantBranding,
  CollectionEvent,
  Problem,
  ReadyResponse,
  TenantConfig,
} from "./generated/types.gen";
import type { Address, CollectionEvent, TenantConfig } from "./generated/types.gen";

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

export type AddressOverview = {
  address: Address;
  collections: CollectionEvent[];
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

export class AddressNotFoundError extends Error {
  constructor() {
    super("No matching address found");
    this.name = "AddressNotFoundError";
  }
}

export class AddressOverviewUnavailableError extends Error {
  readonly status: number | undefined;

  constructor(status?: number) {
    super(
      status === undefined
        ? "Address overview request failed without an HTTP response"
        : `Address overview request failed with status ${status}`,
    );
    this.name = "AddressOverviewUnavailableError";
    this.status = status;
  }
}

function apiClient(options: ApiClientOptions) {
  const apiBaseUrl = removeTrailingSlashes(options.apiBaseUrl ?? "http://localhost:8080");
  return createClient({
    baseUrl: apiBaseUrl,
    cache: "no-store",
    fetch: options.fetcher,
    headers: {
      Accept: "application/json",
    },
  });
}

export async function getTenantConfig(
  tenantKey: string,
  options: ApiClientOptions = {},
): Promise<TenantConfig> {
  if (!TENANT_KEY_PATTERN.test(tenantKey)) {
    throw new TenantConfigNotFoundError();
  }

  const client = apiClient(options);
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

export async function getAddressOverview(
  query: string,
  tenantId = "demo",
  options: ApiClientOptions = {},
): Promise<AddressOverview> {
  const normalizedQuery = query.trim();
  if (!TENANT_KEY_PATTERN.test(tenantId) || normalizedQuery.length < 2) {
    throw new AddressNotFoundError();
  }

  const client = apiClient(options);
  const addressResult = await searchAddressesSdk({
    client,
    query: {
      q: normalizedQuery,
      tenantId,
    },
  });

  if (!addressResult.data) {
    throw new AddressOverviewUnavailableError(addressResult.response?.status);
  }

  const address = addressResult.data[0];
  if (!address) {
    throw new AddressNotFoundError();
  }

  const collectionsResult = await getCollectionsSdk({
    client,
    path: {
      addressId: address.id,
    },
    query: {
      tenantId,
    },
  });

  if (!collectionsResult.data) {
    throw new AddressOverviewUnavailableError(collectionsResult.response?.status);
  }

  return {
    address,
    collections: collectionsResult.data,
  };
}
