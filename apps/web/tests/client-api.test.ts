import { describe, expect, it } from "vitest";
import { normalizeClientApiBaseUrl } from "../lib/client-api";

describe("Browser-API-Basis", () => {
  it("nutzt ohne öffentliche Adresse den gleichnamigen Vercel-Proxy", () => {
    expect(normalizeClientApiBaseUrl()).toBe("");
    expect(`${normalizeClientApiBaseUrl()}/v1/tenants`).toBe("/v1/tenants");
  });

  it("normalisiert eine ausdrücklich konfigurierte Browser-Adresse", () => {
    expect(normalizeClientApiBaseUrl("https://api.example.invalid///")).toBe(
      "https://api.example.invalid",
    );
  });
});
