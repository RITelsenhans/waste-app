import { describe, expect, it, vi } from "vitest";
import {
  getTenantConfig,
  TenantConfigNotFoundError,
  TenantConfigUnavailableError,
} from "../lib/tenant-config";

describe("getTenantConfig", () => {
  it("loads the requested tenant without caching", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          tenantId: "demo",
          name: "Demo Kommune",
          shortName: "Demo",
          branding: {
            logoUrl: "/regio-it-logo.png",
            primaryColor: "#C8102E",
            infoColor: "#008F8C",
          },
          timezone: "Europe/Berlin",
          locales: ["de-DE"],
          enabledFeatures: { home: true },
          legalLinks: { imprint: "#", privacy: "#", accessibility: "#" },
          serviceArea: {
            city: "Demo-Stadt",
            reportingOffice: "Bürgerservice Abfall",
            phone: "0241 000000",
            email: "abfall@example.invalid",
          },
          supportContacts: [],
          contentVersion: "test",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const config = await getTenantConfig("demo", fetcher);
    const request = fetcher.mock.calls[0]?.[0];

    expect(config.tenantId).toBe("demo");
    expect(request).toBeInstanceOf(Request);
    expect((request as Request).url).toBe("http://localhost:8080/v1/tenants/demo/config");
    expect((request as Request).cache).toBe("no-store");
  });

  it("rejects invalid tenant keys without making a request", async () => {
    const fetcher = vi.fn<typeof fetch>();

    await expect(getTenantConfig("../other", fetcher)).rejects.toBeInstanceOf(
      TenantConfigNotFoundError,
    );
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("maps a missing tenant to a dedicated error", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 404 }));

    await expect(getTenantConfig("unknown", fetcher)).rejects.toBeInstanceOf(
      TenantConfigNotFoundError,
    );
  });

  it("preserves non-404 failures as availability errors", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 503 }));

    await expect(getTenantConfig("demo", fetcher)).rejects.toBeInstanceOf(
      TenantConfigUnavailableError,
    );
  });
});
