import { describe, expect, it, vi } from "vitest";
import demoTenantExample from "../../../contracts/examples/demo-tenant-config.json";
import readyExample from "../../../contracts/examples/ready-response.json";
import {
  getTenantConfig,
  TenantConfigNotFoundError,
  TenantConfigUnavailableError,
  type ReadyResponse,
  type TenantConfig,
} from "../src";

const demoTenant = demoTenantExample.value satisfies TenantConfig;

describe("contract examples", () => {
  it("exposes the demo tenant with generated contract types", () => {
    expect(demoTenant.tenantId).toBe("demo");
    expect(demoTenant.branding.primaryColor).toBe("#C8102E");
  });

  it("contains the readiness discriminator from the generated contract", () => {
    expect(readyExample.value.status).toBe("ready" satisfies ReadyResponse["status"]);
  });
});

describe("generated tenant SDK facade", () => {
  it("uses the configured base URL, path parameter and no-store cache", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify(demoTenant), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }),
    );

    const config = await getTenantConfig("demo", {
      apiBaseUrl: "https://api.example.invalid/",
      fetcher,
    });

    expect(config.tenantId).toBe("demo");
    expect(fetcher).toHaveBeenCalledOnce();
    const request = fetcher.mock.calls[0]?.[0];
    expect(request).toBeInstanceOf(Request);
    expect((request as Request).url).toBe("https://api.example.invalid/v1/tenants/demo/config");
    expect((request as Request).cache).toBe("no-store");
    expect((request as Request).headers.get("Accept")).toBe("application/json");
  });

  it("rejects invalid tenant keys before making a request", async () => {
    const fetcher = vi.fn<typeof fetch>();

    await expect(getTenantConfig("../other", { fetcher })).rejects.toBeInstanceOf(
      TenantConfigNotFoundError,
    );
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("maps the generated 404 response to the public not-found error", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          type: "/problems/tenant-not-found",
          title: "Mandant nicht gefunden",
          status: 404,
        }),
        {
          headers: { "Content-Type": "application/problem+json" },
          status: 404,
        },
      ),
    );

    await expect(getTenantConfig("unknown", { fetcher })).rejects.toBeInstanceOf(
      TenantConfigNotFoundError,
    );
  });

  it("maps other generated HTTP failures to an availability error", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          type: "/problems/unavailable",
          title: "Nicht verfügbar",
          status: 503,
        }),
        {
          headers: { "Content-Type": "application/problem+json" },
          status: 503,
        },
      ),
    );

    await expect(getTenantConfig("demo", { fetcher })).rejects.toMatchObject({
      status: 503,
    } satisfies Partial<TenantConfigUnavailableError>);
  });
});
