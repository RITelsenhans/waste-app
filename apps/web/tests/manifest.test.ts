import { describe, expect, it } from "vitest";
import manifest from "../app/manifest";

describe("web app manifest", () => {
  it("opens the protected demo in standalone mode", () => {
    expect(manifest()).toMatchObject({
      id: "/demo",
      start_url: "/demo",
      scope: "/",
      display: "standalone",
      name: "Abfall APP Pilot",
    });
  });

  it("provides install icons without claiming offline support", () => {
    const metadata = manifest();

    expect(metadata.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ src: "/icon", sizes: "512x512", type: "image/png" }),
      ]),
    );
    expect(metadata).not.toHaveProperty("serviceworker");
  });
});
